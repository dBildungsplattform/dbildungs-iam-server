import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    MapperTestModule,
    KeycloakConfigTestModule,
} from '../../../test/utils/index.js';
import { PersonController } from './api/person.controller.js';
import { PersonenkontextUc } from '../personenkontext/api/personenkontext.uc.js';
import { PersonApiModule } from './person-api.module.js';
import { PersonFrontendController } from './api/person.frontend.controller.js';
import { PersonApiMapperProfile } from './api/person-api.mapper.profile.js';

describe('PersonApiModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                DatabaseTestModule.forRoot(),
                MapperTestModule,
                PersonApiModule,
                KeycloakConfigTestModule.forRoot(),
            ],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve PersonController', () => {
            expect(module.get(PersonController)).toBeInstanceOf(PersonController);
        });

        it('should resolve PersonFrontendController', () => {
            expect(module.get(PersonFrontendController)).toBeInstanceOf(PersonFrontendController);
        });

        it('should resolve PersonenkontextUc', () => {
            expect(module.get(PersonenkontextUc)).toBeInstanceOf(PersonenkontextUc);
        });

        it('should resolve PersonApiMapperProfile', () => {
            expect(module.get(PersonApiMapperProfile)).toBeInstanceOf(PersonApiMapperProfile);
        });
    });
});
