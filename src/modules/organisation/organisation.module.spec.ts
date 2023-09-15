import { TestingModule, Test } from '@nestjs/testing';
import { OrganisationModule } from './organisation.module.js';
import { OrganisationPersistenceMapperProfile } from './persistence/organisation-persistence.mapper.profile.js';
import { OrganisationRepo } from './persistence/organisation.repo.js';
import { OrganisationService } from './domain/organisation.service.js';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../test/utils/index.js';

describe('OrganisationModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot(), MapperTestModule, OrganisationModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('schould be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve OrganisationProfile', () => {
            expect(module.get(OrganisationPersistenceMapperProfile)).toBeInstanceOf(
                OrganisationPersistenceMapperProfile,
            );
        });

        it('should resolve OrganisationRepo', () => {
            expect(module.get(OrganisationRepo)).toBeInstanceOf(OrganisationRepo);
        });

        it('should resolve OrganisationService', () => {
            expect(module.get(OrganisationService)).toBeInstanceOf(OrganisationService);
        });
    });
});
