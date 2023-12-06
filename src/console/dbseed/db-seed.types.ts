import { PersonRollenZuweisungFile } from './file/person-rollen-zuweisung-file.js';
import { DataProviderFile } from './file/data-provider-file.js';
import { PersonFile } from './file/person-file.js';
import { OrganisationFile } from './file/organisation-file.js';
import { ServiceProviderFile } from './file/service-provider-file.js';
import { RolleEntity } from '../../modules/rolle/entity/rolle.entity.js';

export type Entity =
    | DataProviderFile
    | PersonFile
    | OrganisationFile
    | ServiceProviderFile
    | RolleEntity
    | PersonRollenZuweisungFile;
export type ConstructorCall = () => Entity;

export interface SeedFile {
    entityName: string;
}
export interface EntityFile<T> extends SeedFile {
    entities: T[];
}

export interface Reference {
    id: string;
    persisted: boolean;
}
