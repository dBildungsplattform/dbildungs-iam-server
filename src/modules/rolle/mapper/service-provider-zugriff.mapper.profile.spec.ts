import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { MappingError } from '../../../shared/error/index.js';
import { ServiceProviderZugriffMapperProfile } from './service-provider-zugriff.mapper.profile.js';
import { ServiceProviderZugriffDo } from '../domain/service-provider-zugriff.do.js';
import { ServiceProviderZugriffEntity } from '../entity/service-provider-zugriff.entity.js';
import { RolleBerechtigungsZuweisungMapperProfile } from './rolle-berechtigungs-zuweisung.mapper.profile.js';

describe('ServiceProviderZugriffMapperProfile', () => {
    let module: TestingModule;
    let sut: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [ServiceProviderZugriffMapperProfile, RolleBerechtigungsZuweisungMapperProfile],
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
        it('should map ServiceProviderZugriffDo to ServiceProviderZugriffEntity', () => {
            const spz: ServiceProviderZugriffDo<true> = DoFactory.createServiceProviderZugriff(true);
            expect(() => sut.map(spz, ServiceProviderZugriffDo, ServiceProviderZugriffEntity)).not.toThrowError(
                MappingError,
            );
        });
    });
});
