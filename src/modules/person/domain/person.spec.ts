import { faker } from '@faker-js/faker';
import { Person, PersonCreationParams } from './person.js';
import { DomainError } from '../../../shared/error/index.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { MapperTestModule } from '../../../../test/utils/mapper-test.module.js';
import { UsernameGeneratorService } from './username-generator.service.js';
import { NameValidationError } from '../../../shared/error/name-validation.error.js';

describe('Person', () => {
    let module: TestingModule;
    let usernameGeneratorService: DeepMocked<UsernameGeneratorService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, MapperTestModule],
            providers: [
                {
                    provide: UsernameGeneratorService,
                    useValue: createMock<UsernameGeneratorService>(),
                },
            ],
        }).compile();
        usernameGeneratorService = module.get(UsernameGeneratorService);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
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

                expect(person.newPassword).toEqual(undefined);
                person.resetPassword();
                expect(person.newPassword).toBeDefined();
            });
        });
    });

    describe('construct', () => {
        it('should return persisted person', () => {
            const person: Person<true> = Person.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.person.lastName(),
                faker.person.firstName(),
                '5',
                faker.lorem.word(),
                faker.lorem.word(),
                faker.string.uuid(),
            );

            expect(person).toBeDefined();
            expect(person).toBeInstanceOf(Person<true>);
            expect(person.revision).toEqual('5');
        });
    });

    describe('createNew', () => {
        describe('without password & username', () => {
            it('should return not persisted person with generated username & password', async () => {
                usernameGeneratorService.generateUsername.mockResolvedValue({ ok: true, value: '' });
                // Extracted so that the coverage analysis picks up on the file imported and doesn't complain about it not being covered
                const creationParams: PersonCreationParams = {
                    familienname: faker.person.lastName(),
                    vorname: faker.person.firstName(),
                };
                const person: Person<false> | DomainError = await Person.createNew(
                    usernameGeneratorService,
                    creationParams,
                );

                expect(person).not.toBeInstanceOf(DomainError);
                if (person instanceof DomainError) {
                    return;
                }
                expect(person).toBeDefined();
                expect(person).toBeInstanceOf(Person<false>);
                expect(person.username).toBeDefined();
                expect(person.newPassword).toBeDefined();
                expect(person.isNewPasswordTemporary).toEqual(true);
                expect(person.revision).toEqual('1');
            });
        });
        describe('with fixed password & username', () => {
            it('should return not persisted person with fixed username & password', async () => {
                usernameGeneratorService.generateUsername.mockResolvedValue({ ok: true, value: '' });
                const person: Person<false> | DomainError = await Person.createNew(usernameGeneratorService, {
                    familienname: faker.person.lastName(),
                    vorname: faker.person.firstName(),
                    username: 'testusername',
                    password: 'testpassword',
                });

                expect(person).not.toBeInstanceOf(DomainError);
                if (person instanceof DomainError) {
                    return;
                }
                expect(person).toBeDefined();
                expect(person).toBeInstanceOf(Person<false>);
                expect(person.username).toEqual('testusername');
                expect(person.newPassword).toEqual('testpassword');
                expect(person.isNewPasswordTemporary).toEqual(false);
                expect(person.revision).toEqual('1');
            });
        });
        describe('name validation', () => {
            it('should return an error if the vorname starts with whitespace', async () => {
                const creationParams: PersonCreationParams = {
                    familienname: 'Mustermann',
                    vorname: ' Max',
                };
                const result: DomainError | Person<false> = await Person.createNew(
                    usernameGeneratorService,
                    creationParams,
                );
                expect(result).toBeInstanceOf(NameValidationError);
            });

            it('should return an error if the familienname ends with whitespace', async () => {
                const creationParams: PersonCreationParams = {
                    familienname: 'Mustermann ',
                    vorname: 'Max',
                };
                const result: DomainError | Person<false> = await Person.createNew(
                    usernameGeneratorService,
                    creationParams,
                );
                expect(result).toBeInstanceOf(NameValidationError);
            });

            it('should return an error if the familienname is only whitespace', async () => {
                const creationParams: PersonCreationParams = {
                    familienname: '   ',
                    vorname: 'Max',
                };
                const result: DomainError | Person<false> = await Person.createNew(
                    usernameGeneratorService,
                    creationParams,
                );
                expect(result).toBeInstanceOf(NameValidationError);
            });

            it('should create a new person if names are valid', async () => {
                usernameGeneratorService.generateUsername.mockResolvedValue({ ok: true, value: '' });
                const creationParams: PersonCreationParams = {
                    familienname: 'Mustermann',
                    vorname: 'Max',
                };
                const person: Person<false> | DomainError = await Person.createNew(
                    usernameGeneratorService,
                    creationParams,
                );

                expect(person).not.toBeInstanceOf(DomainError);
                if (person instanceof DomainError) {
                    return;
                }
                expect(person).toBeDefined();
                expect(person).toBeInstanceOf(Person<false>);
            });
        });
    });

    describe('update', () => {
        describe('revision does match and mandatory fields are updated', () => {
            it('should update the person', () => {
                const person: Person<true> = Person.construct(
                    faker.string.uuid(),
                    faker.date.past(),
                    faker.date.recent(),
                    'Mustermann',
                    'Max',
                    '5',
                    faker.lorem.word(),
                    faker.lorem.word(),
                    faker.string.uuid(),
                );
                const result: void | DomainError = person.update('5', 'Musterfrau', 'Maxine');

                expect(result).not.toBeInstanceOf(DomainError);
                expect(person.vorname).toEqual('Maxine');
                expect(person.familienname).toEqual('Musterfrau');
            });
        });
        describe('revision does match and no mandatory fields are updated', () => {
            it('should update the person and keep mandatory fields', () => {
                const person: Person<true> = Person.construct(
                    faker.string.uuid(),
                    faker.date.past(),
                    faker.date.recent(),
                    'Mustermann',
                    'Max',
                    '5',
                    faker.lorem.word(),
                    faker.lorem.word(),
                    faker.string.uuid(),
                );
                const result: void | DomainError = person.update('5', undefined, undefined, 'abc');

                expect(result).not.toBeInstanceOf(DomainError);
                expect(person.vorname).toEqual('Max');
                expect(person.familienname).toEqual('Mustermann');
                expect(person.referrer).toEqual('abc');
            });
        });
        describe('revision does not match', () => {
            it('should return domain error', () => {
                const person: Person<true> = Person.construct(
                    faker.string.uuid(),
                    faker.date.past(),
                    faker.date.recent(),
                    'Mustermann',
                    'Max',
                    '5',
                    faker.lorem.word(),
                    faker.lorem.word(),
                    faker.string.uuid(),
                );
                const result: void | DomainError = person.update('6', undefined, undefined, 'abc');

                expect(result).toBeInstanceOf(DomainError);
            });
        });
    });
});
