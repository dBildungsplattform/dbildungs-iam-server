//import { MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { DatabaseTestModule } from '../../../../test/utils/database-test.module.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../../test/utils/timeouts.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { ServiceProviderApiModule } from '../service-provider-api.module.js';
import { MapperTestModule } from '../../../../test/utils/mapper-test.module.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OIDC_CLIENT } from '../../authentication/services/oidc-client.service.js';
import { Client } from 'openid-client';
import { ProviderController } from './provider.controller.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { ServiceProviderResponse } from './service-provider.response.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { faker } from '@faker-js/faker';
import { ServiceProvider } from '../domain/service-provider.js';

describe('Provider Controller Test', () => {
    let app: INestApplication;
    let serviceProviderRepoMock: DeepMocked<ServiceProviderRepo>;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let providerController: ProviderController;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                MapperTestModule,
                ServiceProviderApiModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: false }),
            ],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                {
                    provide: OIDC_CLIENT,
                    useValue: createMock<Client>(),
                },
            ],
        })
            .overrideProvider(RolleRepo)
            .useValue(createMock<RolleRepo>())
            .overrideProvider(ServiceProviderRepo)
            .useValue(createMock<ServiceProviderRepo>())
            .compile();

        serviceProviderRepoMock = module.get(ServiceProviderRepo);
        rolleRepoMock = module.get(RolleRepo);
        providerController = module.get(ProviderController);
        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await app.close();
    });

    describe('getAvailableServiceProviders', () => {
        describe('when service providers were found', () => {
            it('should return all service provider', async () => {
                const rolleId: string = faker.string.uuid();
                const spId: string = faker.string.uuid();

                const rolle: Rolle<true> = DoFactory.createRolle(true, { id: rolleId, serviceProviderIds: [spId] });
                const sp: ServiceProvider<true> = DoFactory.createServiceProvider(true, { id: spId });
                const personPermissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>({});
                personPermissions.getRoleIds.mockResolvedValueOnce([rolleId]);

                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                serviceProviderRepoMock.findById.mockResolvedValueOnce(sp);

                const spResponse: ServiceProviderResponse[] =
                    await providerController.getAvailableServiceProviders(personPermissions);
                expect(spResponse).toBeDefined();
                expect(spResponse).toBeInstanceOf(Array);
                expect(spResponse).toHaveLength(1);
            });
        });

        describe('when multiple rollen were with service providers were found', () => {
            it('should not return duplicates for service provider', async () => {
                const rolle1Id: string = faker.string.uuid();
                const rolle2Id: string = faker.string.uuid();

                const spId: string = faker.string.uuid();

                const rolle1: Rolle<true> = DoFactory.createRolle(true, { id: rolle1Id, serviceProviderIds: [spId] });
                const rolle2: Rolle<true> = DoFactory.createRolle(true, { id: rolle2Id, serviceProviderIds: [spId] });

                const sp: ServiceProvider<true> = DoFactory.createServiceProvider(true, { id: spId });
                const personPermissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>({});
                personPermissions.getRoleIds.mockResolvedValueOnce([rolle1Id, rolle2Id]);

                //mock for first rolleId, first found rolle
                rolleRepoMock.findById.mockResolvedValueOnce(rolle1);
                serviceProviderRepoMock.findById.mockResolvedValueOnce(sp);

                //mock for second rolleId, second found rolle
                rolleRepoMock.findById.mockResolvedValueOnce(rolle2);
                serviceProviderRepoMock.findById.mockResolvedValueOnce(sp);

                const spResponse: ServiceProviderResponse[] =
                    await providerController.getAvailableServiceProviders(personPermissions);
                expect(spResponse).toBeDefined();
                expect(spResponse).toBeInstanceOf(Array);
                expect(spResponse).toHaveLength(1);
            });
        });

        describe('when no service providers were found', () => {
            it('should return empty list as response', async () => {
                const rolleId: string = faker.string.uuid();
                const spId: string = faker.string.uuid();

                const rolle: Rolle<true> = DoFactory.createRolle(true, { id: rolleId, serviceProviderIds: [spId] });
                const personPermissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>({});
                personPermissions.getRoleIds.mockResolvedValueOnce([rolleId]);

                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                serviceProviderRepoMock.findById.mockResolvedValueOnce(undefined);

                const spResponse: ServiceProviderResponse[] =
                    await providerController.getAvailableServiceProviders(personPermissions);
                expect(spResponse).toBeDefined();
                expect(spResponse).toBeInstanceOf(Array);
                expect(spResponse).toHaveLength(0);
            });
        });
    });
});
