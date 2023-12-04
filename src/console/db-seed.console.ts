import { CommandRunner, SubCommand } from 'nest-commander';
import fs from 'fs';
import { ClassLogger } from '../core/logging/class-logger.js';
import { RolleEntity } from '../modules/rolle/entity/rolle.entity.js';
import { EntityFile, SeedFile } from './seed/seed-file.js';
import { ServiceProviderEntity } from '../modules/rolle/entity/service-provider.entity.js';
import { PersonEntity } from '../modules/person/persistence/person.entity.js';
import { OrganisationEntity } from '../modules/organisation/persistence/organisation.entity.js';
import { RolleRechtEntity } from '../modules/rolle/entity/rolle-recht.entity.js';
import {EntityManager, MikroORM} from '@mikro-orm/core';
import { ServiceProviderZugriffEntity } from '../modules/rolle/entity/service-provider-zugriff.entity.js';
import {PersonRollenZuweisungEntity} from "../modules/rolle/entity/person-rollen-zuweisung.entity.js";
import {PersonRollenZuweisungDo} from "../modules/rolle/domain/person-rollen-zuweisung.do.js";
import {Inject} from "@nestjs/common";
import {getMapperToken} from "@automapper/nestjs";
import {Mapper} from "@automapper/core";
import {KeycloakUserService, UserDo} from "../modules/keycloak-administration/index.js";

type Entity = PersonEntity | OrganisationEntity | ServiceProviderEntity | RolleEntity | RolleRechtEntity | PersonRollenZuweisungEntity;
type ConstructorCall = () => Entity;

export interface HasForeignKeyReference {
    foreign: ForeignKeyReference,
}

export interface ForeignKeyReference {
    id: string,
    targetField: string,
}

@SubCommand({ name: 'seed', description: 'creates seed data in the database' })
export class DbSeedConsole extends CommandRunner {

    forkedEm: EntityManager;

    public constructor(
        private readonly orm: MikroORM,
        private readonly logger: ClassLogger,
        private readonly userService: KeycloakUserService,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
) {
        super();
        this.forkedEm = orm.em.fork()
    }

    public override async run(_passedParams: string[], _options?: Record<string, unknown>): Promise<void> {
        let directory: string = 'dev';
        if (_passedParams[0] !== undefined) {
            directory = _passedParams[0];
        }
        let excludedFiles: string = '';
        if (_passedParams[1] !== undefined) {
            excludedFiles = _passedParams[1];
            this.logger.info(`Following files skipped via options: ${excludedFiles}`);
        }
        this.logger.info('Create seed data in the database...');
        let entityFileNames: string[] = this.getEntityFileNames(directory);
        entityFileNames = entityFileNames.filter(efm => !excludedFiles.includes(efm));
        let entities: Entity[] = [];
        for (const entityFileName of entityFileNames) {
            const fileContentAsStr: string = fs.readFileSync(`./sql/${directory}/${entityFileName}`, 'utf-8');
            const seedFile: SeedFile = JSON.parse(fileContentAsStr) as SeedFile;
            switch (seedFile.entityName) {
                case 'ServiceProvider':
                    entities = this.readEntityFromJSONFile<ServiceProviderEntity>(
                        fileContentAsStr,
                        () => new ServiceProviderEntity(),
                    );
                    break;
                case 'Organisation':
                    entities = this.readEntityFromJSONFile<OrganisationEntity>(fileContentAsStr, () => new OrganisationEntity());
                    break;
                case 'Person':
                    await this.handlePersons(fileContentAsStr);
                    break;
                case 'Rolle':
                    entities = this.readEntityFromJSONFile<RolleEntity>(fileContentAsStr, () => new RolleEntity());
                    break;
                case 'ServiceProviderZugriff':
                    entities = this.readEntityFromJSONFile<ServiceProviderZugriffEntity>(
                        fileContentAsStr,
                        () => new ServiceProviderZugriffEntity(),
                    );
                    break;
                case 'PersonRollenZuweisung':
                    entities = this.readEntityFromJSONFile<PersonRollenZuweisungEntity>(
                        fileContentAsStr,
                        () => new PersonRollenZuweisungEntity(),
                    );
                    entities.forEach((e: Entity) => {
                        console.log(e);
                        this.getForeignEntity(e);
                    });
                    break;
                default:
                    throw new Error(`Unsupported EntityName / EntityType: ${seedFile.entityName}`);
            }
            this.logger.info(`Insert ${entities.length} entities of type ${seedFile.entityName}`);

            for (const entity of entities) {
                this.forkedEm.persist(entity);
            }
        }
        this.logger.info('Created seed data successfully');
        await this.forkedEm.flush();
    }

    private async handlePersons(fileContentAsStr: string): Promise<void> {
        const entities: PersonEntity[] = this.readEntityFromJSONFile<PersonEntity>(fileContentAsStr, () => new PersonEntity());
        for (const entity of entities) {
            await this.createPerson(entity);
            this.forkedEm.persist(entity);
        }
    }
    private async createPerson(personEntity: PersonEntity): Promise<void> {
        // create user
        const userDo: UserDo<false> = this.mapper.map(personEntity, PersonEntity, UserDo<false>);
        const userIdResult: Result<string> = await this.userService.create(userDo);
        if (!userIdResult.ok) {
            throw userIdResult.error;
        }
        personEntity.keycloakUserId = userIdResult.value;
    }

    private getEntityFileNames(directory: string): string[] {
        const fileNames: string[] = [];
        fs.readdirSync(`./sql/${directory}`).forEach((file: string) => {
            fileNames.push(file);
        });
        return fileNames;
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

    private async getForeignEntity(entity: Entity): Promise<void> {
        if (!this.hasForeignKeyReference(entity)) {
            return;
        }
        const targetField: string = entity.foreign.targetField;
        const id: string = entity.foreign.id;
        let foreignEntity: Option<Entity>;
        switch (targetField) {
            case 'rolle':
                foreignEntity = await this.orm.em.fork().findOne(RolleEntity, { id });
                if (foreignEntity) {
                    let prz = entity as PersonRollenZuweisungDo<false>;
                    prz.rolle = foreignEntity;
                }
        }
    }


    private hasForeignKeyReference(obj: unknown): obj is HasForeignKeyReference {
        return (obj as HasForeignKeyReference)?.foreign !== undefined;
    }
}
