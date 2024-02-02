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
import { RolleRechtDo } from '../domain/rolle-recht.do.js';
import { Rolle } from '../domain/rolle.js';
import { ServiceProviderZugriffDo } from '../domain/service-provider-zugriff.do.js';
import { ServiceProviderDo } from '../domain/service-provider.do.js';
import { ServiceProviderZugriffEntity } from '../entity/service-provider-zugriff.entity.js';
import { ServiceProviderEntity } from '../entity/service-provider.entity.js';
import { RolleBerechtigungsZuweisungMapperProfile } from '../mapper/rolle-berechtigungs-zuweisung.mapper.profile.js';
import { RolleRechtMapperProfile } from '../mapper/rolle-recht.mapper.profile.js';
import { ServiceProviderZugriffMapperProfile } from '../mapper/service-provider-zugriff.mapper.profile.js';
import { ServiceProviderMapperProfile } from '../mapper/service-provider.mapper.profile.js';
import { RolleRechtRepo } from './rolle-recht.repo.js';

describe('RolleRechtRepo', () => {
    let module: TestingModule;
    let sut: RolleRechtRepo;
    let orm: MikroORM;
    let em: EntityManager;
    let mapper: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), MapperTestModule],
            providers: [
                RolleBerechtigungsZuweisungMapperProfile,
                RolleRechtMapperProfile,
                ServiceProviderMapperProfile,
                ServiceProviderZugriffMapperProfile,
                RolleRechtRepo,
            ],
        }).compile();
        sut = module.get(RolleRechtRepo);
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

    describe('findAllRolleRecht via id provided by RolleBerechtigungsZuweisung', () => {
        describe('when found by id', () => {
            it('should return found RolleRecht', async () => {
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
                //
                const rolle: Rolle<true> = DoFactory.createRolle(true);
                const rolleBerechtigungsZuweisungDo: RolleBerechtigungsZuweisungDo<false> =
                    DoFactory.createRolleBerechtigungsZuweisung(rolle.id, serviceProviderZugriffDo, false);

                const foundRolleRecht: RolleRechtDo<true>[] =
                    await sut.findAllRolleRecht(rolleBerechtigungsZuweisungDo);
                expect(foundRolleRecht).not.toBeNull();
                expect(foundRolleRecht).toHaveLength(1);
            });
        });

        describe('when not found by id provided by RolleBerechtigungsZuweisung', () => {
            it('should return null', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true);
                const serviceProviderZugriffDo: ServiceProviderZugriffDo<true> =
                    DoFactory.createServiceProviderZugriff(true);
                const rolleBerechtigungsZuweisungDo: RolleBerechtigungsZuweisungDo<false> =
                    DoFactory.createRolleBerechtigungsZuweisung(rolle.id, serviceProviderZugriffDo, false);
                const foundRolleRecht: Option<RolleRechtDo<true>[]> =
                    await sut.findAllRolleRecht(rolleBerechtigungsZuweisungDo);
                expect(foundRolleRecht).toHaveLength(0);
            });
        });
    });

    describe('findAllServiceProviderZugriff via id provided by RolleBerechtigungsZuweisung', () => {
        describe('when found by id', () => {
            it('should return found ServiceProviderZugriff', async () => {
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
                //
                const rolle: Rolle<true> = DoFactory.createRolle(true);
                const rolleBerechtigungsZuweisungDo: RolleBerechtigungsZuweisungDo<false> =
                    DoFactory.createRolleBerechtigungsZuweisung(rolle.id, serviceProviderZugriffDo, false);

                const foundServiceProviderZugriff: ServiceProviderZugriffDo<true>[] =
                    await sut.findAllServiceProviderZugriff(rolleBerechtigungsZuweisungDo);
                expect(foundServiceProviderZugriff).not.toBeNull();
                expect(foundServiceProviderZugriff).toHaveLength(1);
            });
        });

        describe('when not found by id provided by RolleBerechtigungsZuweisung', () => {
            it('should return null', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true);
                const serviceProviderZugriffDo: ServiceProviderZugriffDo<true> =
                    DoFactory.createServiceProviderZugriff(true);
                const rolleBerechtigungsZuweisungDo: RolleBerechtigungsZuweisungDo<false> =
                    DoFactory.createRolleBerechtigungsZuweisung(rolle.id, serviceProviderZugriffDo, false);
                const foundServiceProviderZugriff: Option<ServiceProviderZugriffDo<true>[]> =
                    await sut.findAllServiceProviderZugriff(rolleBerechtigungsZuweisungDo);
                expect(foundServiceProviderZugriff).toHaveLength(0);
            });
        });
    });
});
