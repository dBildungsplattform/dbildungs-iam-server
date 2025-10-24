import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/core';
import { EmailAddressStatusRepo } from './email-address-status.repo.js';
import { EmailAddressStatus } from '../domain/email-address-status.js';
import { EmailAddressStatusEnum } from './email-address-status.entity.js';
import { DomainError } from '../../../../shared/error/domain.error.js';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
} from '../../../../../test/utils/index.js';
import { EmailCoreModule } from '../email-core.module.js';
import { EmailAddressRepo } from './email-address.repo.js';
import { EmailAddress } from '../domain/email-address.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { createMock } from '@golevelup/ts-jest';

describe('EmailAddressStatusRepo', () => {
    let module: TestingModule;
    let sut: EmailAddressStatusRepo;
    let emailAddressRepo: EmailAddressRepo;
    let orm: MikroORM;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), EmailCoreModule],
            providers: [EmailAddressStatusRepo, EmailAddressRepo, ClassLogger],
        })
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .compile();

        sut = module.get(EmailAddressStatusRepo);
        emailAddressRepo = module.get(EmailAddressRepo);
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

    async function createAndSaveEmailAddress(): Promise<EmailAddress<true>> {
        const mailToCreate: EmailAddress<false> = EmailAddress.createNew({
            address: faker.internet.email(),
            priority: 1,
            spshPersonId: faker.string.uuid(),
        });
        const tmp: EmailAddress<true> | DomainError = await emailAddressRepo.save(mailToCreate);
        if (tmp instanceof DomainError) {
            throw tmp;
        }
        return tmp;
    }

    async function createAndSaveStatus(
        emailAddressId: string,
        status: EmailAddressStatusEnum,
    ): Promise<EmailAddressStatus<true>> {
        const statusToCreate: EmailAddressStatus<false> = EmailAddressStatus.createNew({
            emailAddressId,
            status,
        });
        const result: EmailAddressStatus<true> | DomainError = await sut.create(statusToCreate);
        if (result instanceof DomainError) {
            throw result;
        }
        return result;
    }

    describe('create', () => {
        it('should create a new EmailAddressStatus', async () => {
            const emailAddress: EmailAddress<true> = await createAndSaveEmailAddress();
            const statusToCreate: EmailAddressStatus<false> = EmailAddressStatus.createNew({
                emailAddressId: emailAddress.id,
                status: EmailAddressStatusEnum.PENDING,
            });
            const result: EmailAddressStatus<true> | DomainError = await sut.create(statusToCreate);
            expect(result).toBeDefined();
            expect(result).not.toBeInstanceOf(DomainError);
            expect(result.id).toBeDefined();
            expect(result.emailAddressId).toBe(emailAddress.id);
            expect(result.status).toBe(EmailAddressStatusEnum.PENDING);
        });
    });

    describe('findAllByEmailAddressIdSortedByCreatedAtDesc', () => {
        it('should return all statuses for the given emailAddressId sorted by createdAt descending', async () => {
            const emailAddress: EmailAddress<true> = await createAndSaveEmailAddress();
            // Create statuses with a delay to ensure different createdAt timestamps
            await createAndSaveStatus(emailAddress.id, EmailAddressStatusEnum.PENDING);
            await createAndSaveStatus(emailAddress.id, EmailAddressStatusEnum.ACTIVE);
            await createAndSaveStatus(emailAddress.id, EmailAddressStatusEnum.SUSPENDED);

            const result: EmailAddressStatus<true>[] = await sut.findAllByEmailAddressIdSortedByCreatedAtDesc(
                emailAddress.id,
            );
            expect(result).toHaveLength(3);
            expect(result[0]?.status).toBe(EmailAddressStatusEnum.SUSPENDED);
            expect(result[1]?.status).toBe(EmailAddressStatusEnum.ACTIVE);
            expect(result[2]?.status).toBe(EmailAddressStatusEnum.PENDING);
        });

        it('should return an empty array if no statuses exist for the given emailAddressId', async () => {
            const unknownId: string = faker.string.uuid();
            const result: EmailAddressStatus<true>[] =
                await sut.findAllByEmailAddressIdSortedByCreatedAtDesc(unknownId);
            expect(result).toEqual([]);
        });
    });
});
