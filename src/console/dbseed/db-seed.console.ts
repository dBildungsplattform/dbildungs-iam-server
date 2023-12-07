import { CommandRunner, SubCommand } from 'nest-commander';
import fs from 'fs';
import { ClassLogger } from '../../core/logging/class-logger.js';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Inject } from '@nestjs/common';
import { getMapperToken } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { KeycloakUserService, UserDo } from '../../modules/keycloak-administration/index.js';
import { UsernameGeneratorService } from '../../modules/user/username-generator.service.js';
import { PersonRollenZuweisungFile } from './file/person-rollen-zuweisung-file.js';
import { DbSeedService } from './db-seed.service.js';
import { PersonFile } from './file/person-file.js';
import { RolleEntity } from '../../modules/rolle/entity/rolle.entity.js';
import { PersonRollenZuweisungEntity } from '../../modules/rolle/entity/person-rollen-zuweisung.entity.js';
import { ServiceProviderZugriffFile } from './file/service-provider-zugriff-file.js';
import { ServiceProviderZugriffEntity } from '../../modules/rolle/entity/service-provider-zugriff.entity.js';
import { OrganisationEntity } from '../../modules/organisation/persistence/organisation.entity.js';
import { OrganisationFile } from './file/organisation-file.js';
import { DataProviderEntity } from '../../persistence/data-provider.entity.js';
import { DataProviderFile } from './file/data-provider-file.js';
import { PersonEntity } from '../../modules/person/persistence/person.entity.js';
import { ServiceProviderEntity } from '../../modules/rolle/entity/service-provider.entity.js';
import { ServiceProviderFile } from './file/service-provider-file.js';

export interface SeedFile {
    entityName: string;
}
export interface EntityFile<T> extends SeedFile {
    entities: T[];
}

export type Entity =
    | DataProviderFile
    | PersonFile
    | OrganisationFile
    | ServiceProviderFile
    | RolleEntity
    | PersonRollenZuweisungFile;

export type ConstructorCall = () => Entity;

export interface Reference {
    id: string;
    persisted: boolean;
}

@SubCommand({ name: 'seed', description: 'creates seed data in the database' })
export class DbSeedConsole extends CommandRunner {
    private forkedEm: EntityManager;

    private createdKeycloakUsers: [string, string][] = [];

