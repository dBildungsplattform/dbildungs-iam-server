import { faker } from '@faker-js/faker';
import { MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { App } from 'supertest/types.js';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
    DoFactory,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/index.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonenKontextApiModule } from '../personenkontext-api.module.js';
import { RollenArt, RollenMerkmal, RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';

function createRolle(
    this: void,
    serviceProviderRepo: ServiceProviderRepo,
    params: Partial<Rolle<boolean>> = {},
): Rolle<false> {
    const rolle: Rolle<false> = Rolle.createNew(
        serviceProviderRepo,
        faker.string.alpha(),
        faker.string.uuid(),
        faker.helpers.enumValue(RollenArt),
        [faker.helpers.enumValue(RollenMerkmal)],
        [faker.helpers.enumValue(RollenSystemRecht)],
        [],
    );
    Object.assign(rolle, params);

    return rolle;
}

describe('DbiamPersonenkontextFilterController Integration Test', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let organisationRepo: OrganisationRepo;
    let rolleRepo: RolleRepo;
    let serviceProviderRepo: ServiceProviderRepo;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                MapperTestModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                PersonenKontextApiModule,
            ],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
            ],
        }).compile();

        orm = module.get(MikroORM);
        organisationRepo = module.get(OrganisationRepo);
        rolleRepo = module.get(RolleRepo);
        serviceProviderRepo = module.get(ServiceProviderRepo);

        await DatabaseTestModule.setupDatabase(orm);
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

    describe('/GET rollen for personenkontext', () => {
        it('should return all rollen for a personenkontext based on PersonenkontextAnlage', async () => {
            const rolleName: string = faker.string.alpha({ length: 10 });
            await rolleRepo.save(createRolle(serviceProviderRepo, { name: rolleName }));
            const response: Response = await request(app.getHttpServer() as App)
                .get(`/personenkontext/rollen?rolleName=${rolleName}&limit=25`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });

        it('should return empty list', async () => {
            const response: Response = await request(app.getHttpServer() as App)
                .get(`/personenkontext/rollen?rolleName=${faker.string.alpha()}&limit=25`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });
    });

    describe('/GET schulstrukturknoten for personenkontext', () => {
        it('should return all schulstrukturknoten for a personenkontext based on PersonenkontextAnlage', async () => {
            const rolleName: string = faker.string.alpha({ length: 10 });
            const sskName: string = faker.company.name();
            const rolle: Rolle<true> = await rolleRepo.save(createRolle(serviceProviderRepo, { name: rolleName }));
            const rolleId: string = rolle.id;
            await organisationRepo.save(DoFactory.createOrganisation(false, { name: sskName }));

            const response: Response = await request(app.getHttpServer() as App)
                .get(`/personenkontext/schulstrukturknoten?rolleId=${rolleId}&sskName=${sskName}&limit=25`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });

        it('should return empty list', async () => {
            const response: Response = await request(app.getHttpServer() as App)
                .get(
                    `/personenkontext/schulstrukturknoten?rolleId=${faker.string.uuid()}&sskName=${faker.string.alpha()}&limit=25`,
                )
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });
    });
});
