import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../test/utils/index.js';
import { OrganisationApiModule } from './organisation-api.module.js';
import { OrganisationController } from './api/organisation.controller.js';
import { OrganisationApiMapperProfile } from './api/organisation-api.mapper.profile.js';
import { DBiamPersonenkontextRepo } from '../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextFactory } from '../personenkontext/domain/personenkontext.factory.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';

describe('OrganisationApiModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                DatabaseTestModule.forRoot(),
                MapperTestModule,
                OrganisationApiModule,
                PersonenKontextModule,
            ],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be definded', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve OrganisationController', () => {
            expect(module.get(OrganisationController)).toBeInstanceOf(OrganisationController);
        });

        it('should resolve OrganisationApiMapperProfile', () => {
            expect(module.get(OrganisationApiMapperProfile)).toBeInstanceOf(OrganisationApiMapperProfile);
        });

        it('should resolve DBiamPersonenkontextRepo', () => {
            expect(module.get(DBiamPersonenkontextRepo)).toBeInstanceOf(DBiamPersonenkontextRepo);
        });

        it('should resolve PersonenkontextFactory', () => {
            expect(module.get(PersonenkontextFactory)).toBeInstanceOf(PersonenkontextFactory);
        });
    });
});
