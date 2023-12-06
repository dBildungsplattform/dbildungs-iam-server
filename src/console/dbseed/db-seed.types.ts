import { PersonRollenZuweisungEntityFile } from './person-rollen-zuweisung-entity-file.js';
import { DataProviderEntityFile } from './data-provider-entity-file.js';
import { PersonEntityFile } from './person-entity-file.js';
import { OrganisationEntityFile } from './organisation-entity-file.js';
import { ServiceProviderEntityFile } from './service-provider-entity-file.js';
import { RolleEntityFile } from './rolle-entity-file.js';

export type Entity =
    | DataProviderEntityFile
    | PersonEntityFile
    | OrganisationEntityFile
    | ServiceProviderEntityFile
    | RolleEntityFile
    | PersonRollenZuweisungEntityFile;
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
