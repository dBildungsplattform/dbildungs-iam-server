import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    LoggingTestModule,
    MapperTestModule,
    DoFactory,
    KeycloakConfigTestModule,
} from '../../../test/utils/index.js';
import { DbSeedService } from './db-seed.service.js';
import { DbSeedConsole } from './db-seed.console.js';
import { UserModule } from '../../modules/user/user.module.js';
import { UsernameGeneratorService } from '../../modules/user/username-generator.service.js';
import { DbSeedMapper } from './db-seed-mapper.js';
import { getMapperToken } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { RolleEntity } from '../../modules/rolle/entity/rolle.entity.js';
import { RolleMapperProfile } from '../../modules/rolle/mapper/rolle.mapper.profile.js';
import { KeycloakAdministrationModule } from '../../modules/keycloak-administration/keycloak-administration.module.js';
import { PersonRollenZuweisungEntity } from '../../modules/rolle/entity/person-rollen-zuweisung.entity.js';
import { ServiceProviderZugriffEntity } from '../../modules/rolle/entity/service-provider-zugriff.entity.js';
import { OrganisationEntity } from '../../modules/organisation/persistence/organisation.entity.js';
import { ServiceProviderEntity } from '../../modules/rolle/entity/service-provider.entity.js';
import { DataProviderEntity } from '../../persistence/data-provider.entity.js';
import { Rolle } from '../../modules/rolle/domain/rolle.js';

describe('DbSeedConsole', () => {
    let module: TestingModule;
    let sut: DbSeedConsole;
    let orm: MikroORM;
    let dbSeedService: DbSeedService;
    let mapper: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                KeycloakConfigTestModule.forRoot({ isKeycloakRequired: true }),
                ConfigTestModule,
                UserModule,
                KeycloakAdministrationModule,
                MapperTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                LoggingTestModule,
            ],
            providers: [DbSeedConsole, UsernameGeneratorService, DbSeedService, DbSeedMapper, RolleMapperProfile],
        }).compile();
        sut = module.get(DbSeedConsole);
        orm = module.get(MikroORM);
        dbSeedService = module.get(DbSeedService);
        mapper = module.get(getMapperToken());

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
    }, 100000);

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    it('should be defined', () => {
        expect(dbSeedService).toBeDefined();
        expect(orm).toBeDefined();
    });

    describe('run', () => {
        describe('when no parameter for directory is provided', () => {
            it('should fail with error', async () => {
                await expect(sut.run([])).rejects.toThrow();
            });
        });

        describe('when directory and excluded files is set via parameter', () => {
            it('should use seeding-integration-test directory and not fail due to non-existing entityType', async () => {
                const params: string[] = ['seeding-integration-test/all', '07_non-existing-entity.json'];
                const role: Rolle = DoFactory.createRolle(false, { id: 'd5732e12-5bca-4ef0-826b-3e910fcc7fd3' });
                await orm.em.fork().persistAndFlush(mapper.map(role, Rolle, RolleEntity));
                await expect(sut.run(params)).resolves.not.toThrow();
                const dataProvider: Option<DataProviderEntity> = await orm.em.findOne(DataProviderEntity, {
                    id: '431d8433-759c-4dbe-aaab-00b9a781f467',
                });
                const prz: Option<PersonRollenZuweisungEntity> = await orm.em.findOne(PersonRollenZuweisungEntity, {
                    id: '27ff7c36-35ea-4fcb-9faa-ed7794afaece',
                });
                const rolle: Option<RolleEntity> = await orm.em.findOne(RolleEntity, {
                    id: '301457e9-4fe5-42a6-8084-fec927dc00df',
                });
                const serviceProvider: Option<ServiceProviderEntity> = await orm.em.findOne(ServiceProviderEntity, {
                    id: 'af314073-539c-45ed-b94a-a2e1b9c976e3',
                });
                const spz: Option<ServiceProviderZugriffEntity> = await orm.em.findOne(ServiceProviderZugriffEntity, {
                    id: '0e23c772-07b3-4d40-a71c-71848712fb96',
                });
                const organisation: Option<OrganisationEntity> = await orm.em.findOne(OrganisationEntity, {
                    id: 'cb3e7c7f-c8fb-4083-acbf-2484efb19b54',
                });
                if (!dataProvider || !prz || !rolle || !serviceProvider || !spz || !organisation) {
                    throw Error('At least one entity was not persisted correctly!');
                }
            });
        });

        describe('when directory set via parameter', () => {
            it('should use seeding-integration-test directory and fail due to non-existing entity-type', async () => {
                const params: string[] = ['seeding-integration-test/nonExistingEntity'];
                await expect(sut.run(params)).rejects.toThrow(
                    new Error(`Unsupported EntityName / EntityType: NonExistingEntityType`),
                );
            });
        });

        describe('when new rolle-entity is used in PersonRollenZuweisung', () => {
            it('should succeed', async () => {
                const params: string[] = ['seeding-integration-test/newRolle'];
                await expect(sut.run(params)).resolves.not.toThrow();
                const prz: Option<PersonRollenZuweisungEntity> = await orm.em.findOne(PersonRollenZuweisungEntity, {
                    id: '27ff7c36-35ea-4fcb-9faa-ed7794afaece',
                });
                const rolle: Option<RolleEntity> = await orm.em.findOne(RolleEntity, {
                    id: '3ca85c16-96b2-46c8-a4fd-27e73d7ab96c',
                });
                if (!prz || !rolle) {
                    throw Error('PersonRollenZuweisung or Rolle was not persisted correctly!');
                }
                expect(rolle.id).toEqual('3ca85c16-96b2-46c8-a4fd-27e73d7ab96c');
                expect(prz.rolle.id).toEqual('3ca85c16-96b2-46c8-a4fd-27e73d7ab96c');
            });
        });

        describe('when foreign (persisted) rolle-entity used in PersonRollenZuweisung does not exist', () => {
            it('should fail', async () => {
                const params: string[] = ['seeding-integration-test/persistedRolleMissing'];
                await expect(sut.run(params)).rejects.toThrow(
                    new Error(`Foreign RolleEntity with id 8a2fb3e4-2d24-4917-b8fc-7fccb98d10f1 could not be found!`),
                );
            });
        });

        describe('when virtual (non-persisted) rolle-entity used in PersonRollenZuweisung does not exist', () => {
            it('should fail', async () => {
                const params: string[] = ['seeding-integration-test/newRolleMissing'];
                await expect(sut.run(params)).rejects.toThrow(
                    new Error(`No rolle with id fa49e432-0d77-4286-b68f-01bba5ae7f2c`),
                );
            });
        });
    });
});
