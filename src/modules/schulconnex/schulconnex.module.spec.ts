import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule } from '../../../test/utils/index.js';
import { EventModule } from '../../core/eventbus/index.js';
import { PersonenInfoService } from './domain/personeninfo/personeninfo.service.js';
import { SchulconnexModule } from './schulconnex.module.js';
import { PersonInfoController } from './api/personinfo/person-info.controller.js';
import { PersonenInfoController } from './api/personeninfo/personeninfo.controller.js';

describe('SchulconnexModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot(), EventModule, SchulconnexModule],
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
