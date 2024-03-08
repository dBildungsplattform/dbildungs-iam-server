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
import { UsernameGeneratorService } from '../../modules/person/domain/username-generator.service.js';
import { PersonFile } from './file/person-file.js';
import { ServiceProviderFile } from './file/service-provider-file.js';

@Injectable()
export class DbSeedService {
    public constructor(private readonly usernameGenerator: UsernameGeneratorService) {}

    private dataProviderMap: Map<string, DataProviderFile> = new Map<string, DataProviderFile>();

    private organisationMap: Map<string, OrganisationDo<true>> = new Map<string, OrganisationDo<true>>();

    //private personMap: Map<string, PersonFile> = new Map<string, PersonFile>();

    private rolleMap: Map<string, Rolle<true>> = new Map<string, Rolle<true>>();

    private serviceProviderMap: Map<string, ServiceProvider<true>> = new Map();

    private personenkontextMap: Map<string, Personenkontext<true>> = new Map();

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

    public async readPerson(fileContentAsStr: string): Promise<Person<false>[]> {
        const personFile: EntityFile<PersonFile> = JSON.parse(fileContentAsStr) as EntityFile<PersonFile>;
        const entities: PersonFile[] = plainToInstance(PersonFile, personFile.entities);
        const persons: Person<false>[] = [];
        for (const entity of entities) {
            const p: Person<false> = await Person.createNew(
                this.usernameGenerator,
                entity.familienname,
                entity.vorname,
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
                entity.username,
                entity.password,
            );
            persons.push(p);
        }
        //ids are ignored, filling of personMap will be implemented in the future, when id-referencing is solved differently
        return persons;
    }

    public readPersonenkontext(fileContentAsStr: string): Personenkontext<true>[] {
        const { entities }: EntityFile<Personenkontext<true>> = JSON.parse(fileContentAsStr) as EntityFile<
            Personenkontext<true>
        >;

        const personenkontexte: Personenkontext<true>[] = entities.map((pkData: Personenkontext<true>) =>
            Personenkontext.construct(
                pkData.id,
                new Date(),
                new Date(),
                pkData.personId,
                pkData.organisationId,
                pkData.rolleId,
            ),
        );
        for (const personenkontext of personenkontexte) {
            this.personenkontextMap.set(personenkontext.id, personenkontext);
        }
        return personenkontexte;
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
