import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { EmailAddressRepo } from './email-address.repo.js';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    MapperTestModule,
} from '../../../../../test/utils/index.js';
import { EmailAddress } from '../domain/email-address.js';
import { DomainError } from '../../../../shared/error/domain.error.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { SetEmailAddressForSpshPersonService } from '../domain/set-email-address-for-spsh-person.service.js';
import { EmailDomainRepo } from './email-domain.repo.js';
import { EmailCoreModule } from '../email-core.module.js';
import { EmailAddressStatusRepo } from './email-address-status.repo.js';
import { EmailAddressGenerator } from '../domain/email-address-generator.js';

describe('EmailRepo', () => {
    let module: TestingModule;
    let sut: EmailAddressRepo;
    let orm: MikroORM;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                MapperTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                EmailCoreModule,
            ],
            providers: [
                SetEmailAddressForSpshPersonService,
                EmailAddressRepo,
                EmailDomainRepo,
                EmailAddressStatusRepo,
                ClassLogger,
                EmailAddressGenerator,
            ],
        })
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .compile();
        sut = module.get(EmailAddressRepo);
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
        oxUserId?: string,
        markedForCron?: Date,
    ): Promise<EmailAddress<true>> {
        const mailToCreate: EmailAddress<false> = EmailAddress.createNew({
            address: address ?? faker.internet.email(),
            priority: priority ?? 1,
            spshPersonId: spshPersonId ?? undefined,
            oxUserId: oxUserId ?? undefined,
            markedForCron: markedForCron ?? undefined,
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

    describe('save', () => {
        it('should create a new email address if id is not set', async () => {
            const mailToCreate: EmailAddress<false> = EmailAddress.createNew({
                address: faker.internet.email(),
                priority: 5,
                spshPersonId: faker.string.uuid(),
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
            });
            const result: EmailAddress<true> | DomainError = await sut.save(mailToUpdate);
            expect(result).toBeInstanceOf(DomainError);
            expect(result.constructor.name).toBe('EmailAddressNotFoundError');
        });
    });
});
