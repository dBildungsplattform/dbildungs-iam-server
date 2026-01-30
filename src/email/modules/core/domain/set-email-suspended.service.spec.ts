import { faker } from '@faker-js/faker/locale/af_ZA';
import { DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseTestModule, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS, LoggingTestModule } from '../../../../../test/utils';
import { EmailConfigTestModule } from '../../../../../test/utils/email-config-test.module';
import { ClassLogger } from '../../../../core/logging/class-logger';
import { DomainError } from '../../../../shared/error';
import { EmailAddressStatusEnum } from '../persistence/email-address-status.entity';
import { EmailAddressRepo } from '../persistence/email-address.repo';
import { EmailAddress } from './email-address';
import { SetEmailSuspendedService } from './set-email-suspended.service';

describe('SetEmailSuspendedService', () => {
    let module: TestingModule;
    let sut: SetEmailSuspendedService;
    let orm: MikroORM;
    let emailAddressRepo: EmailAddressRepo;
    let loggerMock: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                LoggingTestModule,
                EmailConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
            ],
            providers: [SetEmailSuspendedService, EmailAddressRepo],
        }).compile();

        sut = module.get(SetEmailSuspendedService);
        orm = module.get(MikroORM);
        emailAddressRepo = module.get(EmailAddressRepo);
        loggerMock = module.get(ClassLogger);

        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);

        vi.resetAllMocks();
        vi.restoreAllMocks();
    });

    const buildEmail = async (
        spshPersonId: string,
        address: string,
        priority: number,
        status: EmailAddressStatusEnum,
        markedForCron?: Date,
    ): Promise<EmailAddress<true>> => {
        const emailAddress: EmailAddress<false> = EmailAddress.createNew({
            address,
            priority,
            sortedStatuses: [
                {
                    status: status,
                },
            ],
            markedForCron: markedForCron,
            spshPersonId: spshPersonId,
            oxUserCounter: undefined,
            externalId: faker.string.uuid(),
        });
        const savedEmail: Result<EmailAddress<true>, DomainError> = await emailAddressRepo.save(emailAddress);
        if (!savedEmail.ok) {
            throw savedEmail.error;
        }
        return savedEmail.value;
    };

    describe('setEmailsSuspended', () => {
        it('should log and return if no addresses are found', async () => {
            const spshPersonId: string = faker.string.uuid();

            const initial: EmailAddress<true>[] =
                await emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(spshPersonId);
            expect(initial).toHaveLength(0);

            await sut.setEmailsSuspended({ spshPersonId });

            const refreshed: EmailAddress<true>[] =
                await emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(spshPersonId);
            expect(refreshed).toHaveLength(0);

            expect(loggerMock.info).toHaveBeenCalledWith(
                `No email addresses found for spshPerson ${spshPersonId}. Skipping setting suspended.`,
            );
        });

        it('should set SUSPENDED and markedForCron 90 days for priority 0 and 1, skip > 1', async () => {
            const spshPersonId: string = faker.string.uuid();
            const inlegibleEmail: string = faker.internet.email();
            await buildEmail(spshPersonId, faker.internet.email(), 0, EmailAddressStatusEnum.ACTIVE);
            await buildEmail(spshPersonId, faker.internet.email(), 1, EmailAddressStatusEnum.ACTIVE);
            await buildEmail(spshPersonId, inlegibleEmail, 2, EmailAddressStatusEnum.PENDING);

            const before: number = Date.now();
            await sut.setEmailsSuspended({ spshPersonId: spshPersonId });
            const after: number = Date.now();

            const refreshed: EmailAddress<true>[] =
                await emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(spshPersonId);

            expect(refreshed[0]!.sortedStatuses[0]?.status).toBe(EmailAddressStatusEnum.SUSPENDED);
            expect(refreshed[1]!.sortedStatuses[0]?.status).toBe(EmailAddressStatusEnum.SUSPENDED);

            expect(refreshed[2]!.sortedStatuses[0]?.status).toBe(EmailAddressStatusEnum.PENDING);

            const DAY: number = 86_400_000;
            const expectedMin: number = before + 90 * DAY - 2_000; // small tolerance
            const expectedMax: number = after + 90 * DAY + 2_000;
            [refreshed[0], refreshed[1]].forEach((e: EmailAddress<true> | undefined) => {
                expect(e!.markedForCron instanceof Date).toBe(true);
                const t: number = e!.markedForCron!.getTime();
                expect(t).toBeGreaterThanOrEqual(expectedMin);
                expect(t).toBeLessThanOrEqual(expectedMax);
            });

            expect(loggerMock.info).toHaveBeenCalledWith(
                `Received request to set email addresses to suspended for spshPerson ${spshPersonId}.`,
            );
            expect(loggerMock.info).toHaveBeenCalledWith(
                `Priority of email address ${inlegibleEmail} is not 0 or 1. Skipping setting suspended`,
            );
        });

        it('should not update markedForCron if it already has a value', async () => {
            const spshPersonId: string = faker.string.uuid();
            await buildEmail(spshPersonId, faker.internet.email(), 0, EmailAddressStatusEnum.ACTIVE);
            await buildEmail(
                spshPersonId,
                faker.internet.email(),
                1,
                EmailAddressStatusEnum.SUSPENDED,
                new Date(Date.now()),
            );

            const before: number = Date.now();
            await sut.setEmailsSuspended({ spshPersonId: spshPersonId });
            const after: number = Date.now();

            const refreshed: EmailAddress<true>[] =
                await emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(spshPersonId);

            expect(refreshed[0]!.sortedStatuses[0]?.status).toBe(EmailAddressStatusEnum.SUSPENDED);
            expect(refreshed[1]!.sortedStatuses[0]?.status).toBe(EmailAddressStatusEnum.SUSPENDED);

            const expectedMin: number = before - 2_000; // small tolerance
            const expectedMax: number = after + 2_000;
            expect(refreshed[1]!.markedForCron instanceof Date).toBe(true);
            const t: number = refreshed[1]!.markedForCron!.getTime();
            expect(t).toBeGreaterThanOrEqual(expectedMin);
            expect(t).toBeLessThanOrEqual(expectedMax);

            expect(loggerMock.info).toHaveBeenCalledWith(
                `Received request to set email addresses to suspended for spshPerson ${spshPersonId}.`,
            );
        });
    });
});
