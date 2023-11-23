import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository.js';
import { UserModule } from './user.module.js';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../test/utils/index.js';
import { KeycloakUserService } from '../keycloak-administration/index.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityNotFoundError } from '../../shared/error/index.js';
import { User } from './user.js';

describe('A User', () => {
    let module: TestingModule;
    let userRepository: UserRepository;
    let kcUserService: DeepMocked<KeycloakUserService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [UserModule, ConfigTestModule, DatabaseTestModule.forRoot(), MapperTestModule],
        })
            .overrideProvider(KeycloakUserService)
            .useValue(createMock<KeycloakUserService>())
            .compile();
        await module.init();

        userRepository = module.get(UserRepository);
        kcUserService = module.get(KeycloakUserService);
    });

    beforeEach(() => {
        kcUserService.findOne.mockResolvedValue({ ok: false, error: new EntityNotFoundError('Not found') });
    });

    describe('When its created', () => {
        it('should have a random username', async () => {
            const createdUser: Promise<User> = userRepository.createUser('Max', 'Mustermann');
            expect((await createdUser).username).toBe('mmustermann');
        });

        it('should have a random password', async () => {
            const createdUser: Promise<User> = userRepository.createUser('Max', 'Mustermann');
            expect((await createdUser).password).toHaveLength(10);
        });
    });
});
