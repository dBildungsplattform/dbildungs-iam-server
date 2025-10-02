//import { MikroORM } from '@mikro-orm/core';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Client } from 'openid-client';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { DatabaseTestModule } from '../../../../test/utils/database-test.module.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../../test/utils/timeouts.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OIDC_CLIENT } from '../../authentication/services/oidc-client.service.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderService } from '../domain/service-provider.service.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { ServiceProviderApiModule } from '../service-provider-api.module.js';
import { ProviderController } from './provider.controller.js';
import { ServiceProviderResponse } from './service-provider.response.js';

describe('Provider Controller Test', () => {
    let app: INestApplication;
    let serviceProviderServiceMock: DeepMocked<ServiceProviderService>;
    let serviceProviderRepoMock: DeepMocked<ServiceProviderRepo>;
    let providerController: ProviderController;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
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
            .overrideProvider(ServiceProviderService)
            .useValue(createMock<ServiceProviderService>())
            .overrideProvider(ServiceProviderRepo)
            .useValue(createMock<ServiceProviderRepo>())
            .compile();

        serviceProviderServiceMock = module.get<DeepMocked<ServiceProviderService>>(ServiceProviderService);
        serviceProviderRepoMock = module.get<DeepMocked<ServiceProviderRepo>>(ServiceProviderRepo);
        providerController = module.get(ProviderController);

        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await app.close();
    });

    describe('getAllServiceProviders', () => {
        describe('when service providers were found', () => {
            it('should return all service provider', async () => {
                const spId: string = faker.string.uuid();
                const sp: ServiceProvider<true> = DoFactory.createServiceProvider(true, { id: spId });

                serviceProviderRepoMock.find.mockResolvedValueOnce([sp]);

                const spResponse: ServiceProviderResponse[] = await providerController.getAllServiceProviders();
                expect(spResponse).toBeDefined();
                expect(spResponse).toBeInstanceOf(Array);
                expect(spResponse).toHaveLength(1);
            });
        });

        describe('when no service providers were found', () => {
            it('should return empty list as response', async () => {
                serviceProviderRepoMock.find.mockResolvedValueOnce([]);

                const spResponse: ServiceProviderResponse[] = await providerController.getAllServiceProviders();
                expect(spResponse).toBeDefined();
                expect(spResponse).toBeInstanceOf(Array);
                expect(spResponse).toHaveLength(0);
            });
        });
    });

    describe('getAvailableServiceProviders', () => {
        let pk: Personenkontext<true>;
        let rolleId: string;
        let spId: string;
        let sp: ServiceProvider<true>;
        let personPermissions: DeepMocked<PersonPermissions>;

        beforeEach(() => {
            rolleId = faker.string.uuid();
            spId = faker.string.uuid();
            sp = DoFactory.createServiceProvider(true, { id: spId });
            pk = DoFactory.createPersonenkontext(true, { rolleId });
            personPermissions = createMock<PersonPermissions>({});
            personPermissions.getPersonenkontextIds.mockResolvedValueOnce([
                { organisationId: pk.organisationId, rolleId: pk.rolleId },
            ]);
        });

        describe.each([
            ['found', true],
            ['not found', false],
        ])('when service providers were %s', (_label: string, hasFoundServiceProviders: boolean) => {
            beforeEach(() => {
                serviceProviderServiceMock.getServiceProvidersByOrganisationenAndRollen.mockResolvedValueOnce(
                    hasFoundServiceProviders ? [sp] : [],
                );
            });
            it('should return list of responses', async () => {
                const spResponse: ServiceProviderResponse[] =
                    await providerController.getAvailableServiceProviders(personPermissions);
                expect(spResponse).toBeDefined();
                expect(spResponse).toBeInstanceOf(Array);
                if (hasFoundServiceProviders) {
                    expect(spResponse).toHaveLength(1);
                } else {
                    expect(spResponse).toHaveLength(0);
                }
                expect(serviceProviderServiceMock.getServiceProvidersByOrganisationenAndRollen).toHaveBeenCalledWith([
                    { organisationId: pk.organisationId, rolleId: pk.rolleId },
                ]);
            });
        });
    });
});
