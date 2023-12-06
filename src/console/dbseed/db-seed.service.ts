import { Injectable } from '@nestjs/common';
import fs from 'fs';
import { PersonRollenZuweisungEntityFile } from './person-rollen-zuweisung-entity-file.js';
import { ConstructorCall, EntityFile } from './db-seed.types.js';
import { DataProviderEntityFile } from './data-provider-entity-file.js';
import { ServiceProviderEntityFile } from './service-provider-entity-file.js';
import { OrganisationEntityFile } from './organisation-entity-file.js';
import { PersonEntityFile } from './person-entity-file.js';
import { RolleEntityFile } from './rolle-entity-file.js';
import { ServiceProviderZugriffEntityFile } from './service-provider-zugriff-entity-file.js';

@Injectable()
export class DbSeedService {
    private dataProviderMap: Map<string, DataProviderEntityFile> = new Map<string, DataProviderEntityFile>();

    private serviceProviderMap: Map<string, ServiceProviderEntityFile> = new Map<string, ServiceProviderEntityFile>();

    private organisationMap: Map<string, OrganisationEntityFile> = new Map<string, OrganisationEntityFile>();

    private personMap: Map<string, PersonEntityFile> = new Map<string, PersonEntityFile>();

    private rolleMap: Map<string, RolleEntityFile> = new Map<string, RolleEntityFile>();

    private serviceProviderZugriffMap: Map<string, ServiceProviderZugriffEntityFile> = new Map<
        string,
        ServiceProviderZugriffEntityFile
    >();

    private personRollenZuweisungMap: Map<string, PersonRollenZuweisungEntityFile> = new Map<
        string,
        PersonRollenZuweisungEntityFile
    >();

    public readDataProvider(fileContentAsStr: string): DataProviderEntityFile[] {
        const entities: DataProviderEntityFile[] = this.readEntityFromJSONFile<DataProviderEntityFile>(
            fileContentAsStr,
            () => new DataProviderEntityFile(),
        );
        for (const entity of entities) {
            this.dataProviderMap.set(entity.id, entity);
        }
        return entities;
    }

    public readServiceProvider(fileContentAsStr: string): ServiceProviderEntityFile[] {
        const entities: ServiceProviderEntityFile[] = this.readEntityFromJSONFile<ServiceProviderEntityFile>(
            fileContentAsStr,
            () => new ServiceProviderEntityFile(),
        );
        for (const entity of entities) {
            this.serviceProviderMap.set(entity.id, entity);
        }
        return entities;
    }

    public readOrganisation(fileContentAsStr: string): OrganisationEntityFile[] {
        const entities: OrganisationEntityFile[] = this.readEntityFromJSONFile<OrganisationEntityFile>(
            fileContentAsStr,
            () => new OrganisationEntityFile(),
        );
        for (const entity of entities) {
            this.organisationMap.set(entity.id, entity);
        }
        return entities;
    }

    public readPerson(fileContentAsStr: string): PersonEntityFile[] {
        const entities: PersonEntityFile[] = this.readEntityFromJSONFile<PersonEntityFile>(
            fileContentAsStr,
            () => new PersonEntityFile(),
        );
        for (const entity of entities) {
            this.personMap.set(entity.id, entity);
        }
        return entities;
    }

    public readRolle(fileContentAsStr: string): RolleEntityFile[] {
        const entities: RolleEntityFile[] = this.readEntityFromJSONFile<RolleEntityFile>(
            fileContentAsStr,
            () => new RolleEntityFile(),
        );
        for (const entity of entities) {
            this.rolleMap.set(entity.id, entity);
        }
        return entities;
    }

    public readServiceProviderZugriff(fileContentAsStr: string): ServiceProviderZugriffEntityFile[] {
        const entities: ServiceProviderZugriffEntityFile[] =
            this.readEntityFromJSONFile<ServiceProviderZugriffEntityFile>(
                fileContentAsStr,
                () => new ServiceProviderZugriffEntityFile(),
            );
        for (const entity of entities) {
            this.serviceProviderZugriffMap.set(entity.id, entity);
        }
        return entities;
    }

    public readPersonRollenZuweisung(fileContentAsStr: string): PersonRollenZuweisungEntityFile[] {
        const entities: PersonRollenZuweisungEntityFile[] =
            this.readEntityFromJSONFile<PersonRollenZuweisungEntityFile>(
                fileContentAsStr,
                () => new PersonRollenZuweisungEntityFile(),
            );
        for (const entity of entities) {
            this.personRollenZuweisungMap.set(entity.id, entity);
        }
        return entities;
    }

    public getRolle(id: string): RolleEntityFile | undefined {
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
