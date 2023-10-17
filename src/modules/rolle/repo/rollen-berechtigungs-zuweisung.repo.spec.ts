import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Mapper } from '@automapper/core';
import { ConfigTestModule, DatabaseTestModule, DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { getMapperToken } from '@automapper/nestjs';
import { ServiceProviderMapperProfile } from '../mapper/service-provider.mapper.profile.js';
import { ServiceProviderZugriffDo } from '../domain/service-provider-zugriff.do.js';
import { ServiceProviderDo } from '../domain/service-provider.do.js';
import { ServiceProviderEntity } from '../entity/service-provider.entity.js';
import { ServiceProviderZugriffEntity } from '../entity/service-provider-zugriff.entity.js';
import { ServiceProviderZugriffMapperProfile } from '../mapper/service-provider-zugriff.mapper.profile.js';
import { RolleDo } from '../domain/rolle.do.js';
import { RolleEntity } from '../entity/rolle.entity.js';
import { RolleBerechtigungsZuweisungDo } from '../domain/rolle-berechtigungs-zuweisung.do.js';
import { RolleBerechtigungsZuweisungEntity } from '../entity/rolle-berechtigungs-zuweisung.entity.js';
import { RollenBerechtigungsZuweisungRepo } from './rollen-berechtigungs-zuweisung.repo.js';
import { RolleMapperProfile } from '../mapper/rolle.mapper.profile.js';
import { RolleBerechtigungsZuweisungMapperProfile } from '../mapper/rolle-berechtigungs-zuweisung.mapper.profile.js';
import { RolleRechtMapperProfile } from '../mapper/rolle-recht.mapper.profile.js';

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

    describe('findAllRollenBerechtigungsZuweisungen by Rolle', () => {
        describe('when found by id', () => {
            it('should return found RollenBerechtigungsZuweisung', async () => {
                const rolleDo: RolleDo<false> = DoFactory.createRolle(false);
                await em.persistAndFlush(mapper.map(rolleDo, RolleDo, RolleEntity));
                const rolle: RolleEntity[] = await em.find(RolleEntity, {});
                expect(rolle).not.toBeNull();
                expect(rolle).toHaveLength(1);

                const serviceProviderDo: ServiceProviderDo<false> = DoFactory.createServiceProvider(false);
                await em.persistAndFlush(mapper.map(serviceProviderDo, ServiceProviderDo, ServiceProviderEntity));
                const serviceProvider: ServiceProviderEntity[] = await em.find(ServiceProviderEntity, {});
                expect(serviceProvider).not.toBeNull();
                expect(serviceProvider).toHaveLength(1);

                const serviceProviderZugriffDo: ServiceProviderZugriffDo<false> =
                    DoFactory.createServiceProviderZugriff(false, {
                        serviceProvider: serviceProvider[0] ? serviceProvider[0].id : '1',
                    });
                await em.persistAndFlush(
                    mapper.map(serviceProviderZugriffDo, ServiceProviderZugriffDo, ServiceProviderZugriffEntity),
                );
                const serviceProviderZugriff: ServiceProviderZugriffEntity[] = await em.find(
                    ServiceProviderZugriffEntity,
                    {},
                );
                expect(serviceProviderZugriff).not.toBeNull();
                expect(serviceProviderZugriff).toHaveLength(1);

                const rolleBerechtigungsZuweisungDo: RolleBerechtigungsZuweisungDo<false> =
                    DoFactory.createRolleBerechtigungsZuweisung(rolleDo, serviceProviderZugriffDo, false);

                await em.persistAndFlush(
                    mapper.map(
                        rolleBerechtigungsZuweisungDo,
                        RolleBerechtigungsZuweisungDo,
                        RolleBerechtigungsZuweisungEntity,
                    ),
                );
                const rolleBerechtigungsZuweisung: RolleBerechtigungsZuweisungEntity[] = await em.find(
                    RolleBerechtigungsZuweisungEntity,
                    {},
                );
                expect(rolleBerechtigungsZuweisung).not.toBeNull();
                expect(rolleBerechtigungsZuweisung).toHaveLength(1);

                const foundRolleBerechtigungsZuweisung: RolleBerechtigungsZuweisungDo<true>[] =
                    await sut.findAllRolleBerechtigungsZuweisungByRolle(rolleDo);
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
