import { MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { App } from 'supertest/types.js';

import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { DatabaseTestModule } from '../../../../test/utils/database-test.module.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../../test/utils/timeouts.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { ServiceProviderApiModule } from '../service-provider-api.module.js';
import { MapperTestModule } from '../../../../test/utils/mapper-test.module.js';
import { createMock } from '@golevelup/ts-jest';
import { OIDC_CLIENT } from '../../authentication/services/oidc-client.service.js';
import { Client } from 'openid-client';

describe('ServiceProvider API', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let serviceProviderRepo: ServiceProviderRepo;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                MapperTestModule,
                ServiceProviderApiModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
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
        }).compile();

        orm = module.get(MikroORM);
        serviceProviderRepo = module.get(ServiceProviderRepo);

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await app.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    describe('/GET all service provider', () => {
        it('should return all service provider', async () => {
            await Promise.all([
                serviceProviderRepo.save(DoFactory.createServiceProvider(false)),
                serviceProviderRepo.save(DoFactory.createServiceProvider(false)),
                serviceProviderRepo.save(DoFactory.createServiceProvider(false)),
            ]);

            const response: Response = await request(app.getHttpServer() as App)
                .get('/provider/all')
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body).toHaveLength(3);
        });
    });

    describe('/GET logo', () => {
        describe('when the service provider exists and has a logo', () => {
            it('should return the image file', async () => {
                const serviceProvider: ServiceProvider<true> = await serviceProviderRepo.save(
                    DoFactory.createServiceProvider(false),
                );

                const response: Response = await request(app.getHttpServer() as App)
                    .get(`/provider/${serviceProvider.id}/logo`)
                    .send();

                expect(response.status).toBe(200);
                expect(response.body).toBeInstanceOf(Buffer);
            });
        });

        describe('when the service provider exists but does not have a logo', () => {
            it('should return 404', async () => {
                const serviceProvider: ServiceProvider<true> = await serviceProviderRepo.save(
                    DoFactory.createServiceProvider(false, { logo: undefined, logoMimeType: undefined }),
                );

                const response: Response = await request(app.getHttpServer() as App)
                    .get(`/provider/${serviceProvider.id}/logo`)
                    .send();

                expect(response.status).toBe(404);
            });
        });

        describe('when the service provider does not exist', () => {
            it('should return 404', async () => {
                const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true);

                const response: Response = await request(app.getHttpServer() as App)
                    .get(`/provider/${serviceProvider.id}/logo`)
                    .send();

                expect(response.status).toBe(404);
            });
        });
    });
});
