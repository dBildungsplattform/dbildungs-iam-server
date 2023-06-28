import { fakerDE as faker } from '@faker-js/faker';
import { PersonDo } from '../../modules/person/domain/person.do.js';

export class DoFactory {
    public static createPerson<WasPersisted extends boolean>(
        withId: WasPersisted,
        props?: Partial<PersonDo<false>>,
    ): PersonDo<WasPersisted> {
        const person: PersonDo<false> = {
            client: faker.company.name(),
            lastName: faker.person.lastName(),
            firstName: faker.person.fullName(),
            id: withId ? faker.string.uuid() : undefined,
            createdAt: withId ? faker.date.past() : undefined,
            updatedAt: withId ? faker.date.recent() : undefined,
        };
        return Object.assign(new PersonDo(), person, props);
    }
}
