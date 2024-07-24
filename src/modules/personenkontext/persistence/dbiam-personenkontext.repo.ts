import { Loaded, RequiredEntityData, rel } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { OrganisationID, PersonID, PersonenkontextID, RolleID } from '../../../shared/types/index.js';
import { Rolle } from '../domain/personenkontext.enums.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { PersonenkontextEntity } from './personenkontext.entity.js';
import { PersonEntity } from '../../person/persistence/person.entity.js';
import { RolleEntity } from '../../rolle/entity/rolle.entity.js';
import { PersonenkontextScope } from './personenkontext.scope.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { EntityAlreadyExistsError } from '../../../shared/error/entity-already-exists.error.js';
import { PersonenkontextFactory } from '../domain/personenkontext.factory.js';
import { MismatchedRevisionError } from '../../../shared/error/mismatched-revision.error.js';
import { PersonenkontextCreatedEvent } from '../../../shared/events/personenkontext-created.event.js';
import { EventService } from '../../../core/eventbus/index.js';

export function mapAggregateToData(
    personenKontext: Personenkontext<boolean>,
): RequiredEntityData<PersonenkontextEntity> {
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: personenKontext.id,
        personId: rel(PersonEntity, personenKontext.personId),
        organisationId: personenKontext.organisationId,
        rolleId: rel(RolleEntity, personenKontext.rolleId),
        rolle: Rolle.LERNENDER, // Placeholder, until rolle is removed from entity
    };
}

function mapEntityToAggregate(
    entity: PersonenkontextEntity,
    personenkontextFactory: PersonenkontextFactory,
): Personenkontext<boolean> {
    return personenkontextFactory.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.personId.id,
        entity.organisationId,
        entity.rolleId.id,
    );
}

@Injectable()
export class DBiamPersonenkontextRepo {
    public constructor(
        private readonly em: EntityManager,
        private readonly eventService: EventService,
        private readonly personenkontextFactory: PersonenkontextFactory,
    ) {}

    public async findByID(id: string): Promise<Option<Personenkontext<true>>> {
        const personenkontext: Option<PersonenkontextEntity> = await this.em.findOne(PersonenkontextEntity, {
            id,
        });

        return personenkontext && mapEntityToAggregate(personenkontext, this.personenkontextFactory);
    }

    public async findByIDAuthorized(
        id: PersonenkontextID,
        permissions: PersonPermissions,
    ): Promise<Result<Personenkontext<true>, DomainError>> {
        const personenkontext: Option<PersonenkontextEntity> = await this.em.findOne(PersonenkontextEntity, {
            id,
        });

        if (!personenkontext) {
            return {
                ok: false,
                error: new EntityNotFoundError('Personenkontext', id),
            };
        }

        if (!(await this.canModifyPersonenkontext(personenkontext, permissions))) {
            return {
                ok: false,
                error: new MissingPermissionsError('Access denied'),
            };
        }

        return { ok: true, value: mapEntityToAggregate(personenkontext, this.personenkontextFactory) };
    }

    public async findByPerson(personId: PersonID): Promise<Personenkontext<true>[]> {
        const personenKontexte: PersonenkontextEntity[] = await this.em.find(PersonenkontextEntity, {
            personId,
        });

        return personenKontexte.map((pk: PersonenkontextEntity) =>
            mapEntityToAggregate(pk, this.personenkontextFactory),
        );
    }

    /**
     *
     * @param personId
     * @param permissions
     * @returns
     *
     * Should return all kontexts of a given person, if the caller has the systemrecht PERSONEN_VERWALTEN at at least one node of the target persons kontexts
     */
    public async findByPersonAuthorized(
        personId: PersonID,
        permissions: PersonPermissions,
    ): Promise<Result<Personenkontext<true>[], DomainError>> {
        const canSeeKontexts: boolean = await permissions.canModifyPerson(personId);
        if (canSeeKontexts) {
            const allKontextsForTargetPerson: Personenkontext<true>[] = await this.findByPerson(personId);
            return {
                ok: true,
                value: allKontextsForTargetPerson,
            };
        }

        return {
            ok: false,
            error: new MissingPermissionsError('Not allowed to view the requested personenkontexte'),
        };
    }

    public async findBy(scope: PersonenkontextScope): Promise<Counted<Personenkontext<true>>> {
        const [entities, total]: Counted<PersonenkontextEntity> = await scope.executeQuery(this.em);
        const kontexte: Personenkontext<true>[] = entities.map((entity: PersonenkontextEntity) =>
            mapEntityToAggregate(entity, this.personenkontextFactory),
        );

        return [kontexte, total];
    }

