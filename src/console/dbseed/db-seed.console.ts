import { CommandRunner, SubCommand } from 'nest-commander';
import fs from 'fs';
import { ClassLogger } from '../../core/logging/class-logger.js';
import { MikroORM, RequiredEntityData } from '@mikro-orm/core';
import { Inject } from '@nestjs/common';
import { getMapperToken } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { UsernameGeneratorService } from '../../modules/person/domain/username-generator.service.js';
import { DbSeedService } from './db-seed.service.js';
import { PersonFile } from './file/person-file.js';
import { RolleEntity } from '../../modules/rolle/entity/rolle.entity.js';
import { OrganisationEntity } from '../../modules/organisation/persistence/organisation.entity.js';
import { OrganisationFile } from './file/organisation-file.js';
import { DataProviderEntity } from '../../persistence/data-provider.entity.js';
import { DataProviderFile } from './file/data-provider-file.js';
import { PersonEntity } from '../../modules/person/persistence/person.entity.js';
import { KeycloakUserService } from '../../modules/keycloak-administration/domain/keycloak-user.service.js';
import { UserDo } from '../../modules/keycloak-administration/domain/user.do.js';
import { Rolle } from '../../modules/rolle/domain/rolle.js';
import { mapAggregateToData as mapServiceProviderAggregateToData } from '../../modules/service-provider/repo/service-provider.repo.js';
import { ServiceProvider } from '../../modules/service-provider/domain/service-provider.js';
import { ServiceProviderEntity } from '../../modules/service-provider/repo/service-provider.entity.js';
import { RolleSeedingRepo } from './repo/rolle-seeding.repo.js';
import { Personenkontext } from '../../modules/personenkontext/domain/personenkontext.js';
import { PersonenkontextEntity } from '../../modules/personenkontext/persistence/personenkontext.entity.js';
import { mapAggregateToData } from '../../modules/personenkontext/dbiam/dbiam-personenkontext.repo.js';
import { OrganisationDo } from '../../modules/organisation/domain/organisation.do.js';
import { DomainError } from '../../shared/error/domain.error.js';

export interface SeedFile {
    entityName: string;
}

export interface EntityFile<T> extends SeedFile {
    entities: T[];
}

export type Entity = DataProviderFile | PersonFile | OrganisationFile | RolleEntity;

export type ConstructorCall = () => Entity;

export interface Reference {
    id: string;
    persisted: boolean;
}

@SubCommand({ name: 'seed', description: 'creates seed data in the database' })
export class DbSeedConsole extends CommandRunner {
    private createdKeycloakUsers: [string, string][] = [];

