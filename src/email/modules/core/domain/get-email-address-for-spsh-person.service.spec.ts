import { Test, TestingModule } from '@nestjs/testing';
import { GetEmailAddressForSpshPersonService } from './get-email-address-for-spsh-person.service.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { EmailAddressRepo } from '../persistence/email-address.repo.js';
import { AddressWithStatusesDto } from '../api/dtos/address-with-statuses/address-with-statuses.dto.js';
import { faker } from '@faker-js/faker';
import { FindEmailAddressBySpshPersonIdParams } from '../api/dtos/params/find-email-address-by-spsh-person-id.params.js';

describe('GetEmailAddressForSpshPersonService', () => {
    let module: TestingModule;
    let sut: GetEmailAddressForSpshPersonService;
    let loggerMock: DeepMocked<ClassLogger>;
    let emailAddressRepoMock: DeepMocked<EmailAddressRepo>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [GetEmailAddressForSpshPersonService, ClassLogger, EmailAddressRepo],
        })
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .overrideProvider(EmailAddressRepo)
            .useValue(createMock<EmailAddressRepo>())
            .compile();

        sut = module.get(GetEmailAddressForSpshPersonService);
        loggerMock = module.get(ClassLogger);
        emailAddressRepoMock = module.get(EmailAddressRepo);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should return addresses with statuses and log if addresses exist', async () => {
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
            statuses: [],
        } as AddressWithStatusesDto;
        emailAddressRepoMock.findAllEmailAddressesWithStatusesBySpshPersonId.mockResolvedValue([addressWithStatuses]);

        const result: AddressWithStatusesDto[] = await sut.getEmailAddressWithStatusForSpshPerson(params);
        expect(result).toHaveLength(1);
        expect(loggerMock.info).toHaveBeenCalledWith(
            expect.stringContaining(`Person with id ${spshPersonId} has email addresses assigned.`),
        );
    });

    it('should return empty array and not log if no addresses exist', async () => {
        const spshPersonId: string = faker.string.uuid();
        const params: FindEmailAddressBySpshPersonIdParams = { spshPersonId };
        emailAddressRepoMock.findAllEmailAddressesWithStatusesBySpshPersonId.mockResolvedValue([]);

        const result: AddressWithStatusesDto[] = await sut.getEmailAddressWithStatusForSpshPerson(params);
        expect(result).toEqual([]);
        expect(loggerMock.info).not.toHaveBeenCalled();
    });
});
