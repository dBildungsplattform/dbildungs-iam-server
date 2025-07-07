import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../test/utils/index.js';
import { EventModule } from '../../core/eventbus/index.js';
import { PersonenInfoService } from './personeninfo/personeninfo.service.js';
import { PersonAndPersoneninfoModule } from './personandpersoneninfo.module.js';
import { PersonInfoController } from './personinfo/person-info.controller.js';
import { PersonenInfoController } from './personeninfo/personeninfo.controller.js';

describe('PersonAndPersonenInfoModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                DatabaseTestModule.forRoot(),
                MapperTestModule,
                EventModule,
                PersonAndPersoneninfoModule,
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
        it('should resolve PersonenInfoService', () => {
            expect(module.get(PersonenInfoService)).toBeInstanceOf(PersonenInfoService);
        });
        it('should resolve PersonenInfoService', () => {
            expect(module.get(PersonInfoController)).toBeInstanceOf(PersonInfoController);
        });
        it('should resolve PersonenInfoService', () => {
            expect(module.get(PersonenInfoController)).toBeInstanceOf(PersonenInfoController);
        });
    });
});
