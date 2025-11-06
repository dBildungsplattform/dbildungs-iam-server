import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosHeaders, AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { ConfigTestModule, DatabaseTestModule, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../../test/utils';
import { ClassLogger } from '../../../core/logging/class-logger';
import { EmailAddressResponse } from '../../../email/modules/core/api/dtos/response/email-address.response';
import { EmailAddressStatusEnum } from '../../../email/modules/core/persistence/email-address-status.entity';
import { EmailAddressStatus } from '../../email/domain/email-address';
import { PersonEmailResponse } from '../../person/api/person-email-response';
import { EmailMicroserviceModule } from '../email-microservice.module';
import { EmailResolverService } from './email-resolver.service';

type SetEmailParams = Parameters<EmailResolverService['setEmailForSpshPerson']>[0];

describe('EmailResolverService', () => {
    let module: TestingModule;
    let sut: EmailResolverService;
    let mockHttpService: DeepMocked<HttpService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                EmailMicroserviceModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: false }),
            ],
            providers: [],
        })
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .overrideProvider(HttpService)
            .useValue(createMock<HttpService>())
            .compile();

        sut = module.get(EmailResolverService);
        mockHttpService = module.get(HttpService);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
        expect(mockHttpService).toBeDefined();
    });

    it('should return PersonEmailResponse when get call returns valid data', async () => {
        const mockPersonId: string = faker.string.uuid();
        const mockEmail: string = 'test@example.com';
        const mockResponseData: EmailAddressResponse[] = [
            createMock<EmailAddressResponse>({
                address: mockEmail,
                status: EmailAddressStatusEnum.ACTIVE,
            }),
        ];
        const mockAxiosResponse: AxiosResponse<EmailAddressResponse[]> = {
            data: mockResponseData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {
                headers: new AxiosHeaders(),
            },
        };

        mockHttpService.get.mockReturnValueOnce(of(mockAxiosResponse));

        const result: PersonEmailResponse | undefined = await sut.findEmailBySpshPerson(mockPersonId);
        expect(result).toEqual(new PersonEmailResponse(EmailAddressStatus.ENABLED, mockEmail));
    });

    it('should return undefined when get call returns empty data', async () => {
        const mockPersonId: string = faker.string.uuid();

        mockHttpService.get.mockReturnValueOnce(of({} as AxiosResponse));

        const result: PersonEmailResponse | undefined = await sut.findEmailBySpshPerson(mockPersonId);
        expect(result).toBeUndefined();
    });

    it('should log error and return undefined when get call fails', async () => {
        const mockPersonId: string = faker.string.uuid();
        const error: Error = new Error('Network error');
        mockHttpService.get.mockImplementation(() => {
            throw error;
        });

        const errorLoggerSpy: jest.SpyInstance = jest.spyOn(sut['logger'], 'logUnknownAsError');

        const result: PersonEmailResponse | undefined = await sut.findEmailBySpshPerson(mockPersonId);
        expect(result).toBeUndefined();
        expect(errorLoggerSpy).toHaveBeenCalledWith(`Failed to fetch email for person ${mockPersonId}`, error);
    });

    it('should send email data to microservice successfully', async () => {
        const params: SetEmailParams = {
            spshPersonId: faker.string.uuid(),
            firstName: 'Max',
            lastName: 'Mustermann',
            spshServiceProviderId: faker.string.uuid(),
        };
        const mockAxiosResponse: AxiosResponse<EmailAddressResponse[]> = {
            data: [],
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {
                headers: new AxiosHeaders(),
            },
        };
        mockHttpService.post.mockReturnValue(of(mockAxiosResponse));
        const loggerSpy: jest.SpyInstance = jest.spyOn(sut['logger'], 'info');
        await sut.setEmailForSpshPerson(params);

        expect(mockHttpService.post).toHaveBeenCalledWith(
            expect.stringContaining('write/set-email-for-person'),
            expect.objectContaining(params),
        );
        expect(loggerSpy).toHaveBeenCalledWith(
            `Setting email for person ${params.spshPersonId} via email microservice with spId ${params.spshServiceProviderId}`,
        );
    });

    it('should log error when microservice post call fails', async () => {
        const params: SetEmailParams = {
            spshPersonId: faker.string.uuid(),
            firstName: 'Max',
            lastName: 'Mustermann',
            spshServiceProviderId: faker.string.uuid(),
        };
        const error: Error = new Error('Microservice failure');

        mockHttpService.post.mockImplementation(() => {
            throw error;
        });

        const errorLoggerSpy: jest.SpyInstance = jest.spyOn(sut['logger'], 'logUnknownAsError');

        await sut.setEmailForSpshPerson(params);
        expect(errorLoggerSpy).toHaveBeenCalledWith(`Failed to set email for person ${params.spshPersonId}`, error);
    });

    it('should return true when USE_EMAIL_MICROSERVICE is true', () => {
        expect(sut.shouldUseEmailMicroservice()).toBe(true);
    });

    it('should return false when USE_EMAIL_MICROSERVICE is false', () => {
        const configService: ConfigService = module.get(ConfigService);
        jest.spyOn(configService, 'getOrThrow').mockReturnValueOnce({
            USE_EMAIL_MICROSERVICE: false,
            ENDPOINT: 'http://email-service/',
        });

        expect(sut.shouldUseEmailMicroservice()).toBe(false);
    });

    it('should use correct endpoint from config in post call', async () => {
        const mockEndpoint: string = 'https://email.microservice/';
        const configService: ConfigService = module.get(ConfigService);
        configService.getOrThrow = jest.fn().mockReturnValue({
            ENDPOINT: mockEndpoint,
        });
        const params: SetEmailParams = {
            spshPersonId: faker.string.uuid(),
            firstName: 'Max',
            lastName: 'Mustermann',
            spshServiceProviderId: faker.string.uuid(),
        };
        const expectedUrl: string = `${mockEndpoint}write/set-email-for-person`;

        mockHttpService.post.mockReturnValueOnce(of({ status: 200 } as AxiosResponse));

        await sut.setEmailForSpshPerson(params);
        expect(mockHttpService.post).toHaveBeenCalledWith(expectedUrl, expect.objectContaining(params));
    });

    it.each([
        [EmailAddressStatusEnum.PENDING, EmailAddressStatus.REQUESTED],
        [EmailAddressStatusEnum.ACTIVE, EmailAddressStatus.ENABLED],
        [EmailAddressStatusEnum.DEACTIVE, EmailAddressStatus.DISABLED],
        [EmailAddressStatusEnum.SUSPENDED, EmailAddressStatus.DISABLED],
        [EmailAddressStatusEnum.TO_BE_DELETED, EmailAddressStatus.DELETED],
    ])('should map %s to %s', async (inputStatus: EmailAddressStatusEnum, expectedStatus: EmailAddressStatus) => {
        const mockPersonId: string = faker.string.uuid();
        const mockEmail: string = 'test@example.com';
        const mockAxiosResponse: AxiosResponse<EmailAddressResponse[]> = {
            data: [
                {
                    address: mockEmail,
                    status: inputStatus,
                    id: faker.string.uuid(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {
                headers: new AxiosHeaders(),
            },
        };

        mockHttpService.get.mockReturnValueOnce(of(mockAxiosResponse));

        const result: PersonEmailResponse | undefined = await sut.findEmailBySpshPerson(mockPersonId);
        expect(result).toEqual(new PersonEmailResponse(expectedStatus, mockEmail));
    });
});
