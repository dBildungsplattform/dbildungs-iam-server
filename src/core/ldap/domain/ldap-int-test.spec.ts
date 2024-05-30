import { EntityManager, MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    LdapTestModule,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { LdapConfigModule } from '../ldap-config.module.js';
import { LdapModule } from '../ldap.module.js';
import { faker } from '@faker-js/faker';
import { OrganisationsTyp } from '../../../modules/organisation/domain/organisation.enums.js';
import { LdapClientService } from './ldap-client.service.js';
import { Organisation } from '../../../modules/organisation/domain/organisation.js';
import { Person } from '../../../modules/person/domain/person.js';

/*function nop(): void {

}*/

describe('LDAP Client Service Int Test', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let em: EntityManager;
    let ldapClientService: LdapClientService;
    let module: TestingModule;

    let organisation: Organisation<true>;
    let invalidOrganisation: Organisation<true>;
    let person: Person<true>;
    let ouKennung: string;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                LdapModule,
                MapperTestModule,
            ],
            providers: [
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
        em = module.get(EntityManager);
        ldapClientService = module.get(LdapClientService);

        ouKennung = faker.string.numeric({ length: 7 });
        organisation = Organisation.construct(
            faker.string.uuid(),
            faker.date.past(),
            faker.date.recent(),
            undefined,
            undefined,
            ouKennung,
            faker.company.name(),
            undefined,
            undefined,
            OrganisationsTyp.SCHULE,
            undefined,
        );
        invalidOrganisation = {
            id: faker.string.uuid(),
            name: faker.company.name(),
            kennung: undefined,
            typ: OrganisationsTyp.SCHULE,
            createdAt: faker.date.past(),
            updatedAt: faker.date.recent(),
        };
        person = Person.construct(
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

        //currently only used to wait for the LDAP container, because setupDatabase() is blocking
        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await DatabaseTestModule.clearDatabase(orm);
        await orm.close();
        await app.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(em).toBeDefined();
    });

    describe('createOrganisation', () => {
        it('when called with valid organisation: should return truthy result', async () => {
            const result: Result<Organisation<true>> = await ldapClientService.createOrganisation(organisation);

            expect(result.ok).toBeTruthy();
        });

        it('when called with organisation without kennung: should return error result', async () => {
            const result: Result<Organisation<true>> = await ldapClientService.createOrganisation(invalidOrganisation);

            expect(result.ok).toBeFalsy();
        });

        it('when called with valid person and organisation: should return truthy result', async () => {
            /*let notExists: Option<Error>;
            do {
                 setTimeout(() => nop(), 1000);
                notExists = await ldapClientService.notExistsOrganisation(organisation);
            } while (notExists);*/
            const result: Result<Person<true>> = await ldapClientService.createLehrer(person, organisation);

            expect(result.ok).toBeTruthy();
        });

        it('when called with valid person and an organisation without kennung: should return error result', async () => {
            const result: Result<Person<true>> = await ldapClientService.createLehrer(person, invalidOrganisation);

            expect(result.ok).toBeFalsy();
        });

        //DELETIONS

        it('deleteOrganisation: when called with valid person and organisation: should return truthy result', async () => {
            const result: Result<Person<true>> = await ldapClientService.deleteLehrer(person, organisation);

            expect(result.ok).toBeTruthy();
        });

        it('deleteOrganisation: when called with valid person and an organisation without kennung: should return error result', async () => {
            const result: Result<Person<true>> = await ldapClientService.deleteLehrer(person, invalidOrganisation);

            expect(result.ok).toBeFalsy();
        });

        it('deleteOrganisation: when called with valid organisation: should return truthy result', async () => {
            const result: Result<Organisation<true>> = await ldapClientService.deleteOrganisation(organisation);

            expect(result.ok).toBeTruthy();
        });

        it('deleteOrganisation: when called with organisation without kennung: should return error result', async () => {
            const result: Result<Organisation<true>> = await ldapClientService.deleteOrganisation(invalidOrganisation);

            expect(result.ok).toBeFalsy();
        });
    });
});
