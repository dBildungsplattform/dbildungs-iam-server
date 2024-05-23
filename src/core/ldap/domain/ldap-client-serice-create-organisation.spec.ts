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
import { CreatedOrganisationDto } from '../../../modules/organisation/api/created-organisation.dto.js';
import { faker } from '@faker-js/faker';
import { OrganisationsTyp } from '../../../modules/organisation/domain/organisation.enums.js';
import { LdapClientService } from './ldap-client.service.js';

describe('LDAP Client Service Create Organisation', () => {
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

    beforeEach(() => {
        //jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(em).toBeDefined();
    });

    describe('createOrganisation', () => {
        describe('when called with valid organisation', () => {
            it('should return truthy result', async () => {
                const createdOrganisationDto: CreatedOrganisationDto = {
                    id: id,
                    typ: OrganisationsTyp.SCHULE,
                    kennung: kennung,
                    name: faker.company.name(),
                };
                const result: Result<CreatedOrganisationDto> =
                    await ldapClientService.createOrganisation(createdOrganisationDto);

                expect(result.ok).toBeTruthy();
            });
        });

        describe('when called with organisation without kennung', () => {
            it('should return error result', async () => {
                const createdOrganisationDto: CreatedOrganisationDto = {
                    id: id,
                    typ: OrganisationsTyp.SCHULE,
                    kennung: undefined,
                    name: faker.company.name(),
                };
                const result: Result<CreatedOrganisationDto> =
                    await ldapClientService.createOrganisation(createdOrganisationDto);

                expect(result.ok).toBeFalsy();
            });
        });
    });
});
