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
import { ServiceProviderZugriffDo } from '../domain/service-provider-zugriff.do.js';
import { ServiceProviderDo } from '../domain/service-provider.do.js';
import { ServiceProviderZugriffEntity } from '../entity/service-provider-zugriff.entity.js';
import { ServiceProviderEntity } from '../entity/service-provider.entity.js';
import { ServiceProviderRepo } from './service-provider.repo.js';

describe('ServiceProviderRepo', () => {
    let module: TestingModule;
    let sut: ServiceProviderRepo;
    let orm: MikroORM;
    let em: EntityManager;
    let mapper: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), MapperTestModule],
            providers: [ServiceProviderRepo],
        }).compile();
        sut = module.get(ServiceProviderRepo);
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

    describe('findById provided by ServiceProviderZugriffDo', () => {
        describe('when found by id', () => {
            it('should return found serviceProvider', async () => {
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

                const foundServiceProvider: ServiceProviderDo<true>[] = await sut.findAll(serviceProviderZugriffDo);
                expect(foundServiceProvider).not.toBeNull();
                expect(foundServiceProvider).toHaveLength(1);
            });
        });

        describe('when not found by id provided by ServiceProviderZugriffDo', () => {
            it('should return null', async () => {
                const serviceProviderZugriffDo: ServiceProviderZugriffDo<true> =
                    DoFactory.createServiceProviderZugriff(true);
                const foundServiceProvider: Option<ServiceProviderDo<true>[]> =
                    await sut.findAll(serviceProviderZugriffDo);
                expect(foundServiceProvider).toHaveLength(0);
            });
        });
    });
});
