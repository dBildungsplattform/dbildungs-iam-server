import { Entity, PrimaryKey, Reference } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { optionalRef } from './optional-ref.js';

@Entity()
class TestEntity {
    @PrimaryKey()
    public id!: string;
}

describe('optionalRef', () => {
    beforeAll(async () => {
        await MikroORM.init({
            entities: [TestEntity],
            dbName: 'test',
            connect: false,
        });
    });

    it('should return Reference when key is given', () => {
        expect(optionalRef(TestEntity, 'test')).toBeInstanceOf(Reference);
    });

    it('should return undefined when no key is given', () => {
        expect(optionalRef(TestEntity, undefined)).toBeUndefined();
    });
});