    public async findByPersonIds(personIds: PersonID[]): Promise<Map<PersonID, Personenkontext<true>[]>> {
        const personenKontextEntities: PersonenkontextEntity[] = await this.em.find(PersonenkontextEntity, {
            personId: { $in: personIds },
        });

        const personenKontextMap: Map<PersonID, Personenkontext<true>[]> = new Map();

        personenKontextEntities.forEach((entity: PersonenkontextEntity) => {
            const aggregate: Personenkontext<true> = mapEntityToAggregate(entity, this.personenkontextFactory);
            if (!personenKontextMap.has(entity.personId.id)) {
                personenKontextMap.set(entity.personId.id, []);
            }
            personenKontextMap.get(entity.personId.id)!.push(aggregate);
        });

        return personenKontextMap;
    }

    public async findByRolle(rolleId: string): Promise<Personenkontext<true>[]> {
        const personenKontexte: PersonenkontextEntity[] = await this.em.find(PersonenkontextEntity, {
            rolleId,
        });

        return personenKontexte.map((pk: PersonenkontextEntity) =>
            mapEntityToAggregate(pk, this.personenkontextFactory),
        );
    }

    public async find(
        personId: PersonID,
        organisationId: OrganisationID,
        rolleId: RolleID,
    ): Promise<Option<Personenkontext<true>>> {
        const personenKontext: Option<PersonenkontextEntity> = await this.em.findOne(
            PersonenkontextEntity,
            {
                personId,
                rolleId,
                organisationId,
            },
            {},
        );
        if (personenKontext) {
            return mapEntityToAggregate(personenKontext, this.personenkontextFactory);
        }

        return null;
    }

    public async exists(personId: PersonID, organisationId: OrganisationID, rolleId: RolleID): Promise<boolean> {
        const personenKontext: Option<Loaded<PersonenkontextEntity, never, 'id', never>> = await this.em.findOne(
            PersonenkontextEntity,
            {
                personId,
                rolleId,
                organisationId,
            },
            { fields: ['id'] as const },
        );

        return !!personenKontext;
    }

    public async save(personenKontext: Personenkontext<boolean>): Promise<Personenkontext<true>> {
        if (personenKontext.id) {
            return this.update(personenKontext);
        } else {
            return this.create(personenKontext);
        }
    }

    public async saveAuthorized(
        personenkontext: Personenkontext<false>,
        permissions: PersonPermissions,
    ): Promise<Result<Personenkontext<true>, DomainError>> {
        {
            const result: Option<DomainError> = await personenkontext.checkReferences();
            if (result) {
                return {
                    ok: false,
                    error: result,
                };
            }
        }

        {
            const result: Option<DomainError> = await personenkontext.checkPermissions(permissions);
            if (result) {
                return {
                    ok: false,
                    error: result,
                };
            }
        }

        {
            const exists: boolean = await this.exists(
                personenkontext.personId,
                personenkontext.organisationId,
                personenkontext.rolleId,
            );

            if (exists) {
                return {
                    ok: false,
                    error: new EntityAlreadyExistsError('Personenkontext already exists'),
                };
            }
        }

        const personenKontextEntity: PersonenkontextEntity = this.em.create(
            PersonenkontextEntity,
            mapAggregateToData(personenkontext),
        );

        await this.em.persistAndFlush(personenKontextEntity);
        this.eventService.publish(
            new PersonenkontextCreatedEvent(
                personenkontext.personId,
                personenkontext.organisationId,
                personenkontext.rolleId,
            ),
        );
        return {
            ok: true,
            value: mapEntityToAggregate(personenKontextEntity, this.personenkontextFactory),
        };
    }

    public async deleteAuthorized(
        id: PersonenkontextID,
        revision: string,
        permissions: PersonPermissions,
    ): Promise<Option<DomainError>> {
        const personenkontext: Option<PersonenkontextEntity> = await this.em.findOne(PersonenkontextEntity, {
            id,
        });

        if (!personenkontext) {
            return new EntityNotFoundError('Personenkontext', id);
        }

        if (!(await this.canModifyPersonenkontext(personenkontext, permissions))) {
            return new MissingPermissionsError('Access denied');
        }

        if (personenkontext.revision !== revision) {
            return new MismatchedRevisionError('Personenkontext');
        }

        await this.em.nativeDelete(PersonenkontextEntity, { id });

        return;
    }

