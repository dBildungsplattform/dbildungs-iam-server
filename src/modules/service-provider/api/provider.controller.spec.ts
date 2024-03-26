import { faker } from '@faker-js/faker/';
import {createMock} from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { LoggingTestModule } from '../../../../test/utils/logging-test.module.js';
import { DatabaseTestModule, MapperTestModule } from '../../../../test/utils/index.js';
import { MikroORM } from '@mikro-orm/core';
import { Person } from '../../person/domain/person.js';
import {ProviderController} from "./provider.controller.js";
import {User} from "../../authentication/types/user.d.js";
import {ServiceProviderResponse} from "./service-provider.response.js";
import {ServiceProviderApiModule} from "../service-provider-api.module.js";
import {ServiceProviderRepo} from "../repo/service-provider.repo.js";
import {PersonPermissionsRepo} from "../../authentication/domain/person-permission.repo.js";
//import {PersonPermissions} from "../../authentication/domain/person-permissions.js";
import {DBiamPersonenkontextRepo} from "../../personenkontext/persistence/dbiam-personenkontext.repo.js";
import {RolleModule} from "../../rolle/rolle.module.js";
import {PersonenKontextModule} from "../../personenkontext/personenkontext.module.js";
import {AuthenticationApiModule} from "../../authentication/authentication-api.module.js";

describe('ProviderController', () => {
    let module: TestingModule;
    let providerController: ProviderController;
    //let serviceProviderRepoMock: DeepMocked<ServiceProviderRepo>;
    //let personPermissionsRepoMock: DeepMocked<PersonPermissionsRepo>;
    //let dbiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                LoggingTestModule,
                MapperTestModule,
                AuthenticationApiModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                ServiceProviderApiModule,
                PersonenKontextModule,
                RolleModule,
            ],
            providers: [
                {
                    provide: ServiceProviderRepo,
                    useValue: createMock<ServiceProviderRepo>(),
                },
                {
                    provide: PersonPermissionsRepo,
                    useValue: createMock<PersonPermissionsRepo>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                ProviderController,
            ],
        }).compile();

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));

        //serviceProviderRepoMock = module.get(ServiceProviderRepo);
        //personPermissionsRepoMock = module.get(PersonPermissionsRepo);
        //dbiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        providerController = module.get(ProviderController);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(providerController).toBeDefined();
    });

    describe('/GET available service provider', () => {
        it('should return available service provider for a specific user', async () => {
            const user: User = createMock<User>({ preferred_username: faker.internet.userName() });
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
            person.geburtsdatum = faker.date.past();

            //const personPermissions: PersonPermissions = new PersonPermissions(dbiamPersonenkontextRepoMock, person);
            //personPermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personPermissions);

            //serviceProviderRepoMock.findById.mockResolvedValue(undefined);
            const result: ServiceProviderResponse[] = await providerController.getAvailableServiceProviders(user);

            expect(result).toBeInstanceOf(ServiceProviderResponse);
        });
    });
});
