import { Loaded, RequiredEntityData } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { OrganisationID, PersonID, RolleID } from '../../../shared/types/index.js';
import { Rolle } from '../domain/personenkontext.enums.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { PersonenkontextEntity } from '../persistence/personenkontext.entity.js';

export function mapAggregateToData(
    personenKontext: Personenkontext<boolean>,
): RequiredEntityData<PersonenkontextEntity> {
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: personenKontext.id,
        personId: personenKontext.personId,
        organisationId: personenKontext.organisationId,
        rolleId: personenKontext.rolleId,
        rolle: Rolle.LERNENDER, // Placeholder, until rolle is removed from entity
    };
}

function mapEntityToAggregate(entity: PersonenkontextEntity): Personenkontext<boolean> {
    return Personenkontext.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.personId,
        entity.organisationId,
        entity.rolleId,
    );
}

@Injectable()
export class DBiamPersonenkontextRepo {
    public constructor(private readonly em: EntityManager) {}

    public async findByPerson(personId: PersonID): Promise<Personenkontext<true>[]> {
        const personenKontexte: PersonenkontextEntity[] = await this.em.find(PersonenkontextEntity, {
            personId,
        });

        return personenKontexte.map(mapEntityToAggregate);
    }

    public async exists(personId: PersonID, organisationId: OrganisationID, rolleId: RolleID): Promise<boolean> {
        const personenKontext: Option<PersonenkontextEntity> = (await this.em.findOne(
            PersonenkontextEntity,
            {
                personId,
                rolleId,
                organisationId,
            },
            { fields: ['id'] as const },
        )) as Option<PersonenkontextEntity>;

        return !!personenKontext;
    }

    public async save(personenKontext: Personenkontext<boolean>): Promise<Personenkontext<true>> {
        if (personenKontext.id) {
            return this.update(personenKontext);
        } else {
            return this.create(personenKontext);
        }
    }

    private async create(personenKontext: Personenkontext<false>): Promise<Personenkontext<true>> {
        const personenKontextEntity: PersonenkontextEntity = this.em.create(
            PersonenkontextEntity,
            mapAggregateToData(personenKontext),
        );

        await this.em.persistAndFlush(personenKontextEntity);

        return mapEntityToAggregate(personenKontextEntity);
    }

    private async update(personenKontext: Personenkontext<true>): Promise<Personenkontext<true>> {
        const personenKontextEntity: Loaded<PersonenkontextEntity> = await this.em.findOneOrFail(
            PersonenkontextEntity,
            personenKontext.id,
        );
        personenKontextEntity.assign(mapAggregateToData(personenKontext));

        await this.em.persistAndFlush(personenKontextEntity);

        return mapEntityToAggregate(personenKontextEntity);
    }
}