    private async create(personenKontext: Personenkontext<false>): Promise<Personenkontext<true>> {
        const personenKontextEntity: PersonenkontextEntity = this.em.create(
            PersonenkontextEntity,
            mapAggregateToData(personenKontext),
        );
        await this.em.persistAndFlush(personenKontextEntity);
        this.eventService.publish(
            new PersonenkontextCreatedEvent(
                personenKontext.personId,
                personenKontext.organisationId,
                personenKontext.rolleId,
            ),
        );
        return mapEntityToAggregate(personenKontextEntity, this.personenkontextFactory);
    }

    private async update(personenKontext: Personenkontext<true>): Promise<Personenkontext<true>> {
        const personenKontextEntity: Loaded<PersonenkontextEntity> = await this.em.findOneOrFail(
            PersonenkontextEntity,
            personenKontext.id,
        );
        personenKontextEntity.assign(mapAggregateToData(personenKontext));

        await this.em.persistAndFlush(personenKontextEntity);

        return mapEntityToAggregate(personenKontextEntity, this.personenkontextFactory);
    }

    private async canModifyPersonenkontext(
        entity: PersonenkontextEntity,
        permissions: PersonPermissions,
    ): Promise<boolean> {
        const organisationIDs: OrganisationID[] = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.PERSONEN_VERWALTEN],
            true,
        );

        return organisationIDs.includes(entity.organisationId);
    }

    public async delete(personenKontext: Personenkontext<true>): Promise<void> {
        const personId: PersonID = personenKontext.personId;
        const organisationId: OrganisationID = personenKontext.organisationId;
        const rolleId: RolleID = personenKontext.rolleId;

        await this.em.nativeDelete(PersonenkontextEntity, {
            personId: personId,
            organisationId: organisationId,
            rolleId: rolleId,
        });
    }

    public async hasSystemrechtAtOrganisation(
        personId: PersonID,
        organisationId: OrganisationID,
        systemrecht: RollenSystemRecht,
    ): Promise<boolean> {
        const query: string = `
            WITH RECURSIVE parent_organisations AS (
                SELECT id, administriert_von
                FROM public.organisation
                WHERE id = ?
                UNION ALL
                SELECT o.id, o.administriert_von
                FROM public.organisation o
                INNER JOIN parent_organisations po ON o.id = po.administriert_von
            ),
            person_roles_at_orgas AS (
                SELECT DISTINCT pk.rolle_id
                FROM parent_organisations po
                JOIN public.personenkontext pk ON pk.organisation_id = po.id AND pk.person_id = ?
            )
            SELECT EXISTS (
                SELECT 1
                FROM person_roles_at_orgas pr
                JOIN public.rolle_systemrecht sr ON sr.rolle_id = pr.rolle_id
                WHERE sr.systemrecht = ?
            ) AS has_systemrecht_at_orga;
                        `;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any[] = await this.em.execute(query, [organisationId, personId, systemrecht]);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return result[0].has_systemrecht_at_orga as boolean;
    }

    public async hasPersonASystemrechtAtAnyKontextOfPersonB(
        personIdA: PersonID,
        personIdB: PersonID,
        systemrecht: RollenSystemRecht,
    ): Promise<boolean> {
        const query: string = `
        WITH RECURSIVE all_orgas_where_personb_has_any_kontext_with_parents AS (
                    SELECT id, administriert_von
                    FROM public.organisation
                    WHERE id IN (
                        SELECT organisation_id
                        FROM public.personenkontext
                        WHERE person_id = ?
                    )
                    UNION ALL
                    SELECT o.id, o.administriert_von
                    FROM public.organisation o
                    INNER JOIN all_orgas_where_personb_has_any_kontext_with_parents po ON o.id = po.administriert_von
                ),
                kontexts_personB_at_orgas AS (
                    SELECT pk.*
                    FROM public.personenkontext pk
                    WHERE pk.person_id = ? AND pk.organisation_id IN (SELECT id FROM all_orgas_where_personb_has_any_kontext_with_parents)
                ),
                permission_check AS (
                    SELECT EXISTS (
                        SELECT 1
                        FROM kontexts_personB_at_orgas kb
                        JOIN public.rolle_systemrecht sr ON sr.rolle_id = kb.rolle_id
                        WHERE sr.systemrecht = ?
                    ) AS has_persona_systemrecht_at_any_kontext_of_personb
                )
                SELECT has_persona_systemrecht_at_any_kontext_of_personb FROM permission_check;
                    `;

        const result: [{ has_persona_systemrecht_at_any_kontext_of_personb: boolean }] = await this.em.execute(query, [
            personIdB,
            personIdA,
            systemrecht,
        ]);
        return result[0].has_persona_systemrecht_at_any_kontext_of_personb;
    }
}
