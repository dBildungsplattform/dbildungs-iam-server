import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { EmailAddressRepo } from './email-address.repo.js';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    expectErrResult,
    expectOkResult,
} from '../../../../../test/utils/index.js';
import { EmailAddress } from '../domain/email-address.js';
import { DomainError } from '../../../../shared/error/domain.error.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { EmailCoreModule } from '../email-core.module.js';
import { EmailAddressStatusRepo } from './email-address-status.repo.js';
import { EmailAddressStatusEnum } from './email-address-status.entity.js';
import { AddressWithStatusesDescDto } from '../api/dtos/address-with-statuses/address-with-statuses-desc.dto.js';
import { EntityNotFoundError } from '../../../../shared/error/entity-not-found.error.js';
import { EmailAddressStatus } from '../domain/email-address-status.js';

describe('EmailRepo', () => {
    let module: TestingModule;
    let sut: EmailAddressRepo;
    let emailAddressStatusRepo: EmailAddressStatusRepo;
    let orm: MikroORM;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), EmailCoreModule],
            providers: [EmailAddressStatusRepo, EmailAddressRepo, ClassLogger],
        })
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .compile();

        sut = module.get(EmailAddressRepo);
        emailAddressStatusRepo = module.get(EmailAddressStatusRepo);
        orm = module.get(MikroORM);

        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    async function createAndSaveMail(
        address?: string,
        priority?: number,
        spshPersonId?: string,
        oxUserCounter?: string,
        markedForCron?: Date,
    ): Promise<EmailAddress<true>> {
        const mailToCreate: EmailAddress<false> = EmailAddress.createNew({
            address: address ?? faker.internet.email(),
            priority: priority ?? 1,
            spshPersonId: spshPersonId ?? faker.string.uuid(),
            oxUserCounter: oxUserCounter ?? undefined,
            markedForCron: markedForCron ?? undefined,
            externalId: faker.string.uuid(),
        });
        const tmp: EmailAddress<true> | DomainError = await sut.save(mailToCreate);
        if (tmp instanceof DomainError) {
            throw tmp;
        }
        return tmp;
    }

    describe('existsEmailAddress', () => {
        let createdMail: EmailAddress<true>;

        beforeEach(async () => {
            createdMail = await createAndSaveMail();
        });

        it('should return true if email address exists', async () => {
            const result: boolean = await sut.existsEmailAddress(createdMail.address);
            expect(result).toBe(true);
        });

        it('should return false if email address does not exist', async () => {
            const result: boolean = await sut.existsEmailAddress(faker.internet.email());
            expect(result).toBe(false);
        });
    });

    describe('findBySpshPersonIdSortedByPriorityAsc', () => {
        const spshPersonId: string = faker.string.uuid();
        const otherSpshPersonId: string = faker.string.uuid();

        beforeEach(async () => {
            await createAndSaveMail(undefined, 2, spshPersonId);
            await createAndSaveMail(undefined, 0, spshPersonId);
            await createAndSaveMail(undefined, 1, spshPersonId);
            await createAndSaveMail(undefined, 1, otherSpshPersonId);
        });

        it('should return all email addresses for the given spshPersonId', async () => {
            const result: EmailAddress<true>[] = await sut.findBySpshPersonIdSortedByPriorityAsc(spshPersonId);
            expect(result).toHaveLength(3);
            const allSpshPersonIds: (string | undefined)[] = result.map((e: EmailAddress<true>) => e.spshPersonId);
            expect(allSpshPersonIds.every((id: string | undefined) => id === spshPersonId)).toBe(true);
        });

        it('should return email addresses sorted by priority ascending', async () => {
            const result: EmailAddress<true>[] = await sut.findBySpshPersonIdSortedByPriorityAsc(spshPersonId);
            const priorities: number[] = result.map((e: EmailAddress<true>) => e.priority);
            expect(priorities).toEqual([0, 1, 2]);
        });

        it('should return an empty array if no email addresses exist for the given spshPersonId', async () => {
            const unknownId: string = faker.string.uuid();
            const result: EmailAddress<true>[] = await sut.findBySpshPersonIdSortedByPriorityAsc(unknownId);
            expect(result).toEqual([]);
        });
    });

    describe('findAllEmailAddressesWithStatusesDescBySpshPersonId', () => {
        const spshPersonId: string = faker.string.uuid();

        it('should return email addresses with their statuses for a given spshPersonId', async () => {
            const mail1: EmailAddress<true> = await createAndSaveMail(undefined, 1, spshPersonId);
            const mail2: EmailAddress<true> = await createAndSaveMail(undefined, 2, spshPersonId);
            const now: Date = new Date();
            const earlier: Date = new Date(now.getTime() - 10000);

            await emailAddressStatusRepo.create({
                id: undefined,
                createdAt: earlier,
                updatedAt: earlier,
                emailAddressId: mail1.id,
                status: EmailAddressStatusEnum.PENDING,
            });
            await emailAddressStatusRepo.create({
                id: undefined,
                createdAt: now,
                updatedAt: now,
                emailAddressId: mail1.id,
                status: EmailAddressStatusEnum.ACTIVE,
            });
            await emailAddressStatusRepo.create({
                id: undefined,
                createdAt: now,
                updatedAt: now,
                emailAddressId: mail2.id,
                status: EmailAddressStatusEnum.PENDING,
            });

            const result: AddressWithStatusesDescDto[] =
                await sut.findAllEmailAddressesWithStatusesDescBySpshPersonId(spshPersonId);
            expect(result).toHaveLength(2);

            const addresses: string[] = result.map((dto: AddressWithStatusesDescDto) => dto.emailAddress.address);
            expect(addresses).toContain(mail1.address);
            expect(addresses).toContain(mail2.address);

            const mail1Dto: AddressWithStatusesDescDto | undefined = result.find(
                (dto: AddressWithStatusesDescDto) => dto.emailAddress.id === mail1.id,
            );
            expect(mail1Dto).toBeDefined();
            expect(mail1Dto!.statuses).toHaveLength(2);
            expect(mail1Dto!.statuses[0]!.status).toBe(EmailAddressStatusEnum.ACTIVE);
            expect(mail1Dto!.statuses[1]!.status).toBe(EmailAddressStatusEnum.PENDING);

            const mail2Dto: AddressWithStatusesDescDto | undefined = result.find(
                (dto: AddressWithStatusesDescDto) => dto.emailAddress.id === mail2.id,
            );
            expect(mail2Dto).toBeDefined();
            expect(mail2Dto!.statuses).toHaveLength(1);
            expect(mail2Dto!.statuses[0]!.status).toBe(EmailAddressStatusEnum.PENDING);
        });

        it('should return an empty array if no email addresses exist for the given spshPersonId', async () => {
            const unknownId: string = faker.string.uuid();
            const result: AddressWithStatusesDescDto[] =
                await sut.findAllEmailAddressesWithStatusesDescBySpshPersonId(unknownId);
            expect(result).toEqual([]);
        });
    });

    describe('save', () => {
        it('should create a new email address if id is not set', async () => {
            const mailToCreate: EmailAddress<false> = EmailAddress.createNew({
                address: faker.internet.email(),
                priority: 5,
                spshPersonId: faker.string.uuid(),
                externalId: faker.string.uuid(),
                oxUserCounter: undefined,
            });
            const result: EmailAddress<true> | DomainError = await sut.save(mailToCreate);
            expect(result).toBeDefined();
            expect(result).not.toBeInstanceOf(DomainError);
            expect((result as EmailAddress<true>).id).toBeDefined();
            expect((result as EmailAddress<true>).address).toBe(mailToCreate.address);
        });

        it('should update an existing email address if id is set', async () => {
            const mailToCreate: EmailAddress<false> = EmailAddress.createNew({
                address: faker.internet.email(),
                priority: 1,
                spshPersonId: faker.string.uuid(),
                externalId: faker.string.uuid(),
                oxUserCounter: undefined,
            });
            const created: EmailAddress<true> | DomainError = await sut.save(mailToCreate);
            if (created instanceof DomainError) {
                throw created;
            }

            const updatedMail: EmailAddress<true> = EmailAddress.construct({
                ...created,
                priority: 99,
            });
            const updated: EmailAddress<true> | DomainError = await sut.save(updatedMail);
            expect(updated).toBeDefined();
            expect(updated).not.toBeInstanceOf(DomainError);
            expect((updated as EmailAddress<true>).priority).toBe(99);
        });

        it('should return EmailAddressNotFoundError if updating non-existing id', async () => {
            const mailToUpdate: EmailAddress<true> = EmailAddress.construct({
                id: faker.string.uuid(),
                address: faker.internet.email(),
                priority: 1,
                spshPersonId: faker.string.uuid(),
                createdAt: new Date(),
                updatedAt: new Date(),
                externalId: faker.string.uuid(),
                oxUserCounter: undefined,
            });
            const result: EmailAddress<true> | DomainError = await sut.save(mailToUpdate);
            expect(result).toBeInstanceOf(DomainError);
            expect(result.constructor.name).toBe('EmailAddressNotFoundError');
        });
    });

    describe('shiftPriorities', () => {
        async function createMultipleEmails(n: number): Promise<EmailAddress<true>[]> {
            const spshPersonId: string = faker.string.uuid();
            const externalId: string = faker.string.uuid();
            const oxUserCounter: string = faker.string.numeric(5);

            const mails: EmailAddress<false>[] = Array.from({ length: n }, (_: unknown, i: number) =>
                EmailAddress.createNew({
                    address: `${i}@example.com`,
                    priority: i,
                    externalId,
                    oxUserCounter,
                    spshPersonId,
                }),
            );

            const savedMails: (EmailAddress<true> | DomainError)[] = await Promise.all(
                mails.map((m: EmailAddress<false>) => sut.save(m)),
            );

            for (const sm of savedMails) {
                if (sm instanceof Error) {
                    throw sm;
                }
            }

            return savedMails as EmailAddress<true>[];
        }

        it('should increment priorities for emails', async () => {
            const mails: EmailAddress<true>[] = await createMultipleEmails(4);
            const targetMail: EmailAddress<true> = mails[3]!;

            const result: Result<EmailAddress<true>[]> = await sut.shiftPriorities(targetMail, 0);

            expectOkResult(result);

            mails.forEach((em: EmailAddress<true>) => {
                em.priority += 1;
            });
            targetMail.priority = 0;

            for (const mail of mails) {
                expect(result.value).toContainEqual(
                    expect.objectContaining({
                        id: mail.id,
                        priority: mail.priority,
                    }),
                );
            }
        });

        it('should be able to move priority forwards', async () => {
            const mails: EmailAddress<true>[] = await createMultipleEmails(4);
            const targetMail: EmailAddress<true> = mails[0]!;

            const result: Result<EmailAddress<true>[]> = await sut.shiftPriorities(targetMail, 2);

            expectOkResult(result);

            targetMail.priority = 2;
            mails[2]!.priority = 3;
            mails[3]!.priority = 4;

            for (const mail of mails) {
                expect(result.value).toContainEqual(
                    expect.objectContaining({
                        id: mail.id,
                        priority: mail.priority,
                    }),
                );
            }
        });

        it('should return error if the target e-mail can not be found', async () => {
            const targetMail: EmailAddress<true> = EmailAddress.construct({
                id: faker.string.uuid(),
                address: faker.internet.email(),
                createdAt: new Date(),
                updatedAt: new Date(),
                externalId: faker.string.uuid(),
                oxUserCounter: faker.string.numeric(6),
                priority: 0,
                spshPersonId: faker.string.uuid(),
            });

            const result: Result<unknown> = await sut.shiftPriorities(targetMail, 0);

            expectErrResult(result);
            expect(result.error).toBeInstanceOf(EntityNotFoundError);
        });
    });

    describe('ensureStatusesAndCronDateForPerson', () => {
        it('should set markedForCron for priority >= 1', async () => {
            const personId: string = faker.string.uuid();
            const oxUserCounter: string = faker.string.uuid();

            const cronDate: Date = faker.date.future();

            await createAndSaveMail(faker.internet.email(), 0, personId, oxUserCounter, undefined);
            await createAndSaveMail(faker.internet.email(), 1, personId, oxUserCounter, undefined);
            await createAndSaveMail(faker.internet.email(), 2, personId, oxUserCounter, undefined);

            await sut.ensureStatusesAndCronDateForPerson(personId, cronDate);

            const emailsAfterwards: AddressWithStatusesDescDto[] =
                await sut.findAllEmailAddressesWithStatusesDescBySpshPersonId(personId);
            emailsAfterwards.sort(
                (a: AddressWithStatusesDescDto, b: AddressWithStatusesDescDto) =>
                    a.emailAddress.priority - b.emailAddress.priority,
            );

            expect(emailsAfterwards[0]?.emailAddress.markedForCron).toBe(undefined);
            expect(emailsAfterwards[1]?.emailAddress.markedForCron).toBe(cronDate);
            expect(emailsAfterwards[2]?.emailAddress.markedForCron).toBe(cronDate);
        });

        it('should add deactive status to active mails with high priority', async () => {
            const personId: string = faker.string.uuid();
            const oxUserCounter: string = faker.string.uuid();

            const cronDate: Date = faker.date.future();

            const mail1: EmailAddress<true> = await createAndSaveMail(
                faker.internet.email(),
                2,
                personId,
                oxUserCounter,
                undefined,
            );

            await emailAddressStatusRepo.create(
                EmailAddressStatus.createNew({
                    emailAddressId: mail1.id,
                    status: EmailAddressStatusEnum.ACTIVE,
                }),
            );

            await sut.ensureStatusesAndCronDateForPerson(personId, cronDate);

            const emailsAfterwards: AddressWithStatusesDescDto[] =
                await sut.findAllEmailAddressesWithStatusesDescBySpshPersonId(personId);

            expect(emailsAfterwards[0]?.statuses).toEqual([
                expect.objectContaining({ status: EmailAddressStatusEnum.DEACTIVE }),
                expect.objectContaining({ status: EmailAddressStatusEnum.ACTIVE }),
            ]);
        });
    });
});
