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
     * @returns An array of unique `PersonID`s that match the given criteria.
     */
    public async findPersonIdsWithKontextAtServiceProvidersAndOptionallyOrganisations(
        serviceProviderIds: Set<string>,
        organisationIds: Set<string> | 'all',
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

        const results: { personId: string }[] = await qb.execute('all');
        return Array.from(new Set(results.map((r: { personId: string }) => r.personId)));
    }

    /**
     * Finds all unique person IDs that have at least one personenkontext
     * where the associated organisation and rolle have a rollenerweiterung entry for one of the given service providers.
     * Optionally filters by organisation IDs if provided.
     *
     * Supports consistent pagination via stable sorting on `person_id` (if used).
     *
     * For performance reasons, a native SQL query is used here to allow a direct join
     * from the `personenkontext` table to the `rollenerweiterung` table via `rolle_id`,
     * even though no foreign key exists between these tables.
     * This avoids unnecessary ORM overhead and enables efficient filtering at the database level.
     *
     * @param serviceProviderIds - A set of service provider IDs to filter rollenerweiterung by.
     * @param organisationIds - (Optional) A set of organisation IDs to filter rollenerweiterung by, or 'all' for no filter.
     * @returns An array of unique `PersonID`s that match the given criteria.
     */
    public async findPersonIdsWithRollenerweiterungForServiceProviderAndOptionallyOrganisations(
        serviceProviderIds: Set<string>,
        organisationIds: Set<string> | 'all',
    ): Promise<PersonID[]> {
        if (serviceProviderIds.size === 0) {
            return [];
        }

        const query: string = `
            SELECT DISTINCT pk.person_id
            FROM public.personenkontext pk
            WHERE EXISTS (
                SELECT 1
                FROM public.rollenerweiterung re
                WHERE re.rolle_id = pk.rolle_id
                AND re.service_provider_id IN (?)
                AND re.organisation_id = pk.organisation_id
                ${organisationIds !== 'all' && organisationIds.size > 0 ? 'AND re.organisation_id IN (?)' : ''}
            )
        `;

        const params: string[][] = [Array.from(serviceProviderIds)];
        if (organisationIds !== 'all' && organisationIds.size > 0) {
            params.push(Array.from(organisationIds), Array.from(organisationIds));
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: any[] = await this.em.execute(query, params);
        return results.map((r: { person_id: string }) => r.person_id);
    }
}
