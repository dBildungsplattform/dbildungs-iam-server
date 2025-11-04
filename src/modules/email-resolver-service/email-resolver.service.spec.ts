import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../test/utils';
import { ClassLogger } from '../../core/logging/class-logger';
import { EmailMicroserviceConfig } from '../../shared/config/email-microservice.config';
import { EmailRepo } from '../email/persistence/email.repo';
import { EmailResolverService } from './email-resolver.service';
import { RolleRepo } from '../rolle/repo/rolle.repo';
import { EmailResolverModule } from './email-resolver.module';

describe('EmailResolverService', () => {
    let sut: EmailResolverService;
    let mockHttpService: HttpService;
    let emailRepo: EmailRepo;
    let configService: DeepMocked<ConfigService>;
    const emailMicroserviceConfigTrue: EmailMicroserviceConfig = {
        USE_EMAIL_MICROSERVICE: true,
        ENDPOINT: 'http://email-service/',
    }/*
    const emailMicroserviceConfigFalse: EmailMicroserviceConfig = {
        USE_EMAIL_MICROSERVICE: false,
        ENDPOINT: 'http://email-service/',
    }*/

    function mockEmailConfig(values: EmailMicroserviceConfig) {
        configService.getOrThrow.mockImplementation((key: keyof EmailMicroserviceConfig) => values[key]);
        configService.get.mockImplementation((key: keyof EmailMicroserviceConfig) => values[key]);
    }

    beforeAll(async () => {
        configService = createMock<ConfigService>();
        mockEmailConfig(emailMicroserviceConfigTrue);

        mockHttpService = createMock<HttpService>();
        mockHttpService.get = jest.fn();
        mockHttpService.post = jest.fn();
        emailRepo = createMock<EmailRepo>();
        emailRepo.getEmailAddressAndStatusForPerson = jest.fn();

        const module: TestingModule = await Test.createTestingModule({
            imports: [EmailResolverModule, ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: false })],
            providers: [
                ClassLogger,
                EmailResolverService,
                HttpService,
                EmailRepo,
                RolleRepo,
                ConfigService,
            ],
        })
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .overrideProvider(HttpService)
            .useValue(mockHttpService)
            .overrideProvider(EmailRepo)
            .useValue(emailRepo)
            .overrideProvider(ConfigService)
            .useValue(configService)
            .compile();

        sut = module.get(EmailResolverService);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {});

    beforeEach(async () => {
        //jest.clearAllMocks();
        mockEmailConfig(emailMicroserviceConfigTrue);
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
/*
    it('should use emailRepo when microservice is enabled', async () => {
        const mockPersonId: string = faker.string.uuid();
        const mockPerson: Person<true> = createMock<Person<true>>({
            id: mockPersonId,
        });
        const mockResponse = new PersonEmailResponse(EmailAddressStatus.ENABLED, 'repo@example.com');

        jest.spyOn(sut, 'shouldUseEmailMicroservice').mockReturnValue(false);
        jest.spyOn(emailRepo, 'getEmailAddressAndStatusForPerson').mockResolvedValueOnce(mockResponse);

        const result: PersonEmailResponse | undefined = await sut.getEmailAddressAndStatusForPerson(mockPerson);
        expect(result).toEqual(new PersonEmailResponse(EmailAddressStatus.ENABLED, 'test@example.com'));
    });

    it('should return undefined if microservice fails', async () => {
        const mockPersonId: string = faker.string.uuid();
        const mockPerson: Person<true> = createMock<Person<true>>({
            id: mockPersonId,
        });
        jest.spyOn(mockHttpService, 'get').mockImplementationOnce(() => {
            throw new Error('Microservice error');
        });

        const result: PersonEmailResponse | undefined = await sut.getEmailAddressAndStatusForPerson(mockPerson);
        expect(result).toBeUndefined();
    });

    it('should use emailRepo when microservice is disabled', async () => {
        const mockPersonId: string = faker.string.uuid();
        const mockPerson: Person<true> = createMock<Person<true>>({
            id: mockPersonId,
        });
        const mockResponse: PersonEmailResponse = new PersonEmailResponse(
            EmailAddressStatus.ENABLED,
            'repo@example.com',
        );

        jest.spyOn(sut, 'shouldUseEmailMicroservice').mockReturnValue(false);
        jest.spyOn(emailRepo, 'getEmailAddressAndStatusForPerson').mockResolvedValueOnce(mockResponse);

        const result: PersonEmailResponse | undefined = await sut.getEmailAddressAndStatusForPerson(mockPerson);
        expect(result).toEqual(mockResponse);
    });

    it('should return PersonEmailResponse when microservice returns valid data', async () => {
        const mockPersonId: string = faker.string.uuid();
        const mockEndpoint: string = 'http://email-service/';
        const mockEmail: string = 'test@example.com';
        const mockResponseData: EmailAddressResponse[] = createMock<EmailAddressResponse[]>([
            {
                address: mockEmail,
                status: EmailAddressStatusEnum.ACTIVE,
            },
        ]);
        const mockAxiosResponse: AxiosResponse<EmailAddressResponse[]> = createMock<
            AxiosResponse<EmailAddressResponse[]>
        >({
            data: mockResponseData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {},
        });

        jest.spyOn(mockHttpService, 'get').mockReturnValueOnce(of(mockAxiosResponse));

        const result: PersonEmailResponse | undefined = await sut.findEmail(mockEndpoint, mockPersonId);
        expect(result).toEqual(new PersonEmailResponse(EmailAddressStatus.ENABLED, mockEmail));
    });

    it('should return undefined when microservice returns empty data', async () => {
        const mockPersonId: string = faker.string.uuid();
        const mockEndpoint: string = 'http://email-service/';
        const mockAxiosResponse: AxiosResponse<EmailAddressResponse[]> = createMock<
            AxiosResponse<EmailAddressResponse[]>
        >({
            data: [],
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {},
        });

        jest.spyOn(mockHttpService, 'get').mockReturnValueOnce(of(mockAxiosResponse));

        const result: PersonEmailResponse | undefined = await sut.findEmail(mockEndpoint, mockPersonId);
        expect(result).toBeUndefined();
    });

    it('should log error and return undefined when microservice call fails', async () => {
        const mockPersonId: string = faker.string.uuid();
        const mockEndpoint: string = 'http://email-service/';
        const error: Error = new Error('Microservice failure');

        jest.spyOn(mockHttpService, 'get').mockImplementationOnce(() => {
            throw error;
        });

        const errorLoggerSpy: jest.SpyInstance = jest.spyOn(sut['logger'], 'logUnknownAsError');

        const result: PersonEmailResponse | undefined = await sut.findEmail(mockEndpoint, mockPersonId);
        expect(errorLoggerSpy).toHaveBeenCalledWith(`Failed to fetch email for person ${mockPersonId}`, error);
        expect(result).toBeUndefined();
    });

    it('should call setEmail when service provider ID is found', async () => {
        const mockPerson: PersonenkontextUpdatedPersonData = {
            id: faker.string.uuid(),
            vorname: 'Max',
            familienname: 'Mustermann',
        };
        const mockKontextData: PersonenkontextEventKontextData[] = [
            {
                id: faker.string.uuid(),
                rolleId: faker.string.uuid(),
                rolle: RollenArt.LEHR,
                orgaId: faker.string.uuid(),
                isItslearningOrga: false,
                serviceProviderExternalSystems: [],
            },
        ];
        const mockSpId: string = faker.string.uuid();
        const mockEndpoint: string = 'http://email-service/';

        jest.spyOn(sut, 'getEmailServiceProviderId').mockResolvedValueOnce(mockSpId);
        jest.spyOn(sut, 'getEndpoint').mockReturnValue(mockEndpoint);
        const setEmailSpy: jest.SpyInstance = jest.spyOn(sut, 'setEmail').mockResolvedValueOnce();

        await sut.setEmailAddressForPerson(mockPerson, mockKontextData);
        expect(setEmailSpy).toHaveBeenCalledWith(mockEndpoint, mockPerson, mockSpId);
    });

    it('should not call setEmail when no service provider ID is found', async () => {
        const mockPerson: PersonenkontextUpdatedPersonData = {
            id: faker.string.uuid(),
            vorname: 'Anna',
            familienname: 'Schmidt',
        };
        const mockKontextData: PersonenkontextEventKontextData[] = [
            {
                id: faker.string.uuid(),
                rolleId: faker.string.uuid(),
                rolle: RollenArt.LEHR,
                orgaId: faker.string.uuid(),
                isItslearningOrga: false,
                serviceProviderExternalSystems: [],
            },
        ];

        jest.spyOn(sut, 'getEmailServiceProviderId').mockResolvedValueOnce(undefined);
        const setEmailSpy: jest.SpyInstance = jest.spyOn(sut, 'setEmail');

        await sut.setEmailAddressForPerson(mockPerson, mockKontextData);
        expect(setEmailSpy).not.toHaveBeenCalled();
    });

    it('should send email data to microservice successfully', async () => {
        const mockPerson: PersonenkontextUpdatedPersonData = createMock<PersonenkontextUpdatedPersonData>({
            id: faker.string.uuid(),
            vorname: 'Max',
            familienname: 'Mustermann',
        });
        const mockSpId: string = faker.string.uuid();
        const mockEndpoint: string = 'http://email-service/';

        const mockAxiosResponse: AxiosResponse = createMock<AxiosResponse>({});

        const postSpy: jest.SpyInstance = jest
            .spyOn(mockHttpService, 'post')
            .mockReturnValueOnce(of(mockAxiosResponse));
        const loggerSpy: jest.SpyInstance = jest.spyOn(sut['logger'], 'info');

        await sut.setEmail(mockEndpoint, mockPerson, mockSpId);
        expect(postSpy).toHaveBeenCalledWith(`${mockEndpoint}write/set-email-for-person`, {
            spshPersonId: mockPerson.id,
            firstName: mockPerson.vorname,
            lastName: mockPerson.familienname,
            spshServiceProviderId: mockSpId,
        });
        expect(loggerSpy).toHaveBeenCalledWith(
            `Setting email for person ${mockPerson.id} via email microservice with spId ${mockSpId}`,
        );
    });

    it('should log error when microservice post call fails', async () => {
        const mockPerson: PersonenkontextUpdatedPersonData = createMock<PersonenkontextUpdatedPersonData>({
            id: faker.string.uuid(),
            vorname: 'Anna',
            familienname: 'Schmidt',
        });
        const mockSpId: string = faker.string.uuid();
        const mockEndpoint: string = 'http://email-service/';
        const error: Error = new Error('Microservice failure');

        jest.spyOn(mockHttpService, 'post').mockImplementationOnce(() => {
            throw error;
        });

        const errorLoggerSpy: jest.SpyInstance = jest.spyOn(sut['logger'], 'logUnknownAsError');

        await sut.setEmail(mockEndpoint, mockPerson, mockSpId);
        expect(errorLoggerSpy).toHaveBeenCalledWith(`Failed to set email for person ${mockPerson.id}`, error);
    });*/

    // ==== Tests for helper ====
/*
    it('should return true when USE_EMAIL_MICROSERVICE is true', () => {
        mockEmailConfig(emailMicroserviceConfigTrue);

        expect(sut.shouldUseEmailMicroservice()).toBe(true);
    });*/
    /*
    it('should return false when USE_EMAIL_MICROSERVICE is false', () => {
        jest.spyOn(configService, 'getOrThrow').mockReturnValue({
            USE_EMAIL_MICROSERVICE: false,
            ENDPOINT: 'http://email-service/',
        });

        expect(sut.shouldUseEmailMicroservice()).toBe(false);
    });

    it('should return the correct endpoint from config', () => {
        const expectedEndpoint: string = 'http://email-service/';
        jest.spyOn(configService, 'getOrThrow').mockReturnValue({
            USE_EMAIL_MICROSERVICE: true,
            ENDPOINT: expectedEndpoint,
        });

        expect(sut.getEndpoint()).toBe(expectedEndpoint);
    });*/
/*
    it('should map email status correctly', () => {
        expect(sut.mapStatus(EmailAddressStatusEnum.PENDING)).toBe(EmailAddressStatus.REQUESTED);
        expect(sut.mapStatus(EmailAddressStatusEnum.ACTIVE)).toBe(EmailAddressStatus.ENABLED);
        expect(sut.mapStatus(EmailAddressStatusEnum.DEACTIVE)).toBe(EmailAddressStatus.DISABLED);
        expect(sut.mapStatus(EmailAddressStatusEnum.SUSPENDED)).toBe(EmailAddressStatus.DISABLED);
        expect(sut.mapStatus(EmailAddressStatusEnum.TO_BE_DELETED)).toBe(EmailAddressStatus.DELETED);
    });

    describe('getEmailServiceProviderId', () => {
        it('should return the service provider ID for EMAIL system', async () => {
            const mockRolleId: string = faker.string.uuid();
            const mockServiceProviderId: string = faker.string.uuid();
            const mockKontextData: PersonenkontextEventKontextData[] = [
                {
                    id: faker.string.uuid(),
                    rolleId: mockRolleId,
                    rolle: RollenArt.LEHR,
                    orgaId: faker.string.uuid(),
                    isItslearningOrga: false,
                    serviceProviderExternalSystems: [],
                },
            ];
            const mockServiceProvider: ServiceProvider<true> = createMock<ServiceProvider<true>>({
                id: mockServiceProviderId,
                externalSystem: ServiceProviderSystem.EMAIL,
            });
            const mockRolle: Rolle<true> = createMock<Rolle<true>>({
                id: mockRolleId,
                serviceProviderData: [mockServiceProvider],
            });

            const rollenMap: Map<string, Rolle<true>> = new Map<string, Rolle<true>>();
            rollenMap.set(mockRolleId, mockRolle);

            jest.spyOn(sut['rolleRepo'], 'findByIds').mockResolvedValueOnce(rollenMap);

            const result: string | undefined = await sut.getEmailServiceProviderId(mockKontextData);
            expect(result).toBe(mockServiceProviderId);
        });

        it('should return undefined if no EMAIL service provider is found', async () => {
            const mockRolleId: string = faker.string.uuid();
            const mockServiceProviderId: string = faker.string.uuid();
            const mockKontextData: PersonenkontextEventKontextData[] = [
                {
                    id: faker.string.uuid(),
                    rolleId: mockRolleId,
                    rolle: RollenArt.LEHR,
                    orgaId: faker.string.uuid(),
                    isItslearningOrga: false,
                    serviceProviderExternalSystems: [],
                },
            ];
            const mockServiceProvider: ServiceProvider<true> = createMock<ServiceProvider<true>>({
                id: mockServiceProviderId,
                externalSystem: ServiceProviderSystem.NONE,
            });
            const mockRolle: Rolle<true> = createMock<Rolle<true>>({
                id: mockRolleId,
                serviceProviderData: [mockServiceProvider],
            });

            const rollenMap: Map<string, Rolle<true>> = new Map<string, Rolle<true>>();
            rollenMap.set(mockRolleId, mockRolle);

            jest.spyOn(sut['rolleRepo'], 'findByIds').mockResolvedValueOnce(rollenMap);

            const result: string | undefined = await sut.getEmailServiceProviderId(mockKontextData);
            expect(result).toBeUndefined();
        });

        it('should return undefined if no serviceProviderData is present', async () => {
            const mockRolleId: string = faker.string.uuid();
            const mockKontextData: PersonenkontextEventKontextData[] = [
                {
                    id: faker.string.uuid(),
                    rolleId: mockRolleId,
                    rolle: RollenArt.LEHR,
                    orgaId: faker.string.uuid(),
                    isItslearningOrga: false,
                    serviceProviderExternalSystems: [],
                },
            ];
            const mockRolle: Rolle<true> = createMock<Rolle<true>>({
                id: mockRolleId,
                serviceProviderData: [],
            });

            const rollenMap: Map<string, Rolle<true>> = new Map<string, Rolle<true>>();
            rollenMap.set(mockRolleId, mockRolle);

            jest.spyOn(sut['rolleRepo'], 'findByIds').mockResolvedValueOnce(rollenMap);

            const result: string | undefined = await sut.getEmailServiceProviderId(mockKontextData);
            expect(result).toBeUndefined();
        });
    });*/
});
