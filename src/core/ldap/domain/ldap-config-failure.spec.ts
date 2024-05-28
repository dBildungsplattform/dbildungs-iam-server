import { EntityManager, MikroORM } from '@mikro-orm/core';
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
import { OrganisationApiModule } from '../../../modules/organisation/organisation-api.module.js';
import { LdapModule } from '../ldap.module.js';
import { PersonenKontextApiModule } from '../../../modules/personenkontext/personenkontext-api.module.js';
import { LdapClientService } from './ldap-client.service.js';
import { Person } from '../../../modules/person/domain/person.js';
import { Organisation } from '../../../modules/organisation/domain/organisation.js';
import { createMock } from '@golevelup/ts-jest';

describe('LDAP Client Service Config Failure', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let em: EntityManager;
    let ldapClientService: LdapClientService;

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
            // This config is explicitly not done, to get failures during client connection!
            // .overrideModule(LdapConfigModule)
            // .useModule(LdapTestModule.forRoot({ isLdapRequired: true }))
            .compile();

        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        ldapClientService = module.get(LdapClientService);

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await DatabaseTestModule.clearDatabase(orm);
        await orm.close();
        await app.close();
    });

    it('should be defined', () => {
        expect(em).toBeDefined();
    });

    describe('getClient', () => {
        describe('when called by createOrganisation and errors during LDAP connection occurred', () => {
            it('should return error result', async () => {
                const organisation: Organisation<true> = createMock<Organisation<true>>();
                const result: Result<Organisation<true>> = await ldapClientService.createOrganisation(organisation);

                expect(result.ok).toBeFalsy();
            });
        });

        describe('when called by deleteOrganisation and errors during LDAP connection occurred', () => {
            it('should return error result', async () => {
                const organisation: Organisation<true> = createMock<Organisation<true>>();
                const result: Result<Organisation<true>> = await ldapClientService.deleteOrganisation(organisation);

                expect(result.ok).toBeFalsy();
            });
        });

        describe('when called by createLehrer with valid person and organisation', () => {
            it('should return error result', async () => {
                const person: Person<true> = createMock<Person<true>>();
                const organisation: Organisation<true> = createMock<Organisation<true>>();

                const result: Result<Person<true>> = await ldapClientService.createLehrer(person, organisation);

                expect(result.ok).toBeFalsy();
            });
        });

        describe('when called by deleteLehrer with valid person and organisation', () => {
            it('should return error result', async () => {
                const person: Person<true> = createMock<Person<true>>();
                const organisation: Organisation<true> = createMock<Organisation<true>>();

                const result: Result<Person<true>> = await ldapClientService.deleteLehrer(person, organisation);

                expect(result.ok).toBeFalsy();
            });
        });
    });
});
