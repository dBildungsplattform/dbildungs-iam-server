import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../test/utils/index.js';
import { PersonController } from './api/person.controller.js';
import { PersonUc } from './api/person.uc.js';
import { PersonenkontextController } from './api/personenkontext.controller.js';
import { PersonenkontextUc } from './api/personenkontext.uc.js';
import { PersonApiModule } from './person-api.module.js';
import { KeycloakConfigTestModule } from '../../../test/utils/keycloak-config-test.module.js';

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

        it('should resolve PersonUc', () => {
            expect(module.get(PersonUc)).toBeInstanceOf(PersonUc);
        });

        it('should resolve PersonenkontextUc', () => {
            expect(module.get(PersonenkontextUc)).toBeInstanceOf(PersonenkontextUc);
        });

        it('should resolve PersonenkontextController', () => {
            // AI next 1 lines
            expect(module.get(PersonenkontextController)).toBeInstanceOf(PersonenkontextController);
        });
    });
});
