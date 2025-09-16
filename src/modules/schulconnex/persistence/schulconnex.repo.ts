import { EntityManager, QueryBuilder } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PersonID } from '../../../shared/types/index.js';
import { EntityAggregateMapper } from '../../person/mapper/entity-aggregate.mapper.js';
import { PersonenkontextEntity } from '../../personenkontext/persistence/personenkontext.entity.js';

@Injectable()
export class SchulconnexRepo {
    public constructor(
        private readonly em: EntityManager,
        protected readonly entityAggregateMapper: EntityAggregateMapper,
    ) {}

    /**
     * Finds all unique person IDs that have at least one personenkontext
     * where the associated role is linked to one of the given service providers.
     * Optionally filters by organisation IDs if provided.
     *
     * Supports consistent pagination via stable sorting on `personId`.
     *
     * @param serviceProviderIds - A set of service provider IDs to filter roles by.
     * @param organisationIds - (Optional) A set of organisation IDs to filter person contexts by.
     * @param offset - The offset for pagination (e.g., 0 for the first page).
     * @param limit - The maximum number of results to return.
     * @returns An array of unique `PersonID`s that match the given criteria.
     */
    public async findPersonIdsWithKontextAtServiceProvidersAndOptionallyOrganisations(
        serviceProviderIds: Set<string>,
        organisationIds: Set<string> | 'all',
        offset: number,
        limit: number,
    ): Promise<PersonID[]> {
        if (serviceProviderIds.size === 0) {
            return [];
        }

        let qb: QueryBuilder<PersonenkontextEntity>;
        if (organisationIds !== 'all' && organisationIds.size > 0) {
            qb = this.em
                .createQueryBuilder(PersonenkontextEntity, 'pk')
                .select('pk.personId')
                .distinct()
                .join('pk.rolleId', 'rolle')
                .join('rolle.serviceProvider', 'rsp')
                .join('rsp.serviceProvider', 'sp')
                .where({ 'sp.id': { $in: Array.from(serviceProviderIds) } })
                .andWhere({ 'pk.organisationId': { $in: Array.from(organisationIds) } });
        } else {
            qb = this.em
                .createQueryBuilder(PersonenkontextEntity, 'pk')
                .select('pk.personId')
                .distinct()
                .join('pk.rolleId', 'rolle')
                .join('rolle.serviceProvider', 'rsp')
                .join('rsp.serviceProvider', 'sp')
                .where({ 'sp.id': { $in: Array.from(serviceProviderIds) } });
        }

        const results: { personId: string }[] = await qb.orderBy({ 'pk.personId': 'asc' }).execute('all');
        return Array.from(new Set(results.map((r: { personId: string }) => r.personId))).slice(offset, offset + limit);
    }
}
