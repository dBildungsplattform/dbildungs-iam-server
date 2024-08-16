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
            personRepository.getPersonIfAllowed.mockResolvedValueOnce({
                ok: false,
                error: new Error('Forbidden access'),
            });

            await expect(sut.initializeSoftwareToken({ personId: 'user1' }, personPermissionsMock)).rejects.toThrow(
                new HttpException('Forbidden access', HttpStatus.FORBIDDEN),
            );
        });

        it('should return user not found if referrer is undefined', async () => {
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
            serviceMock.getTwoAuthState.mockResolvedValue(mockTokenState);
            const response: TokenStateResponse = await sut.getTwoAuthState('user1', personPermissionsMock);
            expect(response).toEqual(new TokenStateResponse(mockTokenState));
        });

        it('should successfully retrieve empty token state when user is undefined', async () => {
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
            personRepository.getPersonIfAllowed.mockResolvedValueOnce({
                ok: false,
                error: new Error('Forbidden access'),
            });

            await expect(sut.getTwoAuthState('user1', personPermissionsMock)).rejects.toThrow(
                new HttpException('Forbidden access', HttpStatus.FORBIDDEN),
            );
        });

        it('should return user not found if referrer is undefined', async () => {
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
            const person: Person<true> = getPerson();
            personRepository.getPersonIfAllowed.mockResolvedValueOnce({
                ok: true,
                value: person,
            });
            const personId: string = 'user1';
            const mockResetTokenResponse: ResetTokenResponse = createMock<ResetTokenResponse>();
            serviceMock.resetToken.mockResolvedValue(mockResetTokenResponse);

            const response: boolean = await sut.resetToken(personId, personPermissionsMock);

            expect(response).toEqual(mockResetTokenResponse.result.status);
            expect(serviceMock.resetToken).toHaveBeenCalledWith(person.referrer);
        });

        it('should return bad request if username is not given or not found', async () => {
            const personId: string = 'user1';
            personRepository.getPersonIfAllowed.mockResolvedValueOnce({
                ok: false,
                error: new Error('Forbidden access'),
            });

            await expect(sut.resetToken(personId, personPermissionsMock)).rejects.toThrow(
                new HttpException('Forbidden access', HttpStatus.FORBIDDEN),
            );
        });

        it('should return unauthorized if not authorized to reset token', async () => {
            const personId: string = 'user1';
            personRepository.getPersonIfAllowed.mockResolvedValueOnce({
                ok: true,
                value: getPerson(true),
            });

            await expect(sut.resetToken(personId, personPermissionsMock)).rejects.toThrow(
                new HttpException('User not found.', HttpStatus.BAD_REQUEST),
            );
        });
    });
});
