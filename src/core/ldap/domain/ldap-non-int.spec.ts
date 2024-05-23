import { EntityManager, MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
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
import { OrganisationApiModule } from '../../../modules/organisation/organisation-api.module.js';
import { OrganisationRepo } from '../../../modules/organisation/persistence/organisation.repo.js';
import { OrganisationDo } from '../../../modules/organisation/domain/organisation.do.js';
import { DBiamCreatePersonenkontextBodyParams } from '../../../modules/personenkontext/api/dbiam-create-personenkontext.body.params.js';
import { RolleRepo } from '../../../modules/rolle/repo/rolle.repo.js';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Rolle } from '../../../modules/rolle/domain/rolle.js';
import { RollenArt } from '../../../modules/rolle/domain/rolle.enums.js';
import { LdapModule } from '../ldap.module.js';
import { PersonenKontextApiModule } from '../../../modules/personenkontext/personenkontext-api.module.js';
import { DBiamPersonenkontextRepo } from '../../../modules/personenkontext/persistence/dbiam-personenkontext.repo.js';
import { Personenkontext } from '../../../modules/personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextResponse } from '../../../modules/personenkontext/api/dbiam-personenkontext.response.js';
import { DBiamPersonenkontextController } from '../../../modules/personenkontext/api/dbiam-personenkontext.controller.js';
import { PersonRepository } from '../../../modules/person/persistence/person.repository.js';
import { Person } from '../../../modules/person/domain/person.js';
import { PersonRepo } from '../../../modules/person/persistence/person.repo.js';
import { OrganisationController } from '../../../modules/organisation/api/organisation.controller.js';
import { OrganisationResponse } from '../../../modules/organisation/api/organisation.response.js';
import { CreatedOrganisationDto } from '../../../modules/organisation/api/created-organisation.dto.js';
import { OrganisationUc } from '../../../modules/organisation/api/organisation.uc.js';
import { OrganisationPersistenceMapperProfile } from '../../../modules/organisation/persistence/organisation-persistence.mapper.profile.js';
import { getMapperToken } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';

