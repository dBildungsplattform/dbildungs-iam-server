import { Test, TestingModule } from '@nestjs/testing';
import { PrivacyIdeaAdministrationController } from './privacy-idea-administration.controller.js';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { TokenStateResponse } from './token-state.response.js';
import { AssignTokenResponse, PrivacyIdeaToken } from './privacy-idea-api.types.js';
import { PersonPermissions } from '../authentication/domain/person-permissions.js';
import { PersonRepository } from '../person/persistence/person.repository.js';
import { Person } from '../person/domain/person.js';
import { faker } from '@faker-js/faker';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AssignHardwareTokenBodyParams } from './api/assign-hardware-token.body.params.js';
import { AssignHardwareTokenResponse } from './api/assign-hardware-token.response.js';
import { TokenError } from './api/error/token.error.js';
import { SchulConnexErrorMapper } from '../../shared/error/schul-connex-error.mapper.js';
import { EntityCouldNotBeCreated } from '../../shared/error/entity-could-not-be-created.error.js';

describe('PrivacyIdeaAdministrationController', () => {
    let module: TestingModule;
    let sut: PrivacyIdeaAdministrationController;
    let serviceMock: PrivacyIdeaAdministrationService;
    let personRepository: PersonRepository;
    let personPermissionsMock: DeepMocked<PersonPermissions>;

    function getPerson(emptyReferrer: boolean = false): Person<true> {
        return Person.construct(
            faker.string.uuid(),
            faker.date.past(),
            faker.date.recent(),
            faker.person.lastName(),
            faker.person.firstName(),
            '1',
            faker.lorem.word(),
            faker.lorem.word(),
            emptyReferrer ? undefined : faker.string.uuid(),
        );
    }

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [PrivacyIdeaAdministrationController],
            providers: [
                {
                    provide: PrivacyIdeaAdministrationService,
                    useValue: createMock<PrivacyIdeaAdministrationService>(),
                },
                {
                    provide: PersonRepository,
                    useValue: {
                        getPersonIfAllowed: jest.fn(),
                    },
                },
            ],
        }).compile();

        sut = module.get<PrivacyIdeaAdministrationController>(PrivacyIdeaAdministrationController);
        serviceMock = module.get<PrivacyIdeaAdministrationService>(PrivacyIdeaAdministrationService);
        personRepository = module.get<PersonRepository>(PersonRepository);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
        expect(serviceMock).toBeDefined();
    });

    describe('PrivacyIdeaAdministrationController initializeSoftwareToken', () => {
        it('should successfully create a token', async () => {
            personPermissionsMock = createMock<PersonPermissions>();
            const person: Person<true> = getPerson();

            jest.spyOn(personRepository, 'getPersonIfAllowed').mockResolvedValueOnce({
                ok: true,
                value: person,
            });

            jest.spyOn(serviceMock, 'initializeSoftwareToken').mockResolvedValue('token123');
            const response: string = await sut.initializeSoftwareToken({ personId: 'user1' }, personPermissionsMock);
            expect(response).toEqual('token123');
        });

        it('should return forbidden insufficient permissions', async () => {
            personPermissionsMock = createMock<PersonPermissions>();

            jest.spyOn(personRepository, 'getPersonIfAllowed').mockResolvedValueOnce({
                ok: false,
                error: new Error('Forbidden access'),
            });

            await expect(sut.initializeSoftwareToken({ personId: 'user1' }, personPermissionsMock)).rejects.toThrow(
                new HttpException('Forbidden access', HttpStatus.FORBIDDEN),
            );
        });

        it('should return user not found if referrer is undefined', async () => {
            personPermissionsMock = createMock<PersonPermissions>();

            jest.spyOn(personRepository, 'getPersonIfAllowed').mockResolvedValueOnce({
                ok: true,
                value: getPerson(true),
            });

            await expect(sut.initializeSoftwareToken({ personId: 'user1' }, personPermissionsMock)).rejects.toThrow(
                new HttpException('User not found.', HttpStatus.BAD_REQUEST),
            );
        });
    });

    describe('PrivacyIdeaAdministrationController getTwoAuthState', () => {
        it('should successfully retrieve token state', async () => {
            personPermissionsMock = createMock<PersonPermissions>();
            const person: Person<true> = getPerson();

            jest.spyOn(personRepository, 'getPersonIfAllowed').mockResolvedValueOnce({
                ok: true,
                value: person,
            });

            const mockTokenState: PrivacyIdeaToken = {
                serial: 'serial123',
                info: {
                    tokenkind: 'software',
                    timeWindow: '30',
                    hashlib: 'sha1',
                    timeStep: '30',
                    timeShift: '0',
                },
                active: false,
                count: 0,
                count_window: 0,
                description: '',
                failcount: 0,
                id: 0,
                locked: false,
                maxfail: 0,
                otplen: 0,
                realms: [],
                resolver: '',
                revoked: false,
                rollout_state: '',
                sync_window: 0,
                tokengroup: [],
                tokentype: '',
                user_editable: false,
                user_id: '',
                user_realm: '',
                username: '',
            };
            personPermissionsMock = createMock<PersonPermissions>();

            jest.spyOn(serviceMock, 'getTwoAuthState').mockResolvedValue(mockTokenState);
            const response: TokenStateResponse = await sut.getTwoAuthState('user1', personPermissionsMock);
            expect(response).toEqual(new TokenStateResponse(mockTokenState));
        });

        it('should successfully retrieve empty token state when user is undefined', async () => {
            personPermissionsMock = createMock<PersonPermissions>();
            const person: Person<true> = getPerson();

            jest.spyOn(personRepository, 'getPersonIfAllowed').mockResolvedValueOnce({
                ok: true,
                value: person,
            });

            personPermissionsMock = createMock<PersonPermissions>();

            jest.spyOn(serviceMock, 'getTwoAuthState').mockResolvedValue(undefined);
            const response: TokenStateResponse = await sut.getTwoAuthState('user1', personPermissionsMock);
            expect(response).toEqual(new TokenStateResponse(undefined));
        });

        it('should return forbidden insufficient permissions', async () => {
            personPermissionsMock = createMock<PersonPermissions>();

            jest.spyOn(personRepository, 'getPersonIfAllowed').mockResolvedValueOnce({
                ok: false,
                error: new Error('Forbidden access'),
            });

            await expect(sut.getTwoAuthState('user1', personPermissionsMock)).rejects.toThrow(
                new HttpException('Forbidden access', HttpStatus.FORBIDDEN),
            );
        });

        it('should return user not found if referrer is undefined', async () => {
            personPermissionsMock = createMock<PersonPermissions>();

            jest.spyOn(personRepository, 'getPersonIfAllowed').mockResolvedValueOnce({
                ok: true,
                value: getPerson(true),
            });

            await expect(sut.getTwoAuthState('user1', personPermissionsMock)).rejects.toThrow(
                new HttpException('User not found.', HttpStatus.BAD_REQUEST),
            );
        });
    });
    describe('PrivacyIdeaAdministrationController assignHardwareToken', () => {
        beforeEach(() => {
            personPermissionsMock = createMock<PersonPermissions>();
        });

        it('should successfully assign a hardware token', async () => {
            const mockParams: AssignHardwareTokenBodyParams = createMock<AssignHardwareTokenBodyParams>();
            const mockAssignTokenResponse: AssignTokenResponse = createMock<AssignTokenResponse>();
            const person: Person<true> = getPerson();

            jest.spyOn(personRepository, 'getPersonIfAllowed').mockResolvedValueOnce({
                ok: true,
                value: person,
            });

            jest.spyOn(serviceMock, 'assignHardwareToken').mockResolvedValue(mockAssignTokenResponse);
            const response: AssignHardwareTokenResponse | undefined = await sut.assignHardwareToken(
                mockParams,
                personPermissionsMock,
            );

            expect(response).toEqual(
                new AssignHardwareTokenResponse(
                    mockAssignTokenResponse.id,
                    mockAssignTokenResponse.jsonrpc,
                    mockAssignTokenResponse.time,
                    mockAssignTokenResponse.version,
                    mockAssignTokenResponse.versionnumber,
                    mockAssignTokenResponse.signature,
                    'Token wurde erfolgreich zugeordnet.',
                ),
            );
        });

        it('should return forbidden if permissions are insufficient', async () => {
            const mockParams: AssignHardwareTokenBodyParams = createMock<AssignHardwareTokenBodyParams>();

            jest.spyOn(personRepository, 'getPersonIfAllowed').mockResolvedValueOnce({
                ok: false,
                error: new Error('Forbidden access'),
            });

            await expect(sut.assignHardwareToken(mockParams, personPermissionsMock)).rejects.toThrow(
                new HttpException('Forbidden access', HttpStatus.FORBIDDEN),
            );
        });

        it('should return user not found if referrer is undefined', async () => {
            const mockParams: AssignHardwareTokenBodyParams = createMock<AssignHardwareTokenBodyParams>();

            jest.spyOn(personRepository, 'getPersonIfAllowed').mockResolvedValueOnce({
                ok: true,
                value: getPerson(true),
            });

            await expect(sut.assignHardwareToken(mockParams, personPermissionsMock)).rejects.toThrow(
                new HttpException('User not found.', HttpStatus.BAD_REQUEST),
            );
        });

        it('should throw TokenError if service throws it', async () => {
            const mockParams: AssignHardwareTokenBodyParams = createMock<AssignHardwareTokenBodyParams>();
            const tokenError: TokenError = new TokenError('Something went wrong', 'Error');
            const person: Person<true> = getPerson();
            jest.spyOn(personRepository, 'getPersonIfAllowed').mockResolvedValueOnce({
                ok: true,
                value: person,
            });

            jest.spyOn(serviceMock, 'assignHardwareToken').mockRejectedValueOnce(tokenError);

            await expect(sut.assignHardwareToken(mockParams, personPermissionsMock)).rejects.toThrow(tokenError);
        });

        it('should return mapped internal server error for unexpected error', async () => {
            const mockParams: AssignHardwareTokenBodyParams = createMock<AssignHardwareTokenBodyParams>();
            const unexpectedError: Error = new Error('Unexpected error');
            const entityCouldNotBeCreatedError: EntityCouldNotBeCreated = createMock<EntityCouldNotBeCreated>();
            const person: Person<true> = getPerson();
            jest.spyOn(personRepository, 'getPersonIfAllowed').mockResolvedValueOnce({
                ok: true,
                value: person,
            });

            jest.spyOn(serviceMock, 'assignHardwareToken').mockRejectedValue(unexpectedError);

            await expect(sut.assignHardwareToken(mockParams, personPermissionsMock)).rejects.toThrow(
                SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                    SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(entityCouldNotBeCreatedError),
                ),
            );
        });
    });
});