    public constructor(
        private orm: MikroORM,
        private readonly logger: ClassLogger,
        private readonly dbSeedService: DbSeedService,
        private readonly usernameGenerator: UsernameGeneratorService,
        private readonly keycloakUserService: KeycloakUserService,
        private readonly rolleSeedingRepo: RolleSeedingRepo,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {
        super();
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
        this.logger.info('Following files will be processed:');
        entityFileNames.forEach((n: string) => this.logger.info(n));
        try {
            for (const entityFileName of entityFileNames) {
                await this.processEntityFile(entityFileName, directory);
            }
            await this.orm.em.flush();
            this.logger.info('Created seed data successfully.');
        } catch (err) {
            this.logger.error('Seed data could not be created!');
            this.logger.error(String(err));
            await this.deleteAllCreatedKeycloakUsers();
            throw err;
        }
    }

    private async processEntityFile(entityFileName: string, directory: string): Promise<void> {
        const fileContentAsStr: string = fs.readFileSync(`./sql/${directory}/${entityFileName}`, 'utf-8');
        const seedFile: SeedFile = JSON.parse(fileContentAsStr) as SeedFile;
        this.logger.info(`Processing ${seedFile.entityName}`);
        switch (seedFile.entityName) {
            case 'DataProvider':
                this.handleDataProvider(this.dbSeedService.readDataProvider(fileContentAsStr), seedFile.entityName);
                break;
            case 'Organisation':
                this.handleOrganisation(this.dbSeedService.readOrganisation(fileContentAsStr), seedFile.entityName);
                break;
            case 'Person':
                await this.handlePerson(fileContentAsStr, seedFile.entityName);
                break;
            case 'Rolle':
                await this.handleRolle(this.dbSeedService.readRolle(fileContentAsStr), seedFile.entityName);
                break;
            case 'ServiceProvider':
                this.handleServiceProvider(
                    this.dbSeedService.readServiceProvider(fileContentAsStr),
                    seedFile.entityName,
                );
                break;
            case 'Personenkontext':
                this.handlePersonenkontext(
                    this.dbSeedService.readPersonenkontext(fileContentAsStr),
                    seedFile.entityName,
                );
                break;
            default:
                throw new Error(`Unsupported EntityName / EntityType: ${seedFile.entityName}`);
        }
    }

    private handleDataProvider(entities: Entity[], entityName: string): void {
        for (const entity of entities) {
            const mappedEntity: DataProviderEntity = this.mapper.map(entity, DataProviderFile, DataProviderEntity);
            this.orm.em.persist(mappedEntity);
        }
        this.logger.info(`Insert ${entities.length} entities of type ${entityName}`);
    }

    private async handleRolle(entities: Rolle<true>[], entityName: string): Promise<void> {
        for (const entity of entities) {
            await this.rolleSeedingRepo.save(entity);
        }
        this.logger.info(`Insert ${entities.length} entities of type ${entityName}`);
    }

    private handleServiceProvider(aggregates: ServiceProvider<true>[], aggregateName: string): void {
        for (const aggregate of aggregates) {
            const serviceProvider: RequiredEntityData<ServiceProviderEntity> = this.orm.em.create(
                ServiceProviderEntity,
                mapServiceProviderAggregateToData(aggregate),
            );
            this.orm.em.persist(serviceProvider);
        }
        this.logger.info(`Insert ${aggregates.length} entities of type ${aggregateName}`);
    }

    private handlePersonenkontext(aggregates: Personenkontext<true>[], aggregateName: string): void {
        for (const aggregate of aggregates) {
            const personenKontext: RequiredEntityData<PersonenkontextEntity> = this.orm.em.create(
                PersonenkontextEntity,
                mapAggregateToData(aggregate),
            );
            this.orm.em.persist(personenKontext);
        }
        this.logger.info(`Insert ${aggregates.length} entities of type ${aggregateName}`);
    }

    private handleOrganisation(organisationDos: OrganisationDo<true>[], aggregateName: string): void {
        for (const organisationDo of organisationDos) {
            const organisation: RequiredEntityData<OrganisationEntity> = this.orm.em.create(
                OrganisationEntity,
                this.mapOrganisation(organisationDo),
            );
            this.orm.em.persist(organisation);
        }
        this.logger.info(`Insert ${organisationDos.length} entities of type ${aggregateName}`);
    }

    private mapOrganisation(organisationDo: OrganisationDo<boolean>): RequiredEntityData<OrganisationEntity> {
        return {
            // Don't assign createdAt and updatedAt, they are auto-generated!
            id: organisationDo.id,
            administriertVon: organisationDo.administriertVon,
            zugehoerigZu: organisationDo.zugehoerigZu,
            kennung: organisationDo.kennung,
            name: organisationDo.name,
            namensergaenzung: organisationDo.namensergaenzung,
            kuerzel: organisationDo.kuerzel,
            typ: organisationDo.typ,
            traegerschaft: organisationDo.traegerschaft,
        };
    }

    private async handlePerson(fileContentAsStr: string, entityName: string): Promise<void> {
        const entities: PersonFile[] = this.dbSeedService.readPerson(fileContentAsStr);
        for (const entity of entities) {
            await this.createPerson(entity);
            const mappedEntity: PersonEntity = this.mapper.map(entity, PersonFile, PersonEntity);
            this.orm.em.persist(mappedEntity);
        }
        this.logger.info(`Insert ${entities.length} entities of type ${entityName}`);
    }

    private async createPerson(personEntity: PersonFile): Promise<void> {
        this.logger.info('Start of createPerson');
        const usernameResult: Result<string, DomainError> = await this.usernameGenerator.generateUsername(
            personEntity.vorname,
            personEntity.familienname,
        );

        if (!usernameResult.ok) throw usernameResult.error;

        const userDo: UserDo<false> = {
            username: usernameResult.value,
            email: usernameResult.value + '@test.de',
            id: null,
            createdDate: null,
        };
        this.logger.info('Generated Username');
        const userIdResult: Result<string> = await this.keycloakUserService.create(userDo, 'test');
        this.logger.info('Created user');
        if (userIdResult.ok) {
            //should be always ture, because usernameGenerator.generateUsername calls getNextAvailableName
            this.createdKeycloakUsers.push([userIdResult.value, usernameResult.value]);
            personEntity.keycloakUserId = userIdResult.value;
            this.logger.info(`Created Keycloak-user with username ${usernameResult.value}`);
        } else {
            throw userIdResult.error;
        }
        this.logger.info('End of createPerson');
    }

    private async deleteAllCreatedKeycloakUsers(): Promise<void> {
        for (const userTuple of this.createdKeycloakUsers) {
            await this.keycloakUserService.delete(userTuple[0]);
            this.logger.info(`Removed keycloak-user with username ${userTuple[1]}`);
        }
    }
}
