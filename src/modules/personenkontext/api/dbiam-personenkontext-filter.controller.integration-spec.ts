import { faker } from '@faker-js/faker';
import { MikroORM } from '@mikro-orm/core';
import { CallHandler, ExecutionContext, INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
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
import { RolleFactory } from '../../rolle/domain/rolle.factory.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { PersonPermissionsRepo } from '../../authentication/domain/person-permission.repo.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Observable } from 'rxjs';
import { PassportUser } from '../../authentication/types/user.js';
import { Request } from 'express';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { FindRollenResponse } from './response/find-rollen.response.js';

function createRolle(this: void, rolleFactory: RolleFactory, params: Partial<Rolle<boolean>> = {}): Rolle<false> {
    const rolle: Rolle<false> = rolleFactory.createNew(
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
    let rolleFactory: RolleFactory;
    let personpermissionsRepoMock: DeepMocked<PersonPermissionsRepo>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                MapperTestModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                PersonenKontextApiModule,
            ],
            providers: [
                RolleFactory,
                OrganisationRepository,
                ServiceProviderRepo,
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                {
                    provide: PersonPermissionsRepo,
                    useValue: createMock<PersonPermissionsRepo>(),
                },
                {
                    provide: APP_INTERCEPTOR,
                    useValue: {
                        intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
                            const req: Request = context.switchToHttp().getRequest();
                            req.passportUser = createMock<PassportUser>({
                                async personPermissions() {
                                    return personpermissionsRepoMock.loadPersonPermissions('');
                                },
                            });
                            return next.handle();
                        },
                    },
                },
            ],
        }).compile();

        orm = module.get(MikroORM);
        organisationRepo = module.get(OrganisationRepo);
        rolleRepo = module.get(RolleRepo);
        rolleFactory = module.get(RolleFactory);
        personpermissionsRepoMock = module.get(PersonPermissionsRepo);

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
        it('should return all rollen for a personenkontext without filter, if the user is Landesadmin', async () => {
            const rolleName: string = faker.string.alpha({ length: 10 });
            await rolleRepo.save(createRolle(rolleFactory, { name: rolleName, rollenart: RollenArt.SYSADMIN }));
            const schuladminRolleName: string = faker.string.alpha({ length: 10 });
            await rolleRepo.save(createRolle(rolleFactory, { name: schuladminRolleName, rollenart: RollenArt.LEIT }));

            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([organisationRepo.ROOT_ORGANISATION_ID]);
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);

            const response: Response = await request(app.getHttpServer() as App)
                .get('/personenkontext/rollen')
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
            expect(response.body).toEqual(
                expect.objectContaining({
                    total: 2,
                }) as FindRollenResponse,
            );
        });

        it('should return all rollen for a personenkontext based on PersonenkontextAnlage', async () => {
            const rolleName: string = faker.string.alpha({ length: 10 });
            await rolleRepo.save(createRolle(rolleFactory, { name: rolleName }));
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
            const rolle: Rolle<true> = await rolleRepo.save(createRolle(rolleFactory, { name: rolleName }));
            const rolleId: string = rolle.id;
            await organisationRepo.save(DoFactory.createOrganisation(false, { name: sskName }));

            const response: Response = await request(app.getHttpServer() as App)
                .get(`/personenkontext/schulstrukturknoten?rolleId=${rolleId}&sskName=${sskName}&limit=25`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });

        it('should return all schulstrukturknoten for a personenkontext based on PersonenkontextAnlage even when no sskName is provided', async () => {
            const rolleName: string = faker.string.alpha({ length: 10 });
            const sskName: string = faker.company.name();
            const rolle: Rolle<true> = await rolleRepo.save(createRolle(rolleFactory, { name: rolleName }));
            const rolleId: string = rolle.id;
            await organisationRepo.save(DoFactory.createOrganisation(false, { name: sskName }));

            const response: Response = await request(app.getHttpServer() as App)
                .get(`/personenkontext/schulstrukturknoten?rolleId=${rolleId}&limit=25`)
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

        it('should return empty list even when no sskName is provided', async () => {
            const response: Response = await request(app.getHttpServer() as App)
                .get(`/personenkontext/schulstrukturknoten?rolleId=${faker.string.uuid()}&limit=25`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });
    });
});
