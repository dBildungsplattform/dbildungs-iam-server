import { Test, TestingModule } from '@nestjs/testing';
import { Mapper } from '@automapper/core';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { getMapperToken } from '@automapper/nestjs';
import { MappingError } from '../../../shared/error/index.js';
import { ServiceProviderMapperProfile } from './service-provider.mapper.profile.js';
import { ServiceProviderDo } from '../domain/service-provider.do.js';
import { ServiceProviderEntity } from '../entity/service-provider.entity.js';
import { GetServiceProviderInfoDo } from '../domain/get-service-provider-info.do.js';
import { faker } from '@faker-js/faker';

describe('ServiceProviderMapperProfile', () => {
    let module: TestingModule;
    let sut: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [ServiceProviderMapperProfile],
        }).compile();
        sut = module.get(getMapperToken());
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('when mapper is initialized', () => {
        it('should map ServiceProviderDo to ServiceProviderEntity', () => {
            const serviceProviderDo: ServiceProviderDo<true> = DoFactory.createServiceProvider(true);
            expect(() => sut.map(serviceProviderDo, ServiceProviderDo, ServiceProviderEntity)).not.toThrowError(
                MappingError,
            );
        });
        it('should map ServiceProviderEntity to ServiceProviderDo', () => {
            const serviceProviderEntity: Partial<ServiceProviderEntity> = {
                id: faker.string.numeric(),
                url: faker.internet.url(),
                name: faker.internet.domainName(),
            };
            expect(() => sut.map(serviceProviderEntity, ServiceProviderEntity, ServiceProviderDo)).not.toThrowError(
                MappingError,
            );
        });
        it('should map ServiceProviderDo to GetServiceProviderInfoDo', () => {
            const serviceProviderDo: ServiceProviderDo<true> = DoFactory.createServiceProvider(true);
            expect(() => sut.map(serviceProviderDo, ServiceProviderDo, GetServiceProviderInfoDo)).not.toThrowError(
                MappingError,
            );
        });
    });
});
