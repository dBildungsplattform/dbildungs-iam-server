import { vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '../../../../../../test/utils/createMock.js';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailAddressStatusEnum } from '../../persistence/email-address-status.entity.js';
import { EmailAddressResponse } from '../dtos/response/email-address.response.js';
import { EmailReadController } from './email-read.controller.js';
import { APP_PIPE } from '@nestjs/core';
import { GlobalValidationPipe } from '../../../../../shared/validation/global-validation.pipe.js';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    LoggingTestModule,
} from '../../../../../../test/utils/index.js';
import { FindEmailAddressBySpshPersonIdPathParams } from '../dtos/params/find-email-address-by-spsh-person-id.pathparams.js';
import { EmailAddressRepo } from '../../persistence/email-address.repo.js';
import { EmailOxModule } from '../../../ox/email-ox.module.js';
import { EmailAddressNotFoundError } from '../../error/email-address-not-found.error.js';
import { EmailAddressMissingStatusError } from '../../error/email-address-missing-status.error.js';
import { EmailAddress } from '../../domain/email-address.js';
import { FindEmailAddressPathParams } from '../dtos/params/find-email-address.pathparams.js';

describe('EmailReadController', () => {
    let emailReadController: EmailReadController;
    let emailAddressRepoMock: DeepMocked<EmailAddressRepo>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [LoggingTestModule, EmailOxModule, ConfigTestModule],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                EmailReadController,
                EmailAddressRepo,
            ],
        })
            .overrideProvider(EmailAddressRepo)
            .useValue(createMock(EmailAddressRepo))
            .compile();

        emailReadController = module.get(EmailReadController);
        emailAddressRepoMock = module.get(EmailAddressRepo);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('findEmailAddress', () => {
        it('should return address if found', async () => {
            const emailAddressToSearch: string = faker.internet.email();
            const address: EmailAddress<true> = EmailAddress.construct({
                id: faker.string.uuid(),
                address: emailAddressToSearch,
                priority: 0,
                spshPersonId: faker.string.uuid(),
                externalId: faker.string.uuid(),
                oxUserCounter: undefined,
                markedForCron: undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
                sortedStatuses: [
                    {
                        id: faker.string.uuid(),
                        status: EmailAddressStatusEnum.ACTIVE,
                    },
                ],
            });
            emailAddressRepoMock.findEmailAddress.mockResolvedValueOnce(address);

            const params: FindEmailAddressPathParams = new FindEmailAddressPathParams();
            Object.assign(params, { emailAddress: emailAddressToSearch });

            const result: Option<EmailAddressResponse> = await emailReadController.findEmailAddress(params);
            expect(result).not.toEqual(undefined);
            expect(result?.address).toEqual(emailAddressToSearch);
        });

        it('should throw if no address is found', async () => {
            const emailAddressToSearch: string = faker.internet.email();
            emailAddressRepoMock.findEmailAddress.mockResolvedValue(undefined);

            await expect(
                emailReadController.findEmailAddress({
                    emailAddress: emailAddressToSearch,
                }),
            ).rejects.toThrow(EmailAddressNotFoundError);
        });

        it('should throw if address is found but has no status', async () => {
            const emailAddressToSearch: string = faker.internet.email();
            const address: EmailAddress<true> = EmailAddress.construct({
                id: faker.string.uuid(),
                address: emailAddressToSearch,
                priority: 0,
                spshPersonId: faker.string.uuid(),
                externalId: faker.string.uuid(),
                oxUserCounter: undefined,
                markedForCron: undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
                sortedStatuses: [],
            });
            emailAddressRepoMock.findEmailAddress.mockResolvedValueOnce(address);

            await expect(
                emailReadController.findEmailAddress({
                    emailAddress: emailAddressToSearch,
                }),
            ).rejects.toThrow(EmailAddressMissingStatusError);
        });
    });

    describe('findEmailAddressesForSpshPerson', () => {
        it('should return EmailAddressResponse[] for person with addresses and statuses', async () => {
            const spshPersonId: string = faker.string.uuid();
            const params: FindEmailAddressBySpshPersonIdPathParams = new FindEmailAddressBySpshPersonIdPathParams();
            Object.assign(params, { spshPersonId });
            const address: EmailAddress<true> = EmailAddress.construct({
                id: faker.string.uuid(),
                address: 'test@example.com',
                priority: 0,
                spshPersonId,
                oxUserCounter: undefined,
                markedForCron: undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
                externalId: spshPersonId,
                sortedStatuses: [
                    {
                        id: faker.string.uuid(),
                        status: EmailAddressStatusEnum.ACTIVE,
                    },
                ],
            });
            emailAddressRepoMock.findBySpshPersonIdSortedByPriorityAsc.mockResolvedValueOnce([address]);

            const result: EmailAddressResponse[] = await emailReadController.findEmailAddressesByPersonId(params);
            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(EmailAddressResponse);
            expect(result[0]).toBeDefined();
            expect(result[0]!.address).toBe('test@example.com');
            expect(result[0]!.status).toBe(EmailAddressStatusEnum.ACTIVE);
        });

        // Maybe this test is now useless when we already test the right order in repo
        it('should return EmailAddressResponse[] using the latest status if multiple statuses exist', async () => {
            const spshPersonId: string = faker.string.uuid();
            const params: FindEmailAddressBySpshPersonIdPathParams = new FindEmailAddressBySpshPersonIdPathParams();
            Object.assign(params, { spshPersonId });
            const now: Date = new Date();
            const earlier: Date = new Date(now.getTime() - 10000);
            const address: EmailAddress<true> = EmailAddress.construct({
                id: faker.string.uuid(),
                address: 'multi-status@example.com',
                priority: 0,
                spshPersonId,
                oxUserCounter: undefined,
                markedForCron: undefined,
                createdAt: earlier,
                updatedAt: earlier,
                externalId: spshPersonId,
                sortedStatuses: [
                    {
                        id: faker.string.uuid(),
                        status: EmailAddressStatusEnum.PENDING,
                    },
                    {
                        id: faker.string.uuid(),
                        status: EmailAddressStatusEnum.SUSPENDED,
                    },
                ],
            });
            emailAddressRepoMock.findBySpshPersonIdSortedByPriorityAsc.mockResolvedValueOnce([address]);

            const result: EmailAddressResponse[] = await emailReadController.findEmailAddressesByPersonId(params);
            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(EmailAddressResponse);
            expect(result[0]).toBeDefined();
            expect(result[0]!.address).toBe('multi-status@example.com');
            expect(result[0]!.status).toBe(EmailAddressStatusEnum.PENDING);
        });

        it('should return empty array if no addresses found', async () => {
            const spshPersonId: string = faker.string.uuid();
            emailAddressRepoMock.findBySpshPersonIdSortedByPriorityAsc.mockResolvedValue([]);

            const result: EmailAddressResponse[] = await emailReadController.findEmailAddressesByPersonId({
                spshPersonId,
            });
            expect(result).toEqual([]);
        });

        it('should filter out addresses with no statuses', async () => {
            const spshPersonId: string = faker.string.uuid();
            const params: FindEmailAddressBySpshPersonIdPathParams = new FindEmailAddressBySpshPersonIdPathParams();
            Object.assign(params, { spshPersonId });
            const address: EmailAddress<true> = EmailAddress.construct({
                id: faker.string.uuid(),
                address: 'no-status@example.com',
                priority: 0,
                spshPersonId,
                oxUserCounter: undefined,
                markedForCron: undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
                externalId: spshPersonId,
                sortedStatuses: [],
            });
            emailAddressRepoMock.findBySpshPersonIdSortedByPriorityAsc.mockResolvedValueOnce([address]);

            const result: EmailAddressResponse[] = await emailReadController.findEmailAddressesByPersonId(params);
            expect(result).toEqual([]);
        });
    });
});
