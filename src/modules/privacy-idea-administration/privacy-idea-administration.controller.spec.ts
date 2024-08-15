import { Test, TestingModule } from '@nestjs/testing';
import { PrivacyIdeaAdministrationController } from './privacy-idea-administration.controller.js';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { TokenStateResponse } from './token-state.response.js';
import { PrivacyIdeaToken, ResetTokenResponse } from './privacy-idea-api.types.js';
import { PersonPermissions } from '../authentication/domain/person-permissions.js';
import { PersonRepository } from '../person/persistence/person.repository.js';
import { Person } from '../person/domain/person.js';
import { faker } from '@faker-js/faker';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('PrivacyIdeaAdministrationController', () => {
    let module: TestingModule;
    let sut: PrivacyIdeaAdministrationController;
    let serviceMock: DeepMocked<PrivacyIdeaAdministrationService>;
    let personRepository: DeepMocked<PersonRepository>;
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
                    useValue: createMock<PersonRepository>(),
                },
            ],
        }).compile();

        sut = module.get(PrivacyIdeaAdministrationController);
        serviceMock = module.get(PrivacyIdeaAdministrationService);
        personRepository = module.get(PersonRepository);
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

            personRepository.getPersonIfAllowed.mockResolvedValueOnce({
                ok: true,
                value: person,
            });

            serviceMock.initializeSoftwareToken.mockResolvedValue('token123');
            const response: string = await sut.initializeSoftwareToken({ personId: 'user1' }, personPermissionsMock);
            expect(response).toEqual('token123');
        });

        it('should return forbidden insufficient permissions', async () => {
            personPermissionsMock = createMock<PersonPermissions>();

            personRepository.getPersonIfAllowed.mockResolvedValueOnce({
                ok: false,
                error: new Error('Forbidden access'),
            });

            await expect(sut.initializeSoftwareToken({ personId: 'user1' }, personPermissionsMock)).rejects.toThrow(
                new HttpException('Forbidden access', HttpStatus.FORBIDDEN),
            );
        });

        it('should return user not found if referrer is undefined', async () => {
            personPermissionsMock = createMock<PersonPermissions>();

            personRepository.getPersonIfAllowed.mockResolvedValueOnce({
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

            personRepository.getPersonIfAllowed.mockResolvedValueOnce({
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

            serviceMock.getTwoAuthState.mockResolvedValue(mockTokenState);
            const response: TokenStateResponse = await sut.getTwoAuthState('user1', personPermissionsMock);
            expect(response).toEqual(new TokenStateResponse(mockTokenState));
        });

        it('should successfully retrieve empty token state when user is undefined', async () => {
            personPermissionsMock = createMock<PersonPermissions>();
            const person: Person<true> = getPerson();

            personRepository.getPersonIfAllowed.mockResolvedValueOnce({
                ok: true,
                value: person,
            });

            personPermissionsMock = createMock<PersonPermissions>();

            serviceMock.getTwoAuthState.mockResolvedValue(undefined);
            const response: TokenStateResponse = await sut.getTwoAuthState('user1', personPermissionsMock);
            expect(response).toEqual(new TokenStateResponse(undefined));
        });

        it('should return forbidden insufficient permissions', async () => {
            personPermissionsMock = createMock<PersonPermissions>();

            personRepository.getPersonIfAllowed.mockResolvedValueOnce({
                ok: false,
                error: new Error('Forbidden access'),
            });

            await expect(sut.getTwoAuthState('user1', personPermissionsMock)).rejects.toThrow(
                new HttpException('Forbidden access', HttpStatus.FORBIDDEN),
            );
        });

        it('should return user not found if referrer is undefined', async () => {
            personPermissionsMock = createMock<PersonPermissions>();

            personRepository.getPersonIfAllowed.mockResolvedValueOnce({
                ok: true,
                value: getPerson(true),
            });

            await expect(sut.getTwoAuthState('user1', personPermissionsMock)).rejects.toThrow(
                new HttpException('User not found.', HttpStatus.BAD_REQUEST),
            );
        });
    });
    describe('PrivacyIdeaAdministrationController resetToken', () => {
        it('should successfully reset a token', async () => {
            const userName: string = 'user1';
            const mockResetTokenResponse: ResetTokenResponse = createMock<ResetTokenResponse>();
            serviceMock.resetToken.mockResolvedValue(mockResetTokenResponse);

            const response: ResetTokenResponse | undefined = await sut.resetToken(userName);

            expect(response).toEqual(mockResetTokenResponse);
            expect(serviceMock.resetToken).toHaveBeenCalledWith(userName);
        });

        it('should return bad request if username is not given or not found', async () => {
            const userName: string = '';

            serviceMock.resetToken.mockRejectedValue(
                new HttpException('A username was not given or not found.', HttpStatus.BAD_REQUEST),
            );

            await expect(sut.resetToken(userName)).rejects.toThrow(
                new HttpException('A username was not given or not found.', HttpStatus.BAD_REQUEST),
            );
        });

        it('should return unauthorized if not authorized to reset token', async () => {
            const userName: string = 'user1';

            serviceMock.resetToken.mockRejectedValue(
                new HttpException('Not authorized to reset token.', HttpStatus.UNAUTHORIZED),
            );

            await expect(sut.resetToken(userName)).rejects.toThrow(
                new HttpException('Not authorized to reset token.', HttpStatus.UNAUTHORIZED),
            );
        });

        it('should return forbidden if insufficient permissions to reset token', async () => {
            const userName: string = 'user1';

            serviceMock.resetToken.mockRejectedValue(
                new HttpException('Insufficient permissions to reset token.', HttpStatus.FORBIDDEN),
            );

            await expect(sut.resetToken(userName)).rejects.toThrow(
                new HttpException('Insufficient permissions to reset token.', HttpStatus.FORBIDDEN),
            );
        });

        it('should return internal server error for unexpected error', async () => {
            const userName: string = 'user1';

            serviceMock.resetToken.mockRejectedValue(
                new HttpException('Internal server error while reseting a token.', HttpStatus.INTERNAL_SERVER_ERROR),
            );

            await expect(sut.resetToken(userName)).rejects.toThrow(
                new HttpException('Internal server error while reseting a token.', HttpStatus.INTERNAL_SERVER_ERROR),
            );
        });
    });
});
