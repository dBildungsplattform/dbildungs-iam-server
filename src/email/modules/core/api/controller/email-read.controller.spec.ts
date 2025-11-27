import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailAddressStatusEnum } from '../../persistence/email-address-status.entity.js';
import { AddressWithStatusesDescDto } from '../dtos/address-with-statuses/address-with-statuses-desc.dto.js';
import { EmailAddressResponse } from '../dtos/response/email-address.response.js';
import { EmailReadController } from './email-read.controller.js';
import { APP_PIPE } from '@nestjs/core';
import { GlobalValidationPipe } from '../../../../../shared/validation/global-validation.pipe.js';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    LoggingTestModule,
} from '../../../../../../test/utils/index.js';
import { FindEmailAddressBySpshPersonIdParams } from '../dtos/params/find-email-address-by-spsh-person-id.params.js';
import { EmailAddressStatus } from '../../domain/email-address-status.js';
import { EmailAddressRepo } from '../../persistence/email-address.repo.js';
import { EmailOxModule } from '../../../ox/email-ox.module.js';

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
            .useValue(createMock<EmailAddressRepo>())
            .compile();

        emailReadController = module.get(EmailReadController);
        emailAddressRepoMock = module.get(EmailAddressRepo);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('findEmailAddressesForSpshPerson', () => {
        it('should return EmailAddressResponse[] for person with addresses and statuses', async () => {
            const spshPersonId: string = faker.string.uuid();
            const params: FindEmailAddressBySpshPersonIdParams = { spshPersonId };
            const addressWithStatuses: AddressWithStatusesDescDto = {
                emailAddress: {
                    id: faker.string.uuid(),
                    address: 'test@example.com',
                    priority: 0,
                    externalId: faker.string.uuid(),
                    spshPersonId,
                    oxUserCounter: undefined,
                    markedForCron: undefined,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                statuses: [
                    {
                        id: faker.string.uuid(),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        emailAddressId: faker.string.uuid(),
                        status: EmailAddressStatusEnum.ACTIVE,
                    },
                ],
            };
            emailAddressRepoMock.findAllEmailAddressesWithStatusesDescBySpshPersonId.mockResolvedValue([
                addressWithStatuses,
            ]);

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
            const params: FindEmailAddressBySpshPersonIdParams = { spshPersonId };
            const now: Date = new Date();
            const earlier: Date = new Date(now.getTime() - 10000);
            const addressWithStatuses: AddressWithStatusesDescDto = {
                emailAddress: {
                    id: faker.string.uuid(),
                    address: 'multi-status@example.com',
                    priority: 0,
                    externalId: faker.string.uuid(),
                    spshPersonId,
                    oxUserCounter: undefined,
                    markedForCron: undefined,
                    createdAt: earlier,
                    updatedAt: earlier,
                },
                statuses: [
                    {
                        id: faker.string.uuid(),
                        createdAt: now,
                        updatedAt: now,
                        emailAddressId: faker.string.uuid(),
                        status: EmailAddressStatusEnum.PENDING,
                    },
                    {
                        id: faker.string.uuid(),
                        createdAt: earlier,
                        updatedAt: earlier,
                        emailAddressId: faker.string.uuid(),
                        status: EmailAddressStatusEnum.SUSPENDED,
                    },
                ],
            };
            emailAddressRepoMock.findAllEmailAddressesWithStatusesDescBySpshPersonId.mockResolvedValue([
                addressWithStatuses,
            ]);

            const result: EmailAddressResponse[] = await emailReadController.findEmailAddressesByPersonId(params);
            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(EmailAddressResponse);
            expect(result[0]).toBeDefined();
            expect(result[0]!.address).toBe('multi-status@example.com');
            expect(result[0]!.status).toBe(EmailAddressStatusEnum.PENDING);
        });

        it('should return empty array if no addresses found', async () => {
            const spshPersonId: string = faker.string.uuid();
            emailAddressRepoMock.findAllEmailAddressesWithStatusesDescBySpshPersonId.mockResolvedValue([]);

            const result: EmailAddressResponse[] = await emailReadController.findEmailAddressesByPersonId({
                spshPersonId,
            });
            expect(result).toEqual([]);
        });

        it('should filter out addresses with no statuses', async () => {
            const spshPersonId: string = faker.string.uuid();
            const params: FindEmailAddressBySpshPersonIdParams = { spshPersonId };
            const addressWithNoStatus: AddressWithStatusesDescDto = {
                emailAddress: {
                    id: faker.string.uuid(),
                    address: 'no-status@example.com',
                    priority: 0,
                    externalId: faker.string.uuid(),
                    spshPersonId,
                    oxUserCounter: undefined,
                    markedForCron: undefined,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                statuses: [],
            };
            emailAddressRepoMock.findAllEmailAddressesWithStatusesDescBySpshPersonId.mockResolvedValue([
                addressWithNoStatus,
            ]);

            const result: EmailAddressResponse[] = await emailReadController.findEmailAddressesByPersonId(params);
            expect(result).toEqual([]);
        });

        // This is just for test coverage, it should never be the case because we dont get undefined statuses from the service
        it('should hit the "return undefined" line when statuses.at(0) is undefined despite having length > 0', async () => {
            const spshPersonId: string = faker.string.uuid();
            const params: FindEmailAddressBySpshPersonIdParams = { spshPersonId };
            const addressWithUndefinedStatus: AddressWithStatusesDescDto = {
                emailAddress: {
                    id: faker.string.uuid(),
                    address: 'undefined-status@example.com',
                    priority: 0,
                    externalId: faker.string.uuid(),
                    spshPersonId,
                    oxUserCounter: undefined,
                    markedForCron: undefined,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                statuses: [undefined as unknown as EmailAddressStatus<true>],
            };
            emailAddressRepoMock.findAllEmailAddressesWithStatusesDescBySpshPersonId.mockResolvedValue([
                addressWithUndefinedStatus,
            ]);

            const result: EmailAddressResponse[] = await emailReadController.findEmailAddressesByPersonId(params);
            expect(result).toEqual([]);
        });
    });
});
