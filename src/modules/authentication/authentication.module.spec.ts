import { Test, TestingModule } from '@nestjs/testing';

import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../test/utils/index.js';
import { AuthenticationModule } from './authentication.module.js';

describe('AuthenticationModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [AuthenticationModule, ConfigTestModule, MapperTestModule, DatabaseTestModule.forRoot()],
            providers: [],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });
});
