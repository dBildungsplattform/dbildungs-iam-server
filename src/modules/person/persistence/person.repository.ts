import { EntityManager, Loaded, RequiredEntityData } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PersonEntity } from './person.entity.js';
import { Person } from '../domain/person.js';
import { PersonScope } from './person.scope.js';
import { KeycloakUserService, UserDo } from '../../keycloak-administration/index.js';
import { UsernameGeneratorService } from '../domain/username-generator.service.js';
import { DomainError } from '../../../shared/error/index.js';

export function mapAggregateToData(person: Person<boolean>): RequiredEntityData<PersonEntity> {
    return {
        keycloakUserId: person.keycloakUserId!,
        referrer: person.referrer,
        mandant: person.mandant,
        stammorganisation: person.stammorganisation,
        familienname: person.familienname,
        vorname: person.vorname,
        initialenFamilienname: person.initialenFamilienname,
        initialenVorname: person.initialenVorname,
        rufname: person.rufname,
        nameTitel: person.nameTitel,
        nameAnrede: person.nameAnrede,
        namePraefix: person.namePraefix,
        nameSuffix: person.nameSuffix,
        nameSortierindex: person.nameSortierindex,
        geburtsdatum: person.geburtsdatum,
        geburtsort: person.geburtsort,
        geschlecht: person.geschlecht,
        lokalisierung: person.lokalisierung,
        vertrauensstufe: person.vertrauensstufe,
        auskunftssperre: person.auskunftssperre,
        dataProvider: undefined,
        revision: person.revision,
    };
}

export function mapEntityToAggregate(entity: PersonEntity): Person<true> {
    return Person.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.familienname,
        entity.vorname,
        entity.revision,
        undefined,
        undefined,
        entity.keycloakUserId,
        entity.referrer,
        entity.stammorganisation,
        entity.initialenFamilienname,
        entity.initialenVorname,
        entity.rufname,
        entity.nameTitel,
        entity.nameAnrede,
        entity.namePraefix,
        entity.nameSuffix,
        entity.nameSortierindex,
        entity.geburtsdatum,
        entity.geburtsort,
        entity.geschlecht,
        entity.lokalisierung,
        entity.vertrauensstufe,
        entity.auskunftssperre,
    );
}

export function mapEntityToAggregateInplace(entity: PersonEntity, person: Person<boolean>): Person<true> {
    person.id = entity.id;
    person.createdAt = entity.createdAt;
    person.updatedAt = entity.updatedAt;

    return person;
}

@Injectable()
export class PersonRepository {
    public constructor(private readonly em: EntityManager) {}

    public async findBy(scope: PersonScope): Promise<Counted<Person<true>>> {
        const [entities, total]: Counted<PersonEntity> = await scope.executeQuery(this.em);
        const persons: Person<true>[] = entities.map((entity: PersonEntity) => mapEntityToAggregate(entity));

        return [persons, total];
    }

    public async findById(id: string): Promise<Option<Person<true>>> {
        const person: Option<PersonEntity> = await this.em.findOne(PersonEntity, { id });
        if (person) {
            return mapEntityToAggregate(person);
        }

        return null;
    }

    public async findByKeycloakUserId(keycloakUserId: string): Promise<Option<Person<true>>> {
        const person: Option<PersonEntity> = await this.em.findOne(PersonEntity, { keycloakUserId });
        if (person) {
            return mapEntityToAggregate(person);
        }

        return null;
    }

    public async create(
        person: Person<false>,
        kcUserService: KeycloakUserService,
        usernameGenerator: UsernameGeneratorService,
    ): Promise<Person<true> | DomainError> {
        const personWithKeycloakUser: Person<false> | DomainError = await this.saveUser(
            person,
            kcUserService,
            usernameGenerator,
        );
        if (personWithKeycloakUser instanceof DomainError) {
            return personWithKeycloakUser;
        }
        const personEntity: PersonEntity = this.em.create(PersonEntity, mapAggregateToData(personWithKeycloakUser));

        await this.em.persistAndFlush(personEntity);

        return mapEntityToAggregateInplace(personEntity, personWithKeycloakUser);
    }

    public async update(person: Person<true>): Promise<Person<true>> {
        const personEntity: Loaded<PersonEntity> = await this.em.findOneOrFail(PersonEntity, person.id);
        personEntity.assign(mapAggregateToData(person));

        await this.em.persistAndFlush(personEntity);

        return mapEntityToAggregate(personEntity);
    }

    public async saveUser(
        person: Person<boolean>,
        kcUserService: KeycloakUserService,
        usernameGenerator: UsernameGeneratorService,
    ): Promise<Person<boolean> | DomainError> {
        if (!person.needsSaving) {
            return person;
        }
        if (!person.keycloakUserId) {
            const generatedUsername: string =
                person.username ?? (await usernameGenerator.generateUsername(person.vorname, person.familienname));
            person.username = generatedUsername;
            person.referrer = generatedUsername;

            const userDo: UserDo<false> = {
                username: person.username,
                id: undefined,
                createdDate: undefined,
            } satisfies UserDo<false>;
            const creationResult: Result<string, DomainError> = await kcUserService.create(userDo);
            if (!creationResult.ok) {
                return creationResult.error;
            }
            person.keycloakUserId = creationResult.value;
            if (!person.password) {
                person.resetPassword();
            }
        }
        const isPasswordTemporary: boolean = person.password ? false : true;
        const setPasswordResult: Result<string, DomainError> = await kcUserService.setPassword(
            person.keycloakUserId,
            person.password ?? person.newPassword!,
            isPasswordTemporary,
        );
        if (!setPasswordResult.ok) {
            if (person.keycloakUserId) {
                await kcUserService.delete(person.keycloakUserId);
                person.keycloakUserId = undefined;
            }
            return setPasswordResult.error;
        }

        return person;
    }
}
