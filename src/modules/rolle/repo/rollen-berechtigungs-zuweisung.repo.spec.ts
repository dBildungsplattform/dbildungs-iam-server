import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
    DoFactory,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { RolleBerechtigungsZuweisungDo } from '../domain/rolle-berechtigungs-zuweisung.do.js';
import { Rolle } from '../domain/rolle.js';
import { ServiceProviderZugriffDo } from '../domain/service-provider-zugriff.do.js';
import { RolleBerechtigungsZuweisungEntity } from '../entity/rolle-berechtigungs-zuweisung.entity.js';
import { RolleEntity } from '../entity/rolle.entity.js';
import { ServiceProviderZugriffEntity } from '../entity/service-provider-zugriff.entity.js';
import { RolleBerechtigungsZuweisungMapperProfile } from '../mapper/rolle-berechtigungs-zuweisung.mapper.profile.js';
import { RolleRechtMapperProfile } from '../mapper/rolle-recht.mapper.profile.js';
import { RolleMapperProfile } from '../mapper/rolle.mapper.profile.js';
import { ServiceProviderZugriffMapperProfile } from '../mapper/service-provider-zugriff.mapper.profile.js';
import { ServiceProviderMapperProfile } from '../mapper/service-provider.mapper.profile.js';
import { RollenBerechtigungsZuweisungRepo } from './rollen-berechtigungs-zuweisung.repo.js';

describe('RollenBerechtigungsZuweisungRepo', () => {
    let module: TestingModule;
    let sut: RollenBerechtigungsZuweisungRepo;
    let orm: MikroORM;
    let em: EntityManager;
    let mapper: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), MapperTestModule],
            providers: [
                ServiceProviderMapperProfile,
                ServiceProviderZugriffMapperProfile,
                RolleMapperProfile,
                RolleBerechtigungsZuweisungMapperProfile,
                RolleRechtMapperProfile,
                RollenBerechtigungsZuweisungRepo,
            ],
        }).compile();
        sut = module.get(RollenBerechtigungsZuweisungRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        mapper = module.get(getMapperToken());
        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('findAllRolleBerechtigungsZuweisungen by Rolle', () => {
        describe('when found by id', () => {
            it('should return found RollenBerechtigungsZuweisung', async () => {
                const rolle: Rolle = DoFactory.createRolle(false);
                const rolleEntity: RolleEntity = mapper.map(rolle, Rolle, RolleEntity);

                const spzDo: ServiceProviderZugriffDo<false> = DoFactory.createServiceProviderZugriff(false);
                const spzEntity: ServiceProviderZugriffEntity = mapper.map(
                    spzDo,
                    ServiceProviderZugriffDo,
                    ServiceProviderZugriffEntity,
                );
                const rolleBerechtigungsZuweisung: Partial<RolleBerechtigungsZuweisungEntity> = {
                    rolle: rolleEntity,
                    rolleRecht: spzEntity,
                };
                expect(rolleBerechtigungsZuweisung).toBeDefined();
                const rbzDo: RolleBerechtigungsZuweisungDo<false> = DoFactory.createRolleBerechtigungsZuweisung(
                    rolle,
                    spzDo,
                    false,
                );
                const rbzEntity: RolleBerechtigungsZuweisungEntity = mapper.map(
                    rbzDo,
                    RolleBerechtigungsZuweisungDo,
                    RolleBerechtigungsZuweisungEntity,
                );
                await em.persistAndFlush(rbzEntity);
                const [insertedRolleEntity]: RolleEntity[] = await em.find(RolleEntity, {});
                const insertedRolle: Rolle = mapper.map(insertedRolleEntity, RolleEntity, Rolle);
                const foundRolleBerechtigungsZuweisung: RolleBerechtigungsZuweisungDo<true>[] =
                    await sut.findAllRolleBerechtigungsZuweisungByRolle(insertedRolle);
                expect(foundRolleBerechtigungsZuweisung).not.toBeNull();
                expect(foundRolleBerechtigungsZuweisung).toHaveLength(1);
            });
        });
        describe('when not found via Rolle', () => {
            it('should return null', async () => {
                const rolle: Rolle = DoFactory.createRolle(false);
                const foundRolleBerechtigungsZuweisung: Option<RolleBerechtigungsZuweisungDo<true>[]> =
                    await sut.findAllRolleBerechtigungsZuweisungByRolle(rolle);
                expect(foundRolleBerechtigungsZuweisung).toHaveLength(0);
            });
        });
    });
});
