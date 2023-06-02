import { EntityName, FilterQuery } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/postgresql";
import { EntityBase } from "./entity-base.js";

export abstract class RepoBase<E extends EntityBase> {
    public constructor(protected readonly em: EntityManager) {}

    public abstract get entityName(): EntityName<E>;

    public findById(id: string): Promise<Option<E>> {
        return this.em.findOne(this.entityName, id as FilterQuery<E>);
    }

    public save(entityOrEntities: E | E[]): Promise<void> {
        return this.em.persistAndFlush(entityOrEntities);
    }

    public remove(entityOrEntities: E | E[]): Promise<void> {
        return this.em.removeAndFlush(entityOrEntities);
    }
}
