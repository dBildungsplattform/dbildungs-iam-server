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
import { CreatedOrganisationDto } from '../../../modules/organisation/api/created-organisation.dto.js';
import { faker } from '@faker-js/faker';
import { OrganisationsTyp } from '../../../modules/organisation/domain/organisation.enums.js';
import { LdapClientService } from './ldap-client.service.js';
import {Person} from "../../../modules/person/domain/person.js";
import {Organisation} from "../../../modules/organisation/domain/organisation.js";

describe('LDAP Client Service Config Failure', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let em: EntityManager;
    let ldapClientService: LdapClientService;
    const kennung: string = faker.string.numeric({ length: 7 });
    const id: string = faker.string.uuid();

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

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(em).toBeDefined();
    });

    describe('getClient', () => {
        describe('when called by createOrganisation and errors during LDAP connection occurred', () => {
            it('should return error result', async () => {
                const createdOrganisationDto: CreatedOrganisationDto = {
                    id: id,
                    typ: OrganisationsTyp.SCHULE,
                    kennung: kennung,
                    name: faker.company.name(),
                };
                const result: Result<CreatedOrganisationDto> =
                    await ldapClientService.createOrganisation(createdOrganisationDto);

                expect(result.ok).toBeFalsy();
            });
        });

        describe('when called by createLehrer with valid person and organisation', () => {
            it('should return error result', async () => {
                const person: Person<true> = Person.construct(
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

                const organisation: Organisation<true> = {
                    id: id,
                    name: faker.company.name(),
                    kennung: kennung,
                    typ: OrganisationsTyp.SCHULE,
                    createdAt: faker.date.past(),
                    updatedAt: faker.date.recent(),
                };

                const result: Result<Person<true>> = await ldapClientService.createLehrer(person, organisation);

                expect(result.ok).toBeFalsy();
            });
        });
    });
});
