import { Injectable } from '@nestjs/common';
import fs from 'fs';
import { DataProviderFile } from './file/data-provider-file.js';
import { OrganisationFile } from './file/organisation-file.js';
import { Rolle } from '../../modules/rolle/domain/rolle.js';
import { ConstructorCall, EntityFile } from './db-seed.console.js';
import { ServiceProvider } from '../../modules/service-provider/domain/service-provider.js';
import { Personenkontext } from '../../modules/personenkontext/domain/personenkontext.js';
import { plainToInstance } from 'class-transformer';
import { OrganisationDo } from '../../modules/organisation/domain/organisation.do.js';
import { Person } from '../../modules/person/domain/person.js';
import { PersonFile } from './file/person-file.js';
import { ServiceProviderFile } from './file/service-provider-file.js';
import { PersonRepository } from '../../modules/person/persistence/person.repository.js';
import { PersonFactory } from '../../modules/person/domain/person.factory.js';
import { DomainError, EntityNotFoundError } from '../../shared/error/index.js';
import { ClassLogger } from '../../core/logging/class-logger.js';
import { PersonenkontextFile } from './file/personenkontext-file.js';
import { DBiamPersonenkontextRepo } from '../../modules/personenkontext/dbiam/dbiam-personenkontext.repo.js';

