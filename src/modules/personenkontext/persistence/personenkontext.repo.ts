import { Loaded, RequiredEntityData } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { Personenkontext } from '../domain/personenkontext.js';
import { PersonenkontextEntity } from '../persistence/personenkontext.entity.js';
import { PersonenkontextScope } from '../persistence/personenkontext.scope.js';

export function mapAggregateToData(
    personenKontext: Personenkontext<boolean>,
): RequiredEntityData<PersonenkontextEntity> {
    return {
        personId: personenKontext.personId,
        organisationId: personenKontext.organisationId,
        rolleId: personenKontext.rolleId,
        referrer: personenKontext.referrer,
        mandant: personenKontext.mandant,
        personenstatus: personenKontext.personenstatus,
        jahrgangsstufe: personenKontext.jahrgangsstufe,
        sichtfreigabe: personenKontext.sichtfreigabe,
        loeschungZeitpunkt: personenKontext.loeschungZeitpunkt,
        revision: personenKontext.revision,
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
        entity.referrer,
        entity.mandant,
        entity.personenstatus,
        entity.jahrgangsstufe,
        entity.sichtfreigabe,
        entity.loeschungZeitpunkt,
        entity.revision,
    );
}

@Injectable()
export class PersonenkontextRepo {
    public constructor(private readonly em: EntityManager) {}

    public async find(): Promise<Personenkontext<true>[]> {
        const personenKontexte: PersonenkontextEntity[] = await this.em.findAll(PersonenkontextEntity, {});

        return personenKontexte.map(mapEntityToAggregate);
    }

    public async findBy(scope: PersonenkontextScope): Promise<Counted<Personenkontext<true>>> {
        const [entities, total]: Counted<PersonenkontextEntity> = await scope.executeQuery(this.em);

        const personenKontexte: Personenkontext<true>[] = entities.map(mapEntityToAggregate);

        return [personenKontexte, total];
    }

    public async findByPerson(personId: string): Promise<Personenkontext<true>[]> {
        const personenKontexte: PersonenkontextEntity[] = await this.em.find(PersonenkontextEntity, {
            personId,
        });

        return personenKontexte.map(mapEntityToAggregate);
    }

    public async exists(personId: string, rolleId: string, organisationId: string): Promise<boolean> {
        const personenKontext: Option<PersonenkontextEntity> = await this.em.findOne(PersonenkontextEntity, {
            personId,
            rolleId,
            organisationId,
        });

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

    public async deleteById(id: string): Promise<number> {
        const deletedPersons: number = await this.em.nativeDelete(PersonenkontextEntity, { id });
        return deletedPersons;
    }
}
