import { Loaded, RequiredEntityData, rel } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { OrganisationID, PersonID, PersonenkontextID, RolleID } from '../../../shared/types/index.js';
import { Rolle } from '../domain/personenkontext.enums.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { PersonenkontextEntity } from './personenkontext.entity.js';
import { PersonEntity } from '../../person/persistence/person.entity.js';
import { PersonenkontextScope } from './personenkontext.scope.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { EntityAlreadyExistsError } from '../../../shared/error/entity-already-exists.error.js';
import { PersonenkontextFactory } from '../domain/personenkontext.factory.js';
import { MismatchedRevisionError } from '../../../shared/error/mismatched-revision.error.js';
import { EntityCouldNotBeDeleted } from '../../../shared/error/entity-could-not-be-deleted.error.js';

export function mapAggregateToData(
    personenKontext: Personenkontext<boolean>,
): RequiredEntityData<PersonenkontextEntity> {
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: personenKontext.id,
        personId: rel(PersonEntity, personenKontext.personId),
        organisationId: personenKontext.organisationId,
        rolleId: personenKontext.rolleId,
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
        entity.rolleId,
    );
}

@Injectable()
export class DBiamPersonenkontextRepo {
    public constructor(
        private readonly em: EntityManager,
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

    public async findByPersonAuthorized(
        personId: PersonID,
        permissions: PersonPermissions,
    ): Promise<Result<Personenkontext<true>[], DomainError>> {
        const relevantSystemRechte: RollenSystemRecht[] = [RollenSystemRecht.PERSONEN_VERWALTEN];

        const organisationIDs: OrganisationID[] = await permissions.getOrgIdsWithSystemrecht(
            relevantSystemRechte,
            true,
        );

        // Find all kontexte, where the personID matches and that person has at least one organisation in common
        const personenkontexte: PersonenkontextEntity[] = await this.em.find(PersonenkontextEntity, {
            personId: {
                id: personId,
                personenKontexte: {
                    $some: {
                        organisationId: { $in: organisationIDs },
                    },
                },
            },
        });

        if (personenkontexte.length === 0) {
            const isAuthorizedAtRoot: boolean =
                await permissions.hasSystemrechtAtRootOrganisation(relevantSystemRechte);

            if (!isAuthorizedAtRoot) {
                return {
                    ok: false,
                    error: new MissingPermissionsError('Not allowed to view the requested personenkontexte'),
                };
            }
        }

        return {
            ok: true,
            value: personenkontexte.map((pk: PersonenkontextEntity) =>
                mapEntityToAggregate(pk, this.personenkontextFactory),
            ),
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

    public async createAuthorized(
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

        const deletedCount: number = await this.em.nativeDelete(PersonenkontextEntity, { id });

        if (deletedCount === 0) {
            return new EntityCouldNotBeDeleted('Personenkontext', id);
        }

        return undefined;
    }

    private async create(personenKontext: Personenkontext<false>): Promise<Personenkontext<true>> {
        const personenKontextEntity: PersonenkontextEntity = this.em.create(
            PersonenkontextEntity,
            mapAggregateToData(personenKontext),
        );

        await this.em.persistAndFlush(personenKontextEntity);

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
}
