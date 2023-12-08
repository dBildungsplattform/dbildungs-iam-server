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
import { RolleDo } from '../../modules/rolle/domain/rolle.do.js';
import { getMapperToken } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { RolleEntity } from '../../modules/rolle/entity/rolle.entity.js';
import { RolleMapperProfile } from '../../modules/rolle/mapper/rolle.mapper.profile.js';
import { KeycloakAdministrationModule } from '../../modules/keycloak-administration/keycloak-administration.module.js';

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

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    it('should be defined', () => {
        expect(orm).toBeDefined();
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
            it('should use testdata directory and not fail due to non-existing entityType', async () => {
                const params: string[] = ['testdata/all', '07_non-existing-entity.json'];
                const rolle: RolleDo<false> = DoFactory.createRolle(false, { id: '1111' });
                await orm.em.fork().persistAndFlush(mapper.map(rolle, RolleDo, RolleEntity));
                await expect(sut.run(params)).resolves.not.toThrow();
            });
        });

        describe('when directory and excluded files is set via parameter', () => {
            it('should use testdata directory and fail due to non-existing entity-type', async () => {
                const params: string[] = ['testdata/all'];
                await expect(sut.run(params)).rejects.toThrow();
            });
        });

        describe('when new rolle-entity is used in PersonRollenZuweisung', () => {
            it('should succeed', async () => {
                const params: string[] = ['testdata/newRolle'];
                await expect(sut.run(params)).resolves.not.toThrow();
            });
        });

        describe('when foreign (persisted) rolle-entity used in PersonRollenZuweisung does not exist', () => {
            it('should fail', async () => {
                const params: string[] = ['testdata/peristedRolleMissing'];
                await expect(sut.run(params)).rejects.toThrow();
            });
        });

        describe('when virtual (non-persisted) rolle-entity used in PersonRollenZuweisung does not exist', () => {
            it('should fail', async () => {
                const params: string[] = ['testdata/newRolleMissing'];
                await expect(sut.run(params)).rejects.toThrow();
            });
        });
    });
});