@Injectable()
export class DbSeedService {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly personFactory: PersonFactory,
        private readonly personRepository: PersonRepository,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
    ) {}

    private dataProviderMap: Map<string, DataProviderFile> = new Map<string, DataProviderFile>();

    private organisationMap: Map<string, OrganisationDo<true>> = new Map<string, OrganisationDo<true>>();

    private personMap: Map<number, Person<true>> = new Map();

    private rolleMap: Map<string, Rolle<true>> = new Map<string, Rolle<true>>();

    private serviceProviderMap: Map<string, ServiceProvider<true>> = new Map();

    public readDataProvider(fileContentAsStr: string): DataProviderFile[] {
        const entities: DataProviderFile[] = this.readEntityFromJSONFile<DataProviderFile>(
            fileContentAsStr,
            () => new DataProviderFile(),
        );
        for (const entity of entities) {
            this.dataProviderMap.set(entity.id, entity);
        }
        return entities;
    }

    //to be refactored when organisation becomes DomainDriven
    private static constructOrganisation(data: OrganisationFile): OrganisationDo<true> {
        const organisationDo: OrganisationDo<true> = new OrganisationDo<true>();
        organisationDo.id = data.id;
        organisationDo.administriertVon = data.administriertVon ?? undefined;
        organisationDo.zugehoerigZu = data.zugehoerigZu ?? undefined;
        organisationDo.kennung = data.kennung ?? undefined;
        organisationDo.name = data.name ?? undefined;
        organisationDo.namensergaenzung = data.namensergaenzung ?? undefined;
        organisationDo.kuerzel = data.kuerzel ?? undefined;
        organisationDo.typ = data.typ ?? undefined;
        organisationDo.traegerschaft = data.traegerschaft ?? undefined;
        return organisationDo;
    }

    public readOrganisation(fileContentAsStr: string): OrganisationDo<true>[] {
        const organisationFile: EntityFile<OrganisationFile> = JSON.parse(
            fileContentAsStr,
        ) as EntityFile<OrganisationFile>;

        const entities: OrganisationFile[] = plainToInstance(OrganisationFile, organisationFile.entities);

        const organisations: OrganisationDo<true>[] = entities.map((organisationData: OrganisationFile) =>
            DbSeedService.constructOrganisation(organisationData),
        );

        for (const organisation of organisations) {
            this.organisationMap.set(organisation.id, organisation);
        }

        return organisations;
    }

    public readRolle(fileContentAsStr: string): Rolle<true>[] {
        const { entities }: EntityFile<Rolle<true>> = JSON.parse(fileContentAsStr) as EntityFile<Rolle<true>>;

        const rollen: Rolle<true>[] = entities.map((rolleData: Rolle<true>) =>
            Rolle.construct(
                rolleData.id,
                new Date(),
                new Date(),
                rolleData.name,
                rolleData.administeredBySchulstrukturknoten,
                rolleData.rollenart,
                rolleData.merkmale,
                rolleData.systemrechte,
            ),
        );

        for (const rolle of rollen) {
            this.rolleMap.set(rolle.id, rolle);
        }

        return rollen;
    }

    public readServiceProvider(fileContentAsStr: string): ServiceProvider<true>[] {
        const serviceProviderFile: EntityFile<ServiceProviderFile> = JSON.parse(
            fileContentAsStr,
        ) as EntityFile<ServiceProviderFile>;

        const entities: ServiceProviderFile[] = plainToInstance(ServiceProviderFile, serviceProviderFile.entities);

        const serviceProviders: ServiceProvider<true>[] = entities.map((data: ServiceProviderFile) =>
            ServiceProvider.construct(
                data.id,
                new Date(),
                new Date(),
                data.name,
                data.url,
                data.kategorie,
                data.providedOnSchulstrukturknoten,
                data.logoBase64 ? Buffer.from(data.logoBase64, 'base64') : undefined,
                data.logoMimeType,
            ),
        );
        for (const serviceProvider of serviceProviders) {
            this.serviceProviderMap.set(serviceProvider.id, serviceProvider);
        }
        return serviceProviders;
    }

    public async seedPerson(fileContentAsStr: string): Promise<void> {
        const personFile: EntityFile<PersonFile> = JSON.parse(fileContentAsStr) as EntityFile<PersonFile>;
        const files: PersonFile[] = plainToInstance(PersonFile, personFile.entities);
        for (const file of files) {
            const person: Person<false> = await this.personFactory.createNew(
                file.familienname,
                file.vorname,
                file.referrer,
                file.stammorganisation,
                file.initialenFamilienname,
                file.initialenVorname,
                file.rufname,
                file.nameTitel,
                file.nameAnrede,
                file.namePraefix,
                file.nameSuffix,
                file.nameSortierindex,
                file.geburtsdatum,
                file.geburtsort,
                file.geschlecht,
                file.lokalisierung,
                file.vertrauensstufe,
                file.auskunftssperre,
                file.username,
                file.password,
            );
            const persistedPerson: Person<true> | DomainError = await this.personRepository.create(person);
            if (persistedPerson instanceof Person && file.id) {
                this.personMap.set(file.id, persistedPerson);
            }
        }
        this.logger.info(`Insert ${files.length} entities of type Person`);
    }

    public async seedPersonenkontext(fileContentAsStr: string): Promise<Personenkontext<true>[]> {
        const personenkontextFile: EntityFile<PersonenkontextFile> = JSON.parse(
            fileContentAsStr,
        ) as EntityFile<PersonenkontextFile>;

        const files: PersonenkontextFile[] = plainToInstance(PersonenkontextFile, personenkontextFile.entities);
        const persistedPersonenkontexte: Personenkontext<true>[] = [];
        for (const file of files) {
            const idOfPersistedPerson: Person<true> | undefined = this.personMap.get(file.personId);
            if (!idOfPersistedPerson)
                throw new EntityNotFoundError(`Referenced person for personenkontext not found, id=${file.personId}`);
            const personenKontext: Personenkontext<false> = Personenkontext.construct(
                undefined,
                new Date(),
                new Date(),
                idOfPersistedPerson.id,
                file.organisationId,
                file.rolleId,
            );
            persistedPersonenkontexte.push(await this.dBiamPersonenkontextRepo.save(personenKontext));
            //at the moment no saving of Personenkontext in a map for referencing
        }
        this.logger.info(`Insert ${files.length} entities of type Personenkontext`);
        return persistedPersonenkontexte;
    }

    /* Setting as RolleEntity is required, eg. RolleFile would not work, persisting would fail due to saving one RolleEntity and one RolleFile
    for entitymanager it would not be the same entity */
    public getRolle(id: string): Rolle<true> | undefined {
        return this.rolleMap.get(id);
    }

    private readEntityFromJSONFile<T>(fileContentAsStr: string, constructor: ConstructorCall): T[] {
        const entityFile: EntityFile<T> = JSON.parse(fileContentAsStr) as EntityFile<T>;
        const key: keyof EntityFile<T> = 'entities';
        const entities: T[] = entityFile[key];
        const entityList: T[] = [];
        entities.forEach((entity: T) => {
            const newEntity: T = Object.assign(constructor(), entity);
            entityList.push(newEntity);
        });
        return entityList;
    }

    public getEntityFileNames(directory: string): string[] {
        return fs.readdirSync(`./sql/${directory}`).filter((fileName: string) => fileName.endsWith('.json'));
    }
}
