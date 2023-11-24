import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../test/utils/index.js';
import { DomainToSchulConnexErrorMapper } from './domain-to-schulconnex-error.mapper.js';
import { ErrorModule } from './error.module.js';

describe('ErrorModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot(), MapperTestModule, ErrorModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve DomainToSchulConnexErrorMapper', () => {
            expect(module.get(DomainToSchulConnexErrorMapper)).toBeInstanceOf(DomainToSchulConnexErrorMapper);
        });
    });
});
