import { faker } from '@faker-js/faker';
import { Person } from './person.js';
import { DomainError } from '../../../shared/error/index.js';

describe('Person', () => {
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

                expect(person.newPassword).toEqual('unset');
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
        it('should return not persisted person', () => {
            const person: Person<false> = Person.createNew(faker.person.lastName(), faker.person.firstName());

            expect(person).toBeDefined();
            expect(person).toBeInstanceOf(Person<false>);
            expect(person.revision).toEqual('1');
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
