import { CommandRunner, SubCommand } from 'nest-commander';
import fs from 'fs';
import { ClassLogger } from '../core/logging/class-logger.js';
import { RolleEntity } from '../modules/rolle/entity/rolle.entity.js';
import { EntityFile, SeedFile } from './seed/seed-file.js';
import { ServiceProviderEntity } from '../modules/rolle/entity/service-provider.entity.js';
import { PersonEntity } from '../modules/person/persistence/person.entity.js';
import { OrganisationEntity } from '../modules/organisation/persistence/organisation.entity.js';
import { RolleRechtEntity } from '../modules/rolle/entity/rolle-recht.entity.js';

type Entity = PersonEntity | OrganisationEntity | ServiceProviderEntity | RolleEntity | RolleRechtEntity;

type ConstructorCall = () => Entity;

export function createServiceProvider(): ServiceProviderEntity {
    return new ServiceProviderEntity();
}
export function createPerson(): PersonEntity {
    return new PersonEntity();
}
export function createOrganisation(): OrganisationEntity {
    return new OrganisationEntity();
}

@SubCommand({ name: 'seed', description: 'creates seed data in the database' })
export class DbSeedConsole extends CommandRunner {
    public constructor(
        //private readonly orm: MikroORM,
        //private readonly configService: ConfigService<ServerConfig, true>,
        private readonly logger: ClassLogger,
    ) {
        super();
    }

    public override async run(_passedParams: string[], _options?: Record<string, unknown>): Promise<void> {
        let directory: string = 'dev';
        if (_passedParams[0] !== undefined) {
            directory = _passedParams[0];
        }
        this.logger.info('Create seed data in the database...');
        const entityFileNames: string[] = this.getEntityFileNames(directory);

        for (const entityFileName of entityFileNames) {
            const fileContentAsStr: string = fs.readFileSync(`./sql/${directory}/${entityFileName}`, 'utf-8');
            const seedFile: SeedFile = JSON.parse(fileContentAsStr);
            let entities;
            switch (seedFile.entityName) {
                case 'ServiceProvider':
                    entities = this.readEntityFromJSONFile<ServiceProviderEntity>(
                        fileContentAsStr,
                        createServiceProvider,
                    );
                    entities.forEach((e) => console.log(e));
                    break;
                case 'Organisation':
                    entities = this.readEntityFromJSONFile<OrganisationEntity>(fileContentAsStr, createOrganisation);
                    entities.forEach((e) => console.log(e));
                    break;
                default:
                    throw new Error(`Unsupported EntityName / EntityType: ${seedFile.entityName}`);
            }
        }

        /*this.logger.info(`Found ${statements.length} statements to execute`);
        for (const statement of statements) {
            await this.orm.em.getConnection().execute(statement);
        }*/
        this.logger.info('Created seed data successfully');
        await Promise.resolve();
    }

    private getEntityFileNames(directory: string): string[] {
        const fileNames: string[] = [];
        fs.readdirSync(`./sql/${directory}`).forEach((file) => {
            fileNames.push(file);
        });
        return fileNames;
    }

    private readEntityFromJSONFile<T>(fileContentAsStr: string, constructor: ConstructorCall): T[] {
        const entityFile: EntityFile<T> = JSON.parse(fileContentAsStr);
        const key: keyof EntityFile<any> = 'entities';
        const entities: T[] = entityFile[key];
        const entityList: T[] = [];
        entities.forEach((entity) => {
            const newEntity: T = Object.assign(constructor(), entity);
            entityList.push(newEntity);
        });
        return entityList;
    }
}
