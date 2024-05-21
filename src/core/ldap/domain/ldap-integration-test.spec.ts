import { MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { App } from 'supertest/types.js';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DoFactory,
    LdapTestModule,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { CreateOrganisationBodyParams } from '../../../modules/organisation/api/create-organisation.body.params.js';
import { OrganisationsTyp } from '../../../modules/organisation/domain/organisation.enums.js';
import { LdapConfigModule } from '../ldap-config.module.js';
import { LdapModule } from '../ldap.module.js';
import { OrganisationApiModule } from '../../../modules/organisation/organisation-api.module.js';
import { OrganisationRepo } from '../../../modules/organisation/persistence/organisation.repo.js';
import { OrganisationDo } from '../../../modules/organisation/domain/organisation.do.js';
import { DBiamCreatePersonenkontextBodyParams } from '../../../modules/personenkontext/api/dbiam-create-personenkontext.body.params.js';
import { Rolle } from '../../../modules/rolle/domain/rolle.js';
import { RollenArt } from '../../../modules/rolle/domain/rolle.enums.js';
import { RolleRepo } from '../../../modules/rolle/repo/rolle.repo.js';
import { PersonDo } from '../../../modules/person/domain/person.do.js';
import { PersonRepo } from '../../../modules/person/persistence/person.repo.js';
import { PersonenKontextApiModule } from '../../../modules/personenkontext/personenkontext-api.module.js';

describe('LDAP Integration Test', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let organisationRepo: OrganisationRepo;
    let personRepo: PersonRepo;
    let rolleRepo: RolleRepo;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                LdapModule,
                MapperTestModule,
                OrganisationApiModule,
                PersonenKontextApiModule,
            ],
            providers: [
                OrganisationRepo,
                PersonRepo,
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
            ],
        })
            .overrideModule(LdapConfigModule)
            .useModule(LdapTestModule.forRoot({ isLdapRequired: true }))
            .compile();

        orm = module.get(MikroORM);
        organisationRepo = module.get(OrganisationRepo);
        personRepo = module.get(PersonRepo);
        rolleRepo = module.get(RolleRepo);
        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await app.close();
    });

    beforeEach(async () => {
        jest.resetAllMocks();
        await DatabaseTestModule.clearDatabase(orm);
    });

    describe('LDAP event on /POST organisation', () => {
        it('should return', async () => {
            const organisationDo: OrganisationDo<false> = DoFactory.createOrganisation(false, { name: 'ROOT' });
            const organisation: OrganisationDo<true> = await organisationRepo.save(organisationDo);
            organisation.id = organisationRepo.ROOT_ORGANISATION_ID;
            await organisationRepo.save(organisation);

            const params: CreateOrganisationBodyParams = {
                name: 'TestSchule',
                typ: OrganisationsTyp.SCHULE,
                kennung: '1234567',
                administriertVon: undefined,
                zugehoerigZu: undefined,
            };

            const response: Response = await request(app.getHttpServer() as App)
                .post('/organisationen')
                .send(params);

            expect(response.status).toBe(201);
        });
    });

    describe('LDAP event on /POST dbiam/personenkontext', () => {
        it('should return', async () => {
            const organisationDo: OrganisationDo<false> = DoFactory.createOrganisation(false, { name: 'ROOT' });
            let organisation: OrganisationDo<true> = await organisationRepo.save(organisationDo);
            organisation.id = organisationRepo.ROOT_ORGANISATION_ID;
            organisation = await organisationRepo.save(organisation);
            const lehrer: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
            const lehrerRolleDummy: Rolle<false> = DoFactory.createRolle(false, { rollenart: RollenArt.LEHR });
            const lehrerRolle: Rolle<true> = await rolleRepo.save(lehrerRolleDummy);

            const params: DBiamCreatePersonenkontextBodyParams = {
                personId: lehrer.id,
                organisationId: organisation.id,
                rolleId: lehrerRolle.id,
            };

            const response: Response = await request(app.getHttpServer() as App)
                .post('/dbiam/personenkontext')
                .send(params);

            expect(response.status).toBe(201);
        });
    });
});
