import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../test/utils/index.js';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { UserRepository } from './user.repository.js';
import { UserModule } from './user.module.js';

describe('A fully integrated user module', () => {
    let module: TestingModule;
    let kcContainer: StartedTestContainer;

    beforeAll(async () => {
        kcContainer = await new GenericContainer('quay.io/keycloak/keycloak:22.0.3')
            .withCopyFilesToContainer([
                { source: './config/dev-realm-spsh.json', target: '/opt/keycloak/data/import/realm.json' },
            ])
            .withExposedPorts({ container: 8080, host: 8080 })
            .withEnvironment({ KEYCLOAK_ADMIN: 'admin', KEYCLOAK_ADMIN_PASSWORD: 'admin' })
            .withCommand(['start-dev', '--import-realm'])
            .start();
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot(), MapperTestModule, UserModule],
        }).compile();
    }, 50000);

    it('should run', async () => {
        const userRepository: UserRepository = module.get(UserRepository);

        await expect(userRepository.loadUser('abcd')).resolves.toBe({});
    });

    afterAll(async () => {
        await kcContainer.stop();
    });
});
