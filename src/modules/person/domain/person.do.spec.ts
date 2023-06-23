import 'reflect-metadata';
import { PersonDo } from './person.do.js';
import { PersonEntity } from '../persistence/person.entity.js';

describe('PersonDo', () => {
    let sut: PersonDo;
    let person: PersonEntity;

    beforeAll(() => {
        person = new PersonEntity();
        sut = new PersonDo(person);
    });

    describe('id', () => {
        describe('when do is initialized', () => {
            it('should have an id', () => {
                const id = sut.id;
                expect(id).toBe(person.id);
            });
        });
    });

    describe('props', () => {
        describe('when do is initialized', () => {
            it('should have props', () => {
                const props = sut.props;
                expect(props).toBe(person);
            });
        });
    });
});