function createPerson(): Person<true> {
    return Person.construct(
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
}

describe('LDAP Non Integration Test', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let em: EntityManager;
    let organisationRepoMock: DeepMocked<OrganisationRepo>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let personRepoMock: DeepMocked<PersonRepo>;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let dbiamPersonenKontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let organisationUcMock: DeepMocked<OrganisationUc>;

    let organisationController: OrganisationController;
    let dBiamPersonenkontextController: DBiamPersonenkontextController;
    let mapper: Mapper;

    let rootOrga: OrganisationDo<true>;
    const kennung: string = faker.string.numeric({ length: 7 });

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
                OrganisationPersistenceMapperProfile,
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
            ],
        })
            .overrideModule(LdapConfigModule)
            .useModule(LdapTestModule.forRoot({ isLdapRequired: true }))
            .overrideProvider(OrganisationRepo)
            .useValue(createMock<OrganisationRepo>())
            .overrideProvider(PersonRepository)
            .useValue(createMock<PersonRepository>())
            .overrideProvider(PersonRepo)
            .useValue(createMock<PersonRepo>())
            .overrideProvider(RolleRepo)
            .useValue(createMock<RolleRepo>())
            .overrideProvider(DBiamPersonenkontextRepo)
            .useValue(createMock<DBiamPersonenkontextRepo>())
            .overrideProvider(OrganisationUc)
            .useValue(createMock<OrganisationUc>())
            .compile();

        orm = module.get(MikroORM);
        em = module.get(EntityManager);

        organisationController = module.get(OrganisationController);
        dBiamPersonenkontextController = module.get(DBiamPersonenkontextController);
        mapper = module.get(getMapperToken());

        organisationRepoMock = module.get(OrganisationRepo);
        personRepositoryMock = module.get(PersonRepository);
        personRepoMock = module.get(PersonRepo);
        rolleRepoMock = module.get(RolleRepo);
        dbiamPersonenKontextRepoMock = module.get(DBiamPersonenkontextRepo);
        organisationUcMock = module.get(OrganisationUc);

        rootOrga = DoFactory.createOrganisation(true, {
            name: 'ROOT',
            id: organisationRepoMock.ROOT_ORGANISATION_ID,
            kennung: kennung,
        });

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await DatabaseTestModule.clearDatabase(orm);
        await orm.close();
        await app.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
        //await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(em).toBeDefined();
    });

    describe('GET', () => {
        describe('LDAP event on /POST organisation', () => {
            it('should return 201', async () => {
                const params: CreateOrganisationBodyParams = {
                    name: 'TestSchule',
                    typ: OrganisationsTyp.SCHULE,
                    kennung: kennung,
                    administriertVon: rootOrga.id,
                    zugehoerigZu: rootOrga.id,
                };

                const organisationDo: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.SCHULE,
                    kennung: kennung,
                });
                organisationRepoMock.findById.mockResolvedValue(rootOrga);

                const created: CreatedOrganisationDto = mapper.map(
                    organisationDo,
                    OrganisationDo,
                    CreatedOrganisationDto,
                );
                organisationUcMock.createOrganisation.mockResolvedValue(created);

                const response: OrganisationResponse = await organisationController.createOrganisation(params);
                expect(response).toBeDefined();
            });
        });

        describe('LDAP event on /POST dbiam/personenkontext', () => {
            it('should return 201', async () => {
                const persona: Person<true> = createPerson();
                const rolle: Rolle<true> = DoFactory.createRolle(true, {
                    id: faker.string.uuid(),
                    rollenart: RollenArt.LEHR,
                });

                const params: DBiamCreatePersonenkontextBodyParams = {
                    personId: persona.id,
                    organisationId: rootOrga.id,
                    rolleId: rolle.id,
                };

                const personenkontext: DeepMocked<Personenkontext<true>> = createMock<Personenkontext<true>>({
                    organisationId: rootOrga.id,
                });

                personRepositoryMock.findById.mockResolvedValue(persona);
                rolleRepoMock.findById.mockResolvedValue(rolle);
                dbiamPersonenKontextRepoMock.exists.mockResolvedValue(false); //entity should not exist yet
                dbiamPersonenKontextRepoMock.save.mockResolvedValue(personenkontext);

                organisationRepoMock.findById.mockResolvedValue(rootOrga);

                personRepoMock.exists.mockResolvedValue(true);
                organisationRepoMock.exists.mockResolvedValue(true);
                rolleRepoMock.exists.mockResolvedValue(true);

                const response: DBiamPersonenkontextResponse =
                    await dBiamPersonenkontextController.createPersonenkontext(params);
                expect(response).toBeDefined();
            });
        });

        describe('ugly', () => {
            it('should return 201', async () => {
                const orgaParams: CreateOrganisationBodyParams = {
                    name: 'TestSchule',
                    typ: OrganisationsTyp.SCHULE,
                    kennung: kennung,
                    administriertVon: rootOrga.id,
                    zugehoerigZu: rootOrga.id,
                };

                const organisationDo: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.SCHULE,
                    kennung: kennung,
                });
                organisationRepoMock.findById.mockResolvedValue(rootOrga);

                const created: CreatedOrganisationDto = mapper.map(
                    organisationDo,
                    OrganisationDo,
                    CreatedOrganisationDto,
                );
                organisationUcMock.createOrganisation.mockResolvedValue(created);

                await organisationController.createOrganisation(orgaParams);

                ////
                const persona: Person<true> = createPerson();
                const rolle: Rolle<true> = DoFactory.createRolle(true, {
                    id: faker.string.uuid(),
                    rollenart: RollenArt.LEHR,
                });

                const params: DBiamCreatePersonenkontextBodyParams = {
                    personId: persona.id,
                    organisationId: rootOrga.id,
                    rolleId: rolle.id,
                };

                const personenkontext: DeepMocked<Personenkontext<true>> = createMock<Personenkontext<true>>({
                    organisationId: rootOrga.id,
                });

                personRepositoryMock.findById.mockResolvedValue(persona);
                rolleRepoMock.findById.mockResolvedValue(rolle);
                dbiamPersonenKontextRepoMock.exists.mockResolvedValue(false); //entity should not exist yet
                dbiamPersonenKontextRepoMock.save.mockResolvedValue(personenkontext);

                organisationRepoMock.findById.mockResolvedValue(rootOrga);

                personRepoMock.exists.mockResolvedValue(true);
                organisationRepoMock.exists.mockResolvedValue(true);
                rolleRepoMock.exists.mockResolvedValue(true);

                const response: DBiamPersonenkontextResponse =
                    await dBiamPersonenkontextController.createPersonenkontext(params);
                expect(response).toBeDefined();
            });
        });
    });
});
