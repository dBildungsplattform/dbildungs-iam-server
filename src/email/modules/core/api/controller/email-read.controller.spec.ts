import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { GetEmailAddressForSpshPersonService } from '../../domain/get-email-address-for-spsh-person.service.js';
import { EmailAddressStatusEnum } from '../../persistence/email-address-status.entity.js';
import { AddressWithStatusesDto } from '../dtos/address-with-statuses/address-with-statuses.dto.js';
import { EmailAddressResponse } from '../dtos/response/email-address.response.js';
import { EmailReadController } from './email-read.controller.js';
import { APP_PIPE } from '@nestjs/core';
import { GlobalValidationPipe } from '../../../../../shared/validation/global-validation.pipe.js';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS, LoggingTestModule } from '../../../../../../test/utils/index.js';
import { FindEmailAddressBySpshPersonIdParams } from '../dtos/params/find-email-address-by-spsh-person-id.params.js';

describe('EmailReadController', () => {
    let emailReadController: EmailReadController;
    let getEmailAddressForSpshPersonServiceMock: DeepMocked<GetEmailAddressForSpshPersonService>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [LoggingTestModule],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                EmailReadController,
                GetEmailAddressForSpshPersonService,
            ],
        })
            .overrideProvider(GetEmailAddressForSpshPersonService)
            .useValue(createMock<GetEmailAddressForSpshPersonService>())
            .compile();

        emailReadController = module.get(EmailReadController);
        getEmailAddressForSpshPersonServiceMock = module.get(GetEmailAddressForSpshPersonService);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('findEmailAddressesForSpshPerson', () => {
        it('should return EmailAddressResponse[] for person with addresses and statuses', async () => {
            const spshPersonId: string = faker.string.uuid();
            const params: FindEmailAddressBySpshPersonIdParams = { spshPersonId };
            const addressWithStatuses: AddressWithStatusesDto = {
                emailAddress: {
                    id: faker.string.uuid(),
                    address: 'test@example.com',
                    priority: 0,
                    spshPersonId,
                    oxUserId: undefined,
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
            } as AddressWithStatusesDto;
            getEmailAddressForSpshPersonServiceMock.getEmailAddressWithStatusForSpshPerson.mockResolvedValue([
                addressWithStatuses,
            ]);

            const result: EmailAddressResponse[] = await emailReadController.findEmailAddressesByPersonId(params);
            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(EmailAddressResponse);
            expect(result[0]).toBeDefined();
            expect(result[0]!.address).toBe('test@example.com');
            expect(result[0]!.status).toBe(EmailAddressStatusEnum.ACTIVE);
        });

        it('should return EmailAddressResponse[] using the first status if multiple statuses exist', async () => {
            const spshPersonId: string = faker.string.uuid();
            const params: FindEmailAddressBySpshPersonIdParams = { spshPersonId };
            const addressWithStatuses: AddressWithStatusesDto = {
                emailAddress: {
                    id: faker.string.uuid(),
                    address: 'multi-status@example.com',
                    priority: 0,
                    spshPersonId,
                    oxUserId: undefined,
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
                        status: EmailAddressStatusEnum.PENDING,
                    },
                    {
                        id: faker.string.uuid(),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        emailAddressId: faker.string.uuid(),
                        status: EmailAddressStatusEnum.SUSPENDED,
                    },
                ],
            } as AddressWithStatusesDto;
            getEmailAddressForSpshPersonServiceMock.getEmailAddressWithStatusForSpshPerson.mockResolvedValue([
                addressWithStatuses,
            ]);

            const result: EmailAddressResponse[] = await emailReadController.findEmailAddressesByPersonId(params);
            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(EmailAddressResponse);
            expect(result[0]).toBeDefined();
            expect(result[0]!.address).toBe('multi-status@example.com');
            expect(result[0]!.status).toBe(EmailAddressStatusEnum.SUSPENDED);
        });

        it('should return empty array if no addresses found', async () => {
            const spshPersonId: string = faker.string.uuid();
            getEmailAddressForSpshPersonServiceMock.getEmailAddressWithStatusForSpshPerson.mockResolvedValue([]);

            const result: EmailAddressResponse[] = await emailReadController.findEmailAddressesByPersonId({
                spshPersonId,
            });
            expect(result).toEqual([]);
        });

        it('should filter out addresses with no statuses', async () => {
            const spshPersonId: string = faker.string.uuid();
            const params: FindEmailAddressBySpshPersonIdParams = { spshPersonId };
            const addressWithNoStatus: AddressWithStatusesDto = {
                emailAddress: {
                    id: faker.string.uuid(),
                    address: 'no-status@example.com',
                    priority: 0,
                    spshPersonId,
                    oxUserId: undefined,
                    markedForCron: undefined,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                statuses: [],
            } as AddressWithStatusesDto;
            getEmailAddressForSpshPersonServiceMock.getEmailAddressWithStatusForSpshPerson.mockResolvedValue([
                addressWithNoStatus,
            ]);

            const result: EmailAddressResponse[] = await emailReadController.findEmailAddressesByPersonId(params);
            expect(result).toEqual([]);
        });
    });
});
