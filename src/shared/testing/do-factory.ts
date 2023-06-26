import { fakerDE as faker } from '@faker-js/faker';
import { PersonDo } from '../../modules/person/domain/person.do.js';

export class DoFactory {
    public static createPerson<WasPersisted extends boolean = false>(
        withId?: WasPersisted,
        props?: Partial<PersonDo<false>>,
    ): PersonDo<WasPersisted> {
        const person = new PersonDo<WasPersisted>();
        if (withId) {
            person.id = faker.string.uuid();
            person.createdAt = faker.date.past();
            person.updatedAt = faker.date.recent();
        }
        person.client = faker.company.name();
        person.lastName = faker.person.lastName();
        person.firstName = faker.person.fullName();
        Object.assign(person, props);
        return person;
    }
}