    public constructor(
        private readonly orm: MikroORM,
        private readonly logger: ClassLogger,
        private readonly dbSeedService: DbSeedService,
        private readonly usernameGenerator: UsernameGeneratorService,
        private readonly keycloakUserService: KeycloakUserService,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {
        super();
        this.forkedEm = orm.em.fork();
    }

    private getDirectory(_passedParams: string[]): string {
        if (_passedParams[0] !== undefined) {
            return _passedParams[0];
        }
        throw new Error('No directory provided!');
    }

    private getExcludedFiles(_passedParams: string[]): string {
        if (_passedParams[1] !== undefined) {
            this.logger.info(`Following files skipped via parameter: ${_passedParams[1]}`);
            return _passedParams[1];
        }
        return '';
    }

    public override async run(_passedParams: string[], _options?: Record<string, unknown>): Promise<void> {
        const directory: string = this.getDirectory(_passedParams);
        const excludedFiles: string = this.getExcludedFiles(_passedParams);
        this.logger.info('Create seed data in the database...');
        let entityFileNames: string[] = this.dbSeedService.getEntityFileNames(directory);
        entityFileNames = entityFileNames.filter((efm: string) => !excludedFiles.includes(efm));
        for (const entityFileName of entityFileNames) {
            await this.processEntityFile(entityFileName, directory);
        }
        try {
            await this.forkedEm.flush();
            this.logger.info('Created seed data successfully.');
        } catch (err) {
            this.logger.error('Seed data could not be created!');
            await this.deleteAllCreatedKeycloakUsers();
        }
    }

    private async processEntityFile(entityFileName: string, directory: string): Promise<void> {
        const fileContentAsStr: string = fs.readFileSync(`./sql/${directory}/${entityFileName}`, 'utf-8');
        const seedFile: SeedFile = JSON.parse(fileContentAsStr) as SeedFile;
        switch (seedFile.entityName) {
            case 'DataProvider':
                this.handleDataProvider(this.dbSeedService.readDataProvider(fileContentAsStr), seedFile.entityName);
                break;
            case 'ServiceProvider':
                this.handleServiceProvider(
                    this.dbSeedService.readServiceProvider(fileContentAsStr),
                    seedFile.entityName,
                );
                break;
            case 'Organisation':
                this.handleOrganisation(this.dbSeedService.readOrganisation(fileContentAsStr), seedFile.entityName);
                break;
            case 'Person':
                await this.handlePerson(fileContentAsStr, seedFile.entityName);
                break;
            case 'Rolle':
                this.handleRolle(this.dbSeedService.readRolle(fileContentAsStr), seedFile.entityName);
                break;
            case 'ServiceProviderZugriff':
                this.handleServiceProviderZugriff(
                    this.dbSeedService.readServiceProviderZugriff(fileContentAsStr),
                    seedFile.entityName,
                );
                break;
            case 'PersonRollenZuweisung':
                await this.handlePersonRollenZuweisung(fileContentAsStr, seedFile.entityName);
                break;
            default:
                throw new Error(`Unsupported EntityName / EntityType: ${seedFile.entityName}`);
        }
    }

    private handleServiceProvider(entities: Entity[], entityName: string): void {
        for (const entity of entities) {
            const mappedEntity: ServiceProviderEntity = this.mapper.map(
                entity,
                ServiceProviderFile,
                ServiceProviderEntity,
            );
            this.forkedEm.persist(mappedEntity);
        }
        this.logger.info(`Insert ${entities.length} entities of type ${entityName}`);
    }

    private handleServiceProviderZugriff(entities: Entity[], entityName: string): void {
        for (const entity of entities) {
            const mappedEntity: ServiceProviderZugriffEntity = this.mapper.map(
                entity,
                ServiceProviderZugriffFile,
                ServiceProviderZugriffEntity,
            );
            this.forkedEm.persist(mappedEntity);
        }
        this.logger.info(`Insert ${entities.length} entities of type ${entityName}`);
    }

    private handleDataProvider(entities: Entity[], entityName: string): void {
        for (const entity of entities) {
            const mappedEntity: DataProviderEntity = this.mapper.map(entity, DataProviderFile, DataProviderEntity);
            this.forkedEm.persist(mappedEntity);
        }
        this.logger.info(`Insert ${entities.length} entities of type ${entityName}`);
    }

    private handleRolle(entities: Entity[], entityName: string): void {
        for (const entity of entities) {
            this.forkedEm.persist(entity);
        }
        this.logger.info(`Insert ${entities.length} entities of type ${entityName}`);
    }

    private handleOrganisation(entities: Entity[], entityName: string): void {
        for (const entity of entities) {
            const mappedEntity: OrganisationEntity = this.mapper.map(entity, OrganisationFile, OrganisationEntity);
            this.forkedEm.persist(mappedEntity);
        }
        this.logger.info(`Insert ${entities.length} entities of type ${entityName}`);
    }

    private async handlePerson(fileContentAsStr: string, entityName: string): Promise<void> {
        const entities: PersonFile[] = this.dbSeedService.readPerson(fileContentAsStr);
        for (const entity of entities) {
            await this.createPerson(entity);
            const mappedEntity: PersonEntity = this.mapper.map(entity, PersonFile, PersonEntity);
            this.forkedEm.persist(mappedEntity);
        }
        this.logger.info(`Insert ${entities.length} entities of type ${entityName}`);
    }

    private async createPerson(personEntity: PersonFile): Promise<void> {
        const username: string = await this.usernameGenerator.generateUsername(
            personEntity.vorname,
            personEntity.familienname,
        );
        const userDo: UserDo<false> = {
            username: username,
            email: username + '@test.de',
            id: null,
            createdDate: null,
        };
        const userIdResult: Result<string> = await this.keycloakUserService.create(userDo, 'test');
        if (userIdResult.ok) {
            //should be always ture, because usernameGenerator.generateUsername calls getNextAvailableName
            this.createdKeycloakUsers.push([userIdResult.value, username]);
            personEntity.keycloakUserId = userIdResult.value;
        }
    }

    private async deleteAllCreatedKeycloakUsers(): Promise<void> {
        for (const userTuple of this.createdKeycloakUsers) {
            this.logger.info(`Removed keycloak-user with username ${userTuple[1]}`);
            await this.keycloakUserService.delete(userTuple[0]);
        }
    }

    private async handlePersonRollenZuweisung(fileContentAsStr: string, entityName: string): Promise<void> {
        const entities: PersonRollenZuweisungFile[] = this.dbSeedService.readPersonRollenZuweisung(fileContentAsStr);
        for (const e of entities) {
            await this.setRolle(e);
            const mappedEntity: PersonRollenZuweisungEntity = this.mapper.map(
                e,
                PersonRollenZuweisungFile,
                PersonRollenZuweisungEntity,
            );
            this.forkedEm.persist(mappedEntity);
        }
        this.logger.info(`Insert ${entities.length} entities of type ${entityName}`);
    }

    private async setRolle(entity: PersonRollenZuweisungFile): Promise<void> {
        const id: string = entity.rolleReference.id;
        if (entity.rolleReference.persisted) {
            const foreignEntity: Option<Entity> = await this.orm.em.fork().findOne(RolleEntity, { id });
            if (foreignEntity) {
                entity.rolle = foreignEntity;
            } else {
                throw new Error(`Foreign RolleEntity with id ${id} could not be found!`);
            }
        } else {
            const rolle: RolleEntity | undefined = this.dbSeedService.getRolle(id);
            if (rolle === undefined) throw new Error(`No rolle with id ${id}`);
            entity.rolle = rolle;
        }
    }
}
