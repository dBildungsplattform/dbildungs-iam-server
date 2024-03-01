import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { MappingError } from '../../../shared/error/index.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationPersistenceMapperProfile } from './organisation-persistence.mapper.profile.js';
import { OrganisationEntity } from './organisation.entity.js';

describe('OrganisationPersistenceMapperProfile', () => {
    let module: TestingModule;
    let sut: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule, ConfigTestModule],
            providers: [OrganisationPersistenceMapperProfile],
        }).compile();
        sut = module.get(getMapperToken());
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('when the mapper is initialized', () => {
        it('should map Organisation Do into Organisatio Entity', () => {
            const organisationDO: OrganisationDo<true> = DoFactory.createOrganisation(true);
            expect(() => sut.map(organisationDO, OrganisationDo, OrganisationEntity)).not.toThrowError(MappingError);
        });

        it('should map organisation entity into organisation Domain object', () => {
            const organisation: OrganisationEntity = new OrganisationEntity();
            organisation.administriertVon = faker.string.uuid();
            organisation.zugehoerigZu = faker.string.uuid();
            expect(() => sut.map(organisation, OrganisationEntity, OrganisationDo)).not.toThrowError(MappingError);
        });
    });
});
