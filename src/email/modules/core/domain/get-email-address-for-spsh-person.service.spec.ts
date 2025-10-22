import { Test, TestingModule } from '@nestjs/testing';
import { GetEmailAddressForSpshPersonService } from './get-email-address-for-spsh-person.service.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EmailAddressRepo } from '../persistence/email-address.repo.js';
import { AddressWithStatusesDescDto } from '../api/dtos/address-with-statuses/address-with-statuses-desc.dto.js';
import { faker } from '@faker-js/faker';
import { FindEmailAddressBySpshPersonIdParams } from '../api/dtos/params/find-email-address-by-spsh-person-id.params.js';

describe('GetEmailAddressForSpshPersonService', () => {
    let module: TestingModule;
    let sut: GetEmailAddressForSpshPersonService;
    let emailAddressRepoMock: DeepMocked<EmailAddressRepo>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [GetEmailAddressForSpshPersonService, EmailAddressRepo],
        })
            .overrideProvider(EmailAddressRepo)
            .useValue(createMock<EmailAddressRepo>())
            .compile();

        sut = module.get(GetEmailAddressForSpshPersonService);
        emailAddressRepoMock = module.get(EmailAddressRepo);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should return addresses with statuses if addresses exist', async () => {
        const spshPersonId: string = faker.string.uuid();
        const params: FindEmailAddressBySpshPersonIdParams = { spshPersonId };
        const addressWithStatuses: AddressWithStatusesDescDto = {
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
            statuses: [],
        };
        emailAddressRepoMock.findAllEmailAddressesWithStatusesDescBySpshPersonId.mockResolvedValue([
            addressWithStatuses,
        ]);

        const result: AddressWithStatusesDescDto[] = await sut.getEmailAddressWithStatusForSpshPerson(params);
        expect(result).toHaveLength(1);
    });

    it('should return empty array if no addresses exist', async () => {
        const spshPersonId: string = faker.string.uuid();
        const params: FindEmailAddressBySpshPersonIdParams = { spshPersonId };
        emailAddressRepoMock.findAllEmailAddressesWithStatusesDescBySpshPersonId.mockResolvedValue([]);

        const result: AddressWithStatusesDescDto[] = await sut.getEmailAddressWithStatusForSpshPerson(params);
        expect(result).toEqual([]);
    });
});
