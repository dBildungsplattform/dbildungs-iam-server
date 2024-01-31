import { Test, TestingModule } from '@nestjs/testing';
import { UserModule } from './user.module.js';
import {
    ConfigTestModule,
    DatabaseTestModule,
    MapperTestModule,
    KeycloakConfigTestModule,
} from '../../../test/utils/index.js';

describe('The UserModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                UserModule,
                DatabaseTestModule.forRoot(),
                ConfigTestModule,
                MapperTestModule,
                KeycloakConfigTestModule.forRoot(),
            ],
        }).compile();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    afterAll(async () => {
        await module.close();
    });
});
