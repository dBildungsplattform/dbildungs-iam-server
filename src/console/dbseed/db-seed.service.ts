import { Injectable } from '@nestjs/common';
import fs from 'fs';
import { DataProviderFile } from './file/data-provider-file.js';
import { OrganisationFile } from './file/organisation-file.js';
import { PersonFile } from './file/person-file.js';
import { Rolle } from '../../modules/rolle/domain/rolle.js';
import { ConstructorCall, EntityFile } from './db-seed.console.js';
import { ServiceProvider } from '../../modules/service-provider/domain/service-provider.js';
import { ServiceProviderFile } from './file/service-provider-file.js';
import { plainToInstance } from 'class-transformer';
import { LernperiodeFile } from './file/lernperiode-file.js';

@Injectable()
export class DbSeedService {
    private dataProviderMap: Map<string, DataProviderFile> = new Map<string, DataProviderFile>();

    private organisationMap: Map<string, OrganisationFile> = new Map<string, OrganisationFile>();

    private personMap: Map<string, PersonFile> = new Map<string, PersonFile>();

    private rolleMap: Map<string, Rolle<true>> = new Map<string, Rolle<true>>();

    private serviceProviderMap: Map<string, ServiceProvider<true>> = new Map();

    private lernperiodeMap: Map<string, LernperiodeFile> = new Map();

    public readLernperiode(fileContentAsStr: string): LernperiodeFile[] {
        const entities: LernperiodeFile[] = this.readEntityFromJSONFile<LernperiodeFile>(
            fileContentAsStr,
            () => new LernperiodeFile(),
        );
        for (const entity of entities) {
            this.lernperiodeMap.set(entity.id, entity);
        }
        return entities;
    }

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

    public readOrganisation(fileContentAsStr: string): OrganisationFile[] {
        const entities: OrganisationFile[] = this.readEntityFromJSONFile<OrganisationFile>(
            fileContentAsStr,
            () => new OrganisationFile(),
        );
        for (const entity of entities) {
            this.organisationMap.set(entity.id, entity);
        }
        return entities;
    }

    public readPerson(fileContentAsStr: string): PersonFile[] {
        const entities: PersonFile[] = this.readEntityFromJSONFile<PersonFile>(
            fileContentAsStr,
            () => new PersonFile(),
        );
        for (const entity of entities) {
            this.personMap.set(entity.id, entity);
        }
        return entities;
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
