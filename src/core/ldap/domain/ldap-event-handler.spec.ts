import { MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';

import { LdapModule } from '../ldap.module.js';
import { OrganisationApiModule } from '../../../modules/organisation/organisation-api.module.js';
import { PersonenKontextApiModule } from '../../../modules/personenkontext/personenkontext-api.module.js';
import { LdapEventHandler } from './ldap-event-handler.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LdapClientService } from './ldap-client.service.js';
import { CreatedSchuleEvent } from '../../../shared/events/created-schule.event.js';
import { OrganisationsTyp } from '../../../modules/organisation/domain/organisation.enums.js';
import { OrganisationRepo } from '../../../modules/organisation/persistence/organisation.repo.js';
import { PersonRepository } from '../../../modules/person/persistence/person.repository.js';
import { RolleRepo } from '../../../modules/rolle/repo/rolle.repo.js';
import { CreatedPersonenkontextEvent } from '../../../shared/events/created-personenkontext.event.js';
import { Personenkontext } from '../../../modules/personenkontext/domain/personenkontext.js';
import { faker } from '@faker-js/faker';
import { Rolle } from '../../../modules/rolle/domain/rolle.js';
import { Person } from '../../../modules/person/domain/person.js';
import { Organisation } from '../../../modules/organisation/domain/organisation.js';
import { RollenArt } from '../../../modules/rolle/domain/rolle.enums.js';
import { DeletedSchuleEvent } from '../../../shared/events/deleted-schule.event.js';
import { DeletedPersonenkontextEvent } from '../../../shared/events/deleted-personenkontext.event.js';

function createPersonenkontext<WasPersisted extends boolean>(
    this: void,
    withId: WasPersisted,
    params: Partial<Personenkontext<boolean>> = {},
): Personenkontext<WasPersisted> {
    const personenkontext: Personenkontext<WasPersisted> = Personenkontext.construct<boolean>(
        withId ? faker.string.uuid() : undefined,
        withId ? faker.date.past() : undefined,
        withId ? faker.date.recent() : undefined,
        faker.string.uuid(),
        faker.string.uuid(),
        faker.string.uuid(),
    );

    Object.assign(personenkontext, params);

    return personenkontext;
}

describe('LDAP Event Handler', () => {
    let app: INestApplication;
    let orm: MikroORM;

    let organisationRepoMock: DeepMocked<OrganisationRepo>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let rolleRepoMock: DeepMocked<RolleRepo>;

    let ldapEventHandler: LdapEventHandler;
    let ldapClientServiceMock: DeepMocked<LdapClientService>;

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
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
            ],
        })
            .overrideProvider(LdapClientService)
            .useValue(createMock<LdapClientService>())
            .overrideProvider(OrganisationRepo)
            .useValue(createMock<OrganisationRepo>())
            .overrideProvider(PersonRepository)
            .useValue(createMock<PersonRepository>())
            .overrideProvider(RolleRepo)
            .useValue(createMock<RolleRepo>())
            /*     .overrideProvider(DBiamPersonenkontextRepo)
            .useValue(createMock<DBiamPersonenkontextRepo>())*/
            .compile();

        orm = module.get(MikroORM);

        organisationRepoMock = module.get(OrganisationRepo);
        personRepositoryMock = module.get(PersonRepository);
        rolleRepoMock = module.get(RolleRepo);

        ldapEventHandler = module.get(LdapEventHandler);
        ldapClientServiceMock = module.get(LdapClientService);

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

    describe('asyncCreateSchuleEventHandler', () => {
        describe('when type is SCHULE and creation is successful', () => {
            it('should execute without errors', async () => {
                const organisation: Organisation<true> = createMock<Organisation<true>>({
                    id: faker.string.uuid(),
                    typ: OrganisationsTyp.SCHULE,
                });

                const event: CreatedSchuleEvent = new CreatedSchuleEvent(organisation.id);
                const result: Result<Organisation<true>> = {
                    ok: true,
                    value: createMock<Organisation<true>>(),
                };
                ldapClientServiceMock.createOrganisation.mockResolvedValueOnce(result);

                await ldapEventHandler.asyncCreateSchuleEventHandler(event);
                expect(ldapClientServiceMock.createOrganisation).toHaveBeenCalledTimes(1);
            });
        });
        describe('when type is SCHULE and creation fails', () => {
            it('should execute without errors', async () => {
                const organisation: Organisation<true> = createMock<Organisation<true>>({
                    id: faker.string.uuid(),
                    typ: OrganisationsTyp.SCHULE,
                });

                const event: CreatedSchuleEvent = new CreatedSchuleEvent(organisation.id);
                const result: Result<Organisation<true>> = {
                    ok: false,
                    error: new Error(),
                };
                ldapClientServiceMock.createOrganisation.mockResolvedValueOnce(result);

                await ldapEventHandler.asyncCreateSchuleEventHandler(event);
                expect(ldapClientServiceMock.createOrganisation).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('asyncDeleteSchuleEventHandler', () => {
        describe('when type is SCHULE and deletion is successful', () => {
            it('should execute without errors', async () => {
                const organisation: Organisation<true> = createMock<Organisation<true>>({
                    name: 'TestSchule',
                    typ: OrganisationsTyp.SCHULE,
                    kennung: '1234567',
                });

                const event: DeletedSchuleEvent = new DeletedSchuleEvent(organisation.id);
                const result: Result<Organisation<true>> = {
                    ok: true,
                    value: createMock<Organisation<true>>(),
                };
                ldapClientServiceMock.deleteOrganisation.mockResolvedValueOnce(result);

                await ldapEventHandler.asyncDeleteSchuleEventHandler(event);
                expect(ldapClientServiceMock.deleteOrganisation).toHaveBeenCalledTimes(1);
            });
        });
        describe('when type is SCHULE and deletion fails', () => {
            it('should execute without errors', async () => {
                const organisation: Organisation<true> = createMock<Organisation<true>>({
                    name: 'TestSchule',
                    typ: OrganisationsTyp.SCHULE,
                    kennung: '1234567',
                });

                const event: DeletedSchuleEvent = new DeletedSchuleEvent(organisation.id);
                const result: Result<Organisation<true>> = {
                    ok: false,
                    error: new Error(),
                };
                ldapClientServiceMock.deleteOrganisation.mockResolvedValueOnce(result);

                await ldapEventHandler.asyncDeleteSchuleEventHandler(event);
                expect(ldapClientServiceMock.deleteOrganisation).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('asyncCreatePersonenkontextEventHandler', () => {
        describe('when rolle is not found', () => {
            it('should execute without errors', async () => {
                const personenkontext: Personenkontext<true> = createPersonenkontext(true);
                const event: CreatedPersonenkontextEvent = new CreatedPersonenkontextEvent(personenkontext.id);

                rolleRepoMock.findById.mockResolvedValueOnce(undefined);

                await ldapEventHandler.asyncCreatePersonenkontextEventHandler(event);
                expect(ldapClientServiceMock.createLehrer).toHaveBeenCalledTimes(0);
            });
        });
        describe('when person is not found', () => {
            it('should execute without errors', async () => {
                const personenkontext: Personenkontext<true> = createPersonenkontext(true);
                const event: CreatedPersonenkontextEvent = new CreatedPersonenkontextEvent(personenkontext.id);
                const rolle: Rolle<true> = createMock<Rolle<true>>();
                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                personRepositoryMock.findById.mockResolvedValueOnce(undefined);

                await ldapEventHandler.asyncCreatePersonenkontextEventHandler(event);
                expect(ldapClientServiceMock.createLehrer).toHaveBeenCalledTimes(0);
            });
        });
        describe('when organisation is not found', () => {
            it('should execute without errors', async () => {
                const personenkontext: Personenkontext<true> = createPersonenkontext(true);
                const event: CreatedPersonenkontextEvent = new CreatedPersonenkontextEvent(personenkontext.id);
                const rolle: Rolle<true> = createMock<Rolle<true>>();
                const person: Person<true> = createMock<Person<true>>();

                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                organisationRepoMock.findById.mockResolvedValueOnce(undefined);
                await ldapEventHandler.asyncCreatePersonenkontextEventHandler(event);
                expect(ldapClientServiceMock.createLehrer).toHaveBeenCalledTimes(0);
            });
        });
        describe('when creation of lehrer in LDAP fails', () => {
            it('should execute without errors', async () => {
                const personenkontext: Personenkontext<true> = createPersonenkontext(true);
                const event: CreatedPersonenkontextEvent = new CreatedPersonenkontextEvent(personenkontext.id);
                const rolle: Rolle<true> = createMock<Rolle<true>>({ rollenart: RollenArt.LEHR });
                const person: Person<true> = createMock<Person<true>>();
                const organisation: Organisation<true> = createMock<Organisation<true>>();

                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                organisationRepoMock.findById.mockResolvedValueOnce(organisation);

                ldapClientServiceMock.createLehrer.mockResolvedValueOnce({
                    ok: false,
                    error: new Error(),
                });
                await ldapEventHandler.asyncCreatePersonenkontextEventHandler(event);
                expect(ldapClientServiceMock.createLehrer).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('asyncDeletePersonenkontextEventHandler', () => {
        describe('when rolle is not found', () => {
            it('should execute without errors', async () => {
                const personenkontext: Personenkontext<true> = createPersonenkontext(true);
                const event: DeletedPersonenkontextEvent = new DeletedPersonenkontextEvent(personenkontext.id);

                rolleRepoMock.findById.mockResolvedValueOnce(undefined);

                await ldapEventHandler.asyncDeletePersonenkontextEventHandler(event);
                expect(ldapClientServiceMock.deleteLehrer).toHaveBeenCalledTimes(0);
            });
        });
        describe('when person is not found', () => {
            it('should execute without errors', async () => {
                const personenkontext: Personenkontext<true> = createPersonenkontext(true);
                const event: DeletedPersonenkontextEvent = new DeletedPersonenkontextEvent(personenkontext.id);
                const rolle: Rolle<true> = createMock<Rolle<true>>();
                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                personRepositoryMock.findById.mockResolvedValueOnce(undefined);

                await ldapEventHandler.asyncDeletePersonenkontextEventHandler(event);
                expect(ldapClientServiceMock.deleteLehrer).toHaveBeenCalledTimes(0);
            });
        });
        describe('when organisation is not found', () => {
            it('should execute without errors', async () => {
                const personenkontext: Personenkontext<true> = createPersonenkontext(true);
                const event: DeletedPersonenkontextEvent = new DeletedPersonenkontextEvent(personenkontext.id);
                const rolle: Rolle<true> = createMock<Rolle<true>>();
                const person: Person<true> = createMock<Person<true>>();

                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                organisationRepoMock.findById.mockResolvedValueOnce(undefined);
                await ldapEventHandler.asyncDeletePersonenkontextEventHandler(event);
                expect(ldapClientServiceMock.deleteLehrer).toHaveBeenCalledTimes(0);
            });
        });
        describe('when creation of lehrer in LDAP fails', () => {
            it('should execute without errors', async () => {
                const personenkontext: Personenkontext<true> = createPersonenkontext(true);
                const event: DeletedPersonenkontextEvent = new DeletedPersonenkontextEvent(personenkontext.id);
                const rolle: Rolle<true> = createMock<Rolle<true>>({ rollenart: RollenArt.LEHR });
                const person: Person<true> = createMock<Person<true>>();
                const organisation: Organisation<true> = createMock<Organisation<true>>();

                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                organisationRepoMock.findById.mockResolvedValueOnce(organisation);

                ldapClientServiceMock.deleteLehrer.mockResolvedValueOnce({
                    ok: false,
                    error: new Error(),
                });
                await ldapEventHandler.asyncDeletePersonenkontextEventHandler(event);
                expect(ldapClientServiceMock.deleteLehrer).toHaveBeenCalledTimes(1);
            });
        });
    });
});
