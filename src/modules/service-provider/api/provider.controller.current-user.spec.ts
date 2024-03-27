import { faker } from '@faker-js/faker/';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Client } from 'openid-client';

import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { LoggingTestModule } from '../../../../test/utils/logging-test.module.js';
import { DatabaseTestModule, DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { PersonModule } from '../../person/person.module.js';
import { MikroORM } from '@mikro-orm/core';
import { Person } from '../../person/domain/person.js';
import { ProviderController } from './provider.controller.js';
import { ServiceProviderResponse } from './service-provider.response.js';
import { AuthenticationController } from '../../authentication/api/authentication.controller.js';
import { PersonPermissionsRepo } from '../../authentication/domain/person-permission.repo.js';
import { OIDC_CLIENT } from '../../authentication/services/oidc-client.service.js';
import { User } from '../../authentication/types/user.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { ServiceProvider } from '../domain/service-provider.js';

describe('ProviderController Test with CurrentUser', () => {
    let module: TestingModule;
    let providerController: ProviderController;
    let personPermissions: DeepMocked<PersonPermissions>;
    let personPermissionsRepoMock: DeepMocked<PersonPermissionsRepo>;
    let rolleRepoMock: DeepMocked<RolleRepo>;

    let serviceProviderRepoMock: DeepMocked<ServiceProviderRepo>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                LoggingTestModule,
                MapperTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                PersonModule,
            ],
            providers: [
                AuthenticationController,
                ProviderController,
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: PersonPermissionsRepo,
                    useValue: createMock<PersonPermissionsRepo>(),
                },
                {
                    provide: OIDC_CLIENT,
                    useValue: createMock<Client>(),
                },
                {
                    provide: ServiceProviderRepo,
                    useValue: createMock<ServiceProviderRepo>(),
                },
                {
                    provide: PersonPermissions,
                    useValue: createMock<PersonPermissions>(),
                },
            ],
        }).compile();

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));

        providerController = module.get(ProviderController);

        personPermissionsRepoMock = module.get(PersonPermissionsRepo);
        personPermissions = module.get(PersonPermissions);
        rolleRepoMock = module.get(RolleRepo);
        serviceProviderRepoMock = module.get(ServiceProviderRepo);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(providerController).toBeDefined();
    });

    describe('/GET available service provider', () => {
        it('should return available service provider for a specific user', async () => {
            const user: User = createMock<User>({ preferred_username: faker.internet.userName() });
            const person: Person<true> = Person.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.person.lastName(),
                faker.person.firstName(),
                '1',
                faker.lorem.word(),
                undefined,
                faker.string.uuid(),
            );
            person.geburtsdatum = faker.date.past();
            personPermissions.getRoleIds.mockImplementationOnce(() => {
                return Promise.resolve(['abdcc2b9-5086-4bf2-bbee-03d6a013b7f8']);
            });
            personPermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personPermissions);

            const serviceProviderIds: string[] = [faker.string.uuid()];
            rolleRepoMock.findById.mockImplementationOnce((id: string) => {
                return Promise.resolve(DoFactory.createRolle(true, { id: id, serviceProviderIds: serviceProviderIds }));
            });

            const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true);
            serviceProviderRepoMock.findById.mockResolvedValueOnce(serviceProvider);

            const result: ServiceProviderResponse[] = await providerController.getAvailableServiceProviders(user);

            expect(result).toBeInstanceOf(Array);
        });
    });
});
