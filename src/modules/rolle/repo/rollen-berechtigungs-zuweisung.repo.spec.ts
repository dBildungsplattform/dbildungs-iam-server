import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Mapper } from '@automapper/core';
import { ConfigTestModule, DatabaseTestModule, DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { getMapperToken } from '@automapper/nestjs';
import { ServiceProviderMapperProfile } from '../mapper/service-provider.mapper.profile.js';
import { ServiceProviderZugriffDo } from '../domain/service-provider-zugriff.do.js';
import { ServiceProviderZugriffMapperProfile } from '../mapper/service-provider-zugriff.mapper.profile.js';
import { RolleDo } from '../domain/rolle.do.js';
import { RolleBerechtigungsZuweisungDo } from '../domain/rolle-berechtigungs-zuweisung.do.js';
import { RolleBerechtigungsZuweisungEntity } from '../entity/rolle-berechtigungs-zuweisung.entity.js';
import { RollenBerechtigungsZuweisungRepo } from './rollen-berechtigungs-zuweisung.repo.js';
import { RolleMapperProfile } from '../mapper/rolle.mapper.profile.js';
import { RolleBerechtigungsZuweisungMapperProfile } from '../mapper/rolle-berechtigungs-zuweisung.mapper.profile.js';
import { RolleRechtMapperProfile } from '../mapper/rolle-recht.mapper.profile.js';
import { RolleEntity } from '../entity/rolle.entity.js';
import { ServiceProviderZugriffEntity } from '../entity/service-provider-zugriff.entity.js';

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
    }, 30 * 1_000);

    afterAll(async () => {
        await module.close();
    }, 30 * 1_000);

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('findAllRolleBerechtigungsZuweisungen by Rolle', () => {
        describe('when found by id', () => {
            it('should return found RollenBerechtigungsZuweisung', async () => {
                const rolleDo: RolleDo<false> = DoFactory.createRolle(false);
                const rolleEntity: RolleEntity = mapper.map(rolleDo, RolleDo, RolleEntity);

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
                    rolleDo,
                    spzDo,
                    false,
                );
                const rbzEntity: RolleBerechtigungsZuweisungEntity = mapper.map(
                    rbzDo,
                    RolleBerechtigungsZuweisungDo,
                    RolleBerechtigungsZuweisungEntity,
                );
                //expect(rbzEntity).toStrictEqual(rolleBerechtigungsZuweisung);
                await em.persistAndFlush(rbzEntity);

                const [insertedRolleEntity]: RolleEntity[] = await em.find(RolleEntity, {});
                const insertedRolleDo: RolleDo<boolean> = mapper.map(insertedRolleEntity, RolleEntity, RolleDo);

                const foundRolleBerechtigungsZuweisung: RolleBerechtigungsZuweisungDo<true>[] =
                    await sut.findAllRolleBerechtigungsZuweisungByRolle(insertedRolleDo);
                expect(foundRolleBerechtigungsZuweisung).not.toBeNull();
                expect(foundRolleBerechtigungsZuweisung).toHaveLength(1);
            });
        });
        describe('when not found via Rolle', () => {
            it('should return null', async () => {
                const rolleDo: RolleDo<false> = DoFactory.createRolle(false);
                const foundRolleBerechtigungsZuweisung: Option<RolleBerechtigungsZuweisungDo<true>[]> =
                    await sut.findAllRolleBerechtigungsZuweisungByRolle(rolleDo);
                expect(foundRolleBerechtigungsZuweisung).toHaveLength(0);
            });
        });
    });
});
