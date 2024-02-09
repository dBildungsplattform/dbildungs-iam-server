import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { MappingError } from '../../../shared/error/index.js';
import { ServiceProviderZugriffMapperProfile } from './service-provider-zugriff.mapper.profile.js';
import { ServiceProviderZugriffDo } from '../../service-provider/domain/service-provider-zugriff.do.js';
import { RolleBerechtigungsZuweisungDo } from '../../service-provider/domain/rolle-berechtigungs-zuweisung.do.js';
import { RolleBerechtigungsZuweisungEntity } from '../../service-provider/entity/rolle-berechtigungs-zuweisung.entity.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleBerechtigungsZuweisungMapperProfile } from './rolle-berechtigungs-zuweisung.mapper.profile.js';

describe('RolleBerechtigungsZuweisungMapperProfile', () => {
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
        it('should map RolleBerechtigungsZuweisungDo to RolleBerechtigungsZuweisungEntity', () => {
            const rolle: Rolle<true> = DoFactory.createRolle(true);
            const serviceProviderZugriffDo: ServiceProviderZugriffDo<false> =
                DoFactory.createServiceProviderZugriff(false);
            const rbz: RolleBerechtigungsZuweisungDo<true> = DoFactory.createRolleBerechtigungsZuweisung(
                rolle.id,
                serviceProviderZugriffDo,
                true,
            );
            expect(rbz.rolleRecht).not.toBeFalsy();
            expect(() =>
                sut.map(rbz, RolleBerechtigungsZuweisungDo, RolleBerechtigungsZuweisungEntity),
            ).not.toThrowError(MappingError);
            const rolleBerechtigungsZuweisung: RolleBerechtigungsZuweisungEntity = sut.map(
                rbz,
                RolleBerechtigungsZuweisungDo,
                RolleBerechtigungsZuweisungEntity,
            );
            expect(rolleBerechtigungsZuweisung.rolleRecht).not.toBeNull();
        });
    });
});
