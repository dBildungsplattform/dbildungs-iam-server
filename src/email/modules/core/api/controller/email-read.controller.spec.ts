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
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    EmailConfigTestModule,
    LoggingTestModule,
} from '../../../../../../test/utils/index.js';
import { FindEmailAddressBySpshPersonIdPathParams } from '../dtos/params/find-email-address-by-spsh-person-id.pathparams.js';
import { EmailAddressRepo } from '../../persistence/email-address.repo.js';
import { EmailOxModule } from '../../../ox/email-ox.module.js';
import { EmailAddressNotFoundError } from '../../error/email-address-not-found.error.js';
import { EmailAddressMissingStatusError } from '../../error/email-address-missing-status.error.js';
import { EmailAddress } from '../../domain/email-address.js';
import { FindEmailAddressPathParams } from '../dtos/params/find-email-address.pathparams.js';
import { FindEmailAddressBySpshPersonIdsBodyParams } from '../dtos/params/find-email-addresses-by-spsh-person-ids.bodyparams.js';

describe('EmailReadController', () => {
    let emailReadController: EmailReadController;
    let emailAddressRepoMock: DeepMocked<EmailAddressRepo>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [LoggingTestModule, EmailOxModule, EmailConfigTestModule],
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

    describe('findEmailAddressesByPersonIds', () => {
        it('should return a map of personIds to EmailAddressResponse', async () => {
            const spshPerson1Id: string = faker.string.uuid();
            const address1: EmailAddress<true> = EmailAddress.construct({
                id: faker.string.uuid(),
                address: 'test1@example.com',
                priority: 0,
                spshPersonId: spshPerson1Id,
                oxUserCounter: undefined,
                markedForCron: undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
                externalId: spshPerson1Id,
                sortedStatuses: [
                    {
                        id: faker.string.uuid(),
                        status: EmailAddressStatusEnum.ACTIVE,
                    },
                ],
            });

            const spshPerson2Id: string = faker.string.uuid();
            const address2: EmailAddress<true> = EmailAddress.construct({
                id: faker.string.uuid(),
                address: 'test2@example.com',
                priority: 0,
                spshPersonId: spshPerson2Id,
                oxUserCounter: undefined,
                markedForCron: undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
                externalId: spshPerson2Id,
                sortedStatuses: [
                    {
                        id: faker.string.uuid(),
                        status: EmailAddressStatusEnum.ACTIVE,
                    },
                ],
            });

            emailAddressRepoMock.findPrimaryBySpshPersonIds.mockResolvedValueOnce(
                new Map<string, EmailAddress<true>>([
                    [spshPerson1Id, address1],
                    [spshPerson2Id, address2],
                ]),
            );

            const params: FindEmailAddressBySpshPersonIdsBodyParams = {
                spshPersonIds: [spshPerson1Id, spshPerson2Id],
            };

            const result: Record<string, EmailAddressResponse | null> =
                await emailReadController.findEmailAddressesByPersonIds(params);

            expect(Object.keys(result).length).toBe(2);

            expect(result[spshPerson1Id]).toBeInstanceOf(EmailAddressResponse);
            expect(result[spshPerson1Id]!.address).toBe('test1@example.com');
            expect(result[spshPerson1Id]!.status).toBe(EmailAddressStatusEnum.ACTIVE);

            expect(result[spshPerson2Id]).toBeInstanceOf(EmailAddressResponse);
            expect(result[spshPerson2Id]!.address).toBe('test2@example.com');
            expect(result[spshPerson2Id]!.status).toBe(EmailAddressStatusEnum.ACTIVE);
        });
    });

    it('should return null for personIds without a primary address', async () => {
        const id1: string = faker.string.uuid();
        const id2: string = faker.string.uuid();

        emailAddressRepoMock.findPrimaryBySpshPersonIds.mockResolvedValueOnce(
            new Map([
                [id1, null],
                [id2, null],
            ]),
        );

        const params: FindEmailAddressBySpshPersonIdsBodyParams = { spshPersonIds: [id1, id2] };

        const result: Record<string, EmailAddressResponse | null> =
            await emailReadController.findEmailAddressesByPersonIds(params);

        expect(Object.keys(result).length).toBe(2);
        expect(result[id1]).toBeNull();
        expect(result[id2]).toBeNull();
    });

    it('should return null when primary email address has no status', async () => {
        const personId: string = faker.string.uuid();

        const emailWithoutStatus: EmailAddress<true> = EmailAddress.construct({
            id: faker.string.uuid(),
            address: 'nostatus@example.com',
            priority: 0,
            spshPersonId: personId,
            oxUserCounter: undefined,
            markedForCron: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            externalId: personId,
            sortedStatuses: [],
        });

        emailAddressRepoMock.findPrimaryBySpshPersonIds.mockResolvedValueOnce(
            new Map([[personId, emailWithoutStatus]]),
        );

        const params: FindEmailAddressBySpshPersonIdsBodyParams = {
            spshPersonIds: [personId],
        };

        const result: Record<string, EmailAddressResponse | null> =
            await emailReadController.findEmailAddressesByPersonIds(params);

        expect(Object.keys(result).length).toBe(1);
        expect(result[personId]).toBeNull();
    });

    it('should return empty map if no personIds provided', async () => {
        const params: FindEmailAddressBySpshPersonIdsBodyParams = { spshPersonIds: [] };

        const result: Record<string, EmailAddressResponse | null> =
            await emailReadController.findEmailAddressesByPersonIds(params);

        expect(Object.keys(result).length).toBe(0);
    });
});
