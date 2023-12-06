import { Injectable } from '@nestjs/common';
import fs from 'fs';
import { PersonRollenZuweisungFile } from './file/person-rollen-zuweisung-file.js';
import { ConstructorCall, EntityFile } from './db-seed.types.js';
import { DataProviderFile } from './file/data-provider-file.js';
import { ServiceProviderFile } from './file/service-provider-file.js';
import { OrganisationFile } from './file/organisation-file.js';
import { PersonFile } from './file/person-file.js';
import { ServiceProviderZugriffFile } from './file/service-provider-zugriff-file.js';
import { RolleEntity } from '../../modules/rolle/entity/rolle.entity.js';

@Injectable()
export class DbSeedService {
    private dataProviderMap: Map<string, DataProviderFile> = new Map<string, DataProviderFile>();

    private serviceProviderMap: Map<string, ServiceProviderFile> = new Map<string, ServiceProviderFile>();

    private organisationMap: Map<string, OrganisationFile> = new Map<string, OrganisationFile>();

    private personMap: Map<string, PersonFile> = new Map<string, PersonFile>();

    private rolleMap: Map<string, RolleEntity> = new Map<string, RolleEntity>();

    private spzMap: Map<string, ServiceProviderZugriffFile> = new Map<string, ServiceProviderZugriffFile>();

    private przMap: Map<string, PersonRollenZuweisungFile> = new Map<string, PersonRollenZuweisungFile>();

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

    public readServiceProvider(fileContentAsStr: string): ServiceProviderFile[] {
        const entities: ServiceProviderFile[] = this.readEntityFromJSONFile<ServiceProviderFile>(
            fileContentAsStr,
            () => new ServiceProviderFile(),
        );
        for (const entity of entities) {
            this.serviceProviderMap.set(entity.id, entity);
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

    public readRolle(fileContentAsStr: string): RolleEntity[] {
        const entities: RolleEntity[] = this.readEntityFromJSONFile<RolleEntity>(
            fileContentAsStr,
            () => new RolleEntity(),
        );
        for (const entity of entities) {
            this.rolleMap.set(entity.id, entity);
        }
        return entities;
    }

    public readServiceProviderZugriff(fileContentAsStr: string): ServiceProviderZugriffFile[] {
        const entities: ServiceProviderZugriffFile[] = this.readEntityFromJSONFile<ServiceProviderZugriffFile>(
            fileContentAsStr,
            () => new ServiceProviderZugriffFile(),
        );
        for (const entity of entities) {
            this.spzMap.set(entity.id, entity);
        }
        return entities;
    }

    public readPersonRollenZuweisung(fileContentAsStr: string): PersonRollenZuweisungFile[] {
        const entities: PersonRollenZuweisungFile[] = this.readEntityFromJSONFile<PersonRollenZuweisungFile>(
            fileContentAsStr,
            () => new PersonRollenZuweisungFile(),
        );
        for (const entity of entities) {
            this.przMap.set(entity.id, entity);
        }
        return entities;
    }

    /* Setting as RolleEntity is required, eg. RolleFile would not work, persisting would fail due to saving one RolleEntity and one RolleFile
    for entitymanager it would not be the same entity */
    public getRolle(id: string): RolleEntity | undefined {
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
        const fileNames: string[] = [];
        fs.readdirSync(`./sql/${directory}`).forEach((file: string) => {
            fileNames.push(file);
        });
        return fileNames;
    }
}
