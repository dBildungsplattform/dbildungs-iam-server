/* eslint-disable @typescript-eslint/no-unused-vars */
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { TestingModule, Test } from '@nestjs/testing';
import { MapperTestModule, ConfigTestModule, DatabaseTestModule } from '../../../../test/utils/index.js';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { UsernameGeneratorService } from './username-generator.service.js';
import { faker } from '@faker-js/faker';
import { Person } from './person.js';
import { KeycloakClientError } from '../../../shared/error/index.js';

describe('Person', () => {
    let module: TestingModule;
    let kcUserServiceMock: DeepMocked<KeycloakUserService>;
    let usernameGeneratorService: DeepMocked<UsernameGeneratorService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule, ConfigTestModule, DatabaseTestModule.forRoot(), LoggerModule.register('Test')],
            providers: [
                {
                    provide: KeycloakUserService,
                    useValue: createMock<KeycloakUserService>(),
                },
                {
                    provide: UsernameGeneratorService,
                    useValue: createMock<UsernameGeneratorService>(),
                },
            ],
        }).compile();
        kcUserServiceMock = module.get(KeycloakUserService);
        usernameGeneratorService = module.get(UsernameGeneratorService);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('saveUser', () => {
        describe('when is a new person that needs saving', () => {
            describe('when operation succeeds', () => {
                it('should have keycloakUserId & username after save', async () => {
                    const keycloakId: string = faker.string.uuid();
                    const person: Person<false> = Person.createNew(faker.person.lastName(), faker.person.firstName());

                    usernameGeneratorService.generateUsername.mockResolvedValueOnce('testusername');

                    kcUserServiceMock.create.mockResolvedValueOnce({
                        ok: true,
                        value: keycloakId,
                    });
                    kcUserServiceMock.resetPassword.mockResolvedValueOnce({
                        ok: true,
                        value: '',
                    });
                    kcUserServiceMock.delete.mockResolvedValueOnce({ ok: true, value: undefined });

                    await person.saveUser(kcUserServiceMock, usernameGeneratorService);

                    expect(person.keycloakUserId).toEqual(keycloakId);
                    expect(person.username).toEqual('testusername');
                    expect(usernameGeneratorService.generateUsername).toHaveBeenCalled();
                    expect(kcUserServiceMock.create).toHaveBeenCalled();
                    expect(kcUserServiceMock.resetPassword).toHaveBeenCalled();
                });
            });
            describe('when kcUserService create operation fails', () => {
                it('should throw a Domain Error', async () => {
                    const person: Person<false> = Person.createNew(faker.person.lastName(), faker.person.firstName());

                    usernameGeneratorService.generateUsername.mockResolvedValueOnce('testusername');

                    kcUserServiceMock.create.mockResolvedValueOnce({
                        ok: false,
                        error: new KeycloakClientError('Demo Error'),
                    });
                    kcUserServiceMock.resetPassword.mockResolvedValueOnce({
                        ok: true,
                        value: '',
                    });
                    kcUserServiceMock.delete.mockResolvedValueOnce({ ok: true, value: undefined });

                    await expect(person.saveUser(kcUserServiceMock, usernameGeneratorService)).rejects.toThrow(
                        KeycloakClientError,
                    );
                });
            });
        });
        describe('when is an existing person that needs saving', () => {
            describe('when kcUserService resetPassword operation fails', () => {
                it('should throw a Domain Error & execute kcUserService.delete for keyCloakUserId', async () => {
                    const person: Person<true> = Person.construct(
                        faker.string.uuid(),
                        faker.date.past(),
                        faker.date.recent(),
                        faker.person.lastName(),
                        faker.person.firstName(),
                        '1',
                        faker.lorem.word(),
                        faker.lorem.word(),
                        faker.string.uuid(),
                    );

                    usernameGeneratorService.generateUsername.mockResolvedValueOnce('testusername');

                    kcUserServiceMock.create.mockResolvedValueOnce({
                        ok: true,
                        value: '',
                    });
                    kcUserServiceMock.resetPassword.mockResolvedValueOnce({
                        ok: false,
                        error: new KeycloakClientError('Demo Error'),
                    });
                    kcUserServiceMock.delete.mockResolvedValueOnce({ ok: true, value: undefined });

                    person.resetPassword(); // needed to that state is set dirty

                    await expect(person.saveUser(kcUserServiceMock, usernameGeneratorService)).rejects.toThrow(
                        KeycloakClientError,
                    );
                    expect(kcUserServiceMock.delete).toHaveBeenCalled();
                });
            });
        });
        describe('when is a person that doesnt need saving', () => {
            it('should return without calling any services', async () => {
                const person: Person<true> = Person.construct(
                    faker.string.uuid(),
                    faker.date.past(),
                    faker.date.recent(),
                    faker.person.lastName(),
                    faker.person.firstName(),
                    '1',
                    faker.lorem.word(),
                    faker.lorem.word(),
                    faker.string.uuid(),
                );

                await person.saveUser(kcUserServiceMock, usernameGeneratorService);

                expect(usernameGeneratorService.generateUsername).not.toHaveBeenCalled();
                expect(kcUserServiceMock.create).not.toHaveBeenCalled();
                expect(kcUserServiceMock.resetPassword).not.toHaveBeenCalled();
                expect(kcUserServiceMock.delete).not.toHaveBeenCalled();
            });
        });

        describe('resetPassword', () => {
            describe('when password is unset', () => {
                it('new Password should be assigned', () => {
                    const person: Person<true> = Person.construct(
                        faker.string.uuid(),
                        faker.date.past(),
                        faker.date.recent(),
                        faker.person.lastName(),
                        faker.person.firstName(),
                        '1',
                        faker.lorem.word(),
                        undefined,
                        faker.string.uuid(),
                    );

                    expect(person.newPassword).toEqual('unset');
                    person.resetPassword();
                    expect(person.newPassword).toBeDefined();
                });
            });
        });
    });
});
