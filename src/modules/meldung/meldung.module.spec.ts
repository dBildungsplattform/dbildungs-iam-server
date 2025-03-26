import { Test, TestingModule } from '@nestjs/testing';
import { MeldungRepo } from './persistence/meldung.repo.js';
import { MeldungModule } from './meldung.module.js';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../test/utils/index.js';

describe('MeldungModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, MapperTestModule, DatabaseTestModule.forRoot(), MeldungModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve MeldungRepo', () => {
            expect(module.get(MeldungRepo)).toBeInstanceOf(MeldungRepo);
        });
    });
});
