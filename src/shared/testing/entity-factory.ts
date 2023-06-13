import { plainToInstance } from 'class-transformer';
import { fakerDE } from '@faker-js/faker';
import { PersonEntity } from '../../modules/person/person.entity.js';

export class EntityFactory {
    public static createPersons(count: number): PersonEntity[] {
        return new Array(count).fill(0).map(() => {
            const personProps: PersonEntity = {
                id: fakerDE.string.uuid(),
                createdAt: fakerDE.date.past(),
                updatedAt: fakerDE.date.recent(),
                client: fakerDE.company.name(),
                firstName: fakerDE.person.firstName(),
                lastName: fakerDE.person.lastName(),
            };
            return plainToInstance(PersonEntity, personProps, { enableImplicitConversion: true });
        });
    }
}
