import { AnyEntity, EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';

export abstract class RepoBase<T extends AnyEntity> {
    protected constructor(protected readonly em: EntityManager) {}

    public abstract get entityName(): EntityName<T>;

    public async findById(id: string): Promise<Option<PersonDo<true>>> {
        const person: Option<PersonEntity> = await this.em.findOne(this.entityName, { id });
        if (person) {
            return this.mapper.map(person, PersonEntity, PersonDo);
        }
        return null;
    }
}
