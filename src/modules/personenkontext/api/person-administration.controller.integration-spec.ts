import { faker } from '@faker-js/faker';
import { MikroORM } from '@mikro-orm/core';
import { CallHandler, ExecutionContext, INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { App } from 'supertest/types.js';
import {
    ConfigTestModule,
    createPassportUserMock,
    createPersonPermissionsMock,
    DatabaseTestModule,
    DoFactory,
    KeycloakConfigTestModule,
} from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/index.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonenKontextApiModule } from '../personenkontext-api.module.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { PersonPermissionsRepo } from '../../authentication/domain/person-permission.repo.js';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { FindRollenResponse } from './response/find-rollen.response.js';
import { KeycloakAdministrationModule } from '../../keycloak-administration/keycloak-administration.module.js';
import { KeycloakConfigModule } from '../../keycloak-administration/keycloak-config.module.js';
import { DeepMocked } from '../../../../test/utils/createMock.js';

describe('PersonAdministrationController Integration Test', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let rolleRepo: RolleRepo;
    let personpermissionsRepoMock: DeepMocked<PersonPermissionsRepo>;
    let personPermissionsMock: DeepMocked<PersonPermissions>;

    beforeAll(async () => {
        personPermissionsMock = createPersonPermissionsMock();
        personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: true });
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                PersonenKontextApiModule,
                KeycloakAdministrationModule,
            ],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                {
                    provide: PersonPermissionsRepo,
                    useValue: personpermissionsRepoMock,
                },
                {
                    provide: APP_INTERCEPTOR,
                    useValue: {
                        intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
                            const req: Request = context.switchToHttp().getRequest();
                            req.passportUser = createPassportUserMock(personPermissionsMock);
                            return next.handle();
                        },
                    },
                },
            ],
        })
            .overrideModule(KeycloakConfigModule)
            .useModule(KeycloakConfigTestModule.forRoot({ isKeycloakRequired: true }))
            .compile();

        orm = module.get(MikroORM);
        rolleRepo = module.get(RolleRepo);
        personpermissionsRepoMock = module.get(PersonPermissionsRepo);

        await DatabaseTestModule.setupDatabase(orm);
        app = module.createNestApplication();
        await app.init();
    }, 10000000);

    afterAll(async () => {
        await orm.close();
        await app.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    describe('/GET rollen for personenkontext', () => {
        it('should return all rollen for a logged-in user without filter, if the user is Landesadmin', async () => {
            const rolleName: string = faker.string.alpha({ length: 10 });
            await rolleRepo.save(DoFactory.createRolle(false, { name: rolleName, rollenart: RollenArt.SYSADMIN }));
            const schuladminRolleName: string = faker.string.alpha({ length: 10 });
            await rolleRepo.save(
                DoFactory.createRolle(false, { name: schuladminRolleName, rollenart: RollenArt.LEIT }),
            );

            const response: Response = await request(app.getHttpServer() as App)
                .get('/person-administration/rollen')
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
            expect(response.body).toEqual(
                expect.objectContaining({
                    total: 2,
                }) as FindRollenResponse,
            );
        });

        it('should return all rollen for a logged-in user based on search filter', async () => {
            const rolleName: string = faker.string.alpha({ length: 10 });
            await rolleRepo.save(DoFactory.createRolle(false, { name: rolleName }));
            const response: Response = await request(app.getHttpServer() as App)
                .get(`/person-administration/rollen?rolleName=${rolleName}&limit=25`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });

        it('should return empty list, if rollen do not exist', async () => {
            const response: Response = await request(app.getHttpServer() as App)
                .get(`/person-administration/rollen?rolleName=${faker.string.alpha()}&limit=25`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });
    });
});
