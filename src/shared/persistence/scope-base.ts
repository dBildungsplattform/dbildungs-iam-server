import { AnyEntity, EntityName, QBFilterQuery, QBQueryOrderMap } from '@mikro-orm/core';
import { EntityManager, QueryBuilder } from '@mikro-orm/postgresql';
import { ScopeOrder, ScopeOperator } from './scope.enums.js';

export abstract class ScopeBase<T extends AnyEntity> {
    private readonly queryFilters: QBFilterQuery<T>[] = [];

    private readonly queryOrderMaps: QBQueryOrderMap<T>[] = [];

    private offset: number | undefined;

    private limit: number | undefined;

    public abstract get entityName(): EntityName<T>;

    public async executeQuery(em: EntityManager): Promise<[T[], number]> {
        const qb: QueryBuilder<T> = em.createQueryBuilder(this.entityName);
        const result: [T[], number] = await qb
            .select('*')
            .where(this.queryFilters)
            .orderBy(this.queryOrderMaps)
            .offset(this.offset)
            .limit(this.limit)
            .getResultAndCount();

        return result;
    }

    public sortBy(prop: keyof T, order: ScopeOrder): this {
        const queryOrderMap: QBQueryOrderMap<T> = { [prop]: order };

        this.queryOrderMaps.push(queryOrderMap);

        return this;
    }

    public paged(offset: number, limit: number): this {
        this.offset = offset;
        this.limit = limit;

        return this;
    }

    protected findBy(props: Partial<T>, operator: ScopeOperator): this {
        const query: QBFilterQuery<T> = {
            [operator]: Object.keys(props)
                .filter((key: string) => props[key] !== undefined)
                .map((key: string) => {
                    return {
                        [key]: props[key],
                    };
                }),
        };

        this.queryFilters.push(query);

        return this;
    }
}
