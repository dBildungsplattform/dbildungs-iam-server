import { faker } from '@faker-js/faker/';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { Loaded, LoadedReference, MikroORM } from '@mikro-orm/core';
import { HttpException } from '@nestjs/common';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { DatabaseTestModule } from '../../../../test/utils/index.js';
import { LoggingTestModule } from '../../../../test/utils/logging-test.module.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { PersonModule } from '../../person/person.module.js';
import {
    DBiamPersonenkontextRepo,
    ExternalPkData,
} from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextEntity } from '../../personenkontext/persistence/personenkontext.entity.js';
import { PersonenKontextModule } from '../../personenkontext/personenkontext.module.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import {
    PersonenkontextErweitertVirtualEntityLoaded,
    RollenerweiterungRepo,
} from '../../rolle/repo/rollenerweiterung.repo.js';
import { RolleModule } from '../../rolle/rolle.module.js';
import { ServiceProviderEntity } from '../../service-provider/repo/service-provider.entity.js';
import { ServiceProviderModule } from '../../service-provider/service-provider.module.js';
import { UserExternaldataWorkflowFactory } from '../domain/user-extenaldata.factory.js';
import { UserExeternalDataResponse } from './externaldata/user-externaldata.response.js';
import { KeycloakInternalController } from './keycloakinternal.controller.js';

describe('KeycloakInternalController', () => {
    let module: TestingModule;
    let keycloakinternalController: KeycloakInternalController;
    let dbiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let rollenerweiterungRepoMock: DeepMocked<RollenerweiterungRepo>;
    let personRepoMock: DeepMocked<PersonRepository>;
    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                LoggingTestModule,
                ServiceProviderModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                PersonModule,
                PersonenKontextModule,
                RolleModule,
            ],
            providers: [KeycloakInternalController, UserExternaldataWorkflowFactory],
        })
            .overrideProvider(PersonRepository)
            .useValue(createMock<PersonRepository>())
            .overrideProvider(DBiamPersonenkontextRepo)
            .useValue(createMock<DBiamPersonenkontextRepo>())
            .overrideProvider(RollenerweiterungRepo)
            .useValue(createMock<RollenerweiterungRepo>())
            .compile();

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));

        keycloakinternalController = module.get(KeycloakInternalController);
        dbiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        rollenerweiterungRepoMock = module.get(RollenerweiterungRepo);
        personRepoMock = module.get(PersonRepository);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    afterAll(async () => {
        await module.get(MikroORM).close();
        await module.close();
    });

    it('should be defined', () => {
        expect(keycloakinternalController).toBeDefined();
    });

    describe('externalData', () => {
        it('should return user external data', async () => {
            const keycloakSub: string = faker.string.uuid();
            const person: Person<true> = Person.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.person.lastName(),
                faker.person.firstName(),
                '1',
                faker.lorem.word(),
                keycloakSub,
                faker.string.uuid(),
            );

            const pkExternalData: ExternalPkData[] = [
                {
                    pkId: faker.string.uuid(),
                    rollenart: RollenArt.LEHR,
                    kennung: faker.lorem.word(),
                    serviceProvider: [createMock<ServiceProviderEntity>({ vidisAngebotId: faker.string.uuid() })],
                },
                {
                    pkId: faker.string.uuid(),
                    rollenart: RollenArt.LEHR,
                    kennung: faker.lorem.word(),
                    serviceProvider: [createMock<ServiceProviderEntity>({ vidisAngebotId: faker.string.uuid() })],
                },
                {
                    pkId: faker.string.uuid(),
                    rollenart: RollenArt.LEHR,
                    kennung: undefined, //To Be Filtered Out
                    serviceProvider: [],
                },
            ];
            const spEntity: DeepMocked<ServiceProviderEntity> = createMock<ServiceProviderEntity>({
                name: 'Erweiterung SP 1',
                vidisAngebotId: faker.string.uuid(),
            });
            const spRef: DeepMocked<LoadedReference<Loaded<ServiceProviderEntity>>> = createMock<
                LoadedReference<Loaded<ServiceProviderEntity>>
            >({
                get: jest.fn().mockReturnValue(spEntity),
                load: jest.fn().mockResolvedValue(spEntity),
            });
            const pkEntityMock: DeepMocked<PersonenkontextEntity> = createMock<PersonenkontextEntity>();
            const pkRef: DeepMocked<LoadedReference<Loaded<PersonenkontextEntity>>> = createMock<
                LoadedReference<Loaded<PersonenkontextEntity>>
            >({
                get: jest.fn().mockReturnValue(pkEntityMock),
                load: jest.fn().mockResolvedValue(pkEntityMock),
            });

            const personenKontextErweiterungen: PersonenkontextErweitertVirtualEntityLoaded[] = [
                {
                    personenkontext: pkRef,
                    serviceProvider: spRef,
                },
            ];

            personRepoMock.findByKeycloakUserId.mockResolvedValueOnce(person);
            personRepoMock.findById.mockResolvedValueOnce(person);
            dbiamPersonenkontextRepoMock.findExternalPkData.mockResolvedValueOnce(pkExternalData);
            rollenerweiterungRepoMock.findPKErweiterungen.mockResolvedValueOnce(personenKontextErweiterungen);

            const result: UserExeternalDataResponse = await keycloakinternalController.getExternalData({
                sub: keycloakSub,
            });
            expect(result).toBeInstanceOf(UserExeternalDataResponse);
            expect(result.ox.id).toContain(`${person.username}@`);
            expect(result.itslearning.personId).toEqual(person.id);
            expect(result.vidis.personId).toEqual(person.id);
            expect(result.vidis.vorname).toEqual(person.vorname);
            expect(result.vidis.nachname).toEqual(person.familienname);
            expect(result.vidis.emailAdresse).toEqual(person.email);
            expect(result.vidis.rollenart).toEqual(pkExternalData[0]?.rollenart);
            expect(result.vidis.dienststellenNummern.length).toEqual(2);
            expect(result.opsh.vorname).toEqual(person.vorname);
            expect(result.opsh.nachname).toEqual(person.familienname);
            expect(result.opsh.emailAdresse).toEqual(person.email);
            expect(result.opsh.personenkontexte.length).toEqual(2);
            expect(result.onlineDateiablage.personId).toEqual(person.id);
        });

        it('should throw error if aggregate doesnt initialize fields field correctly', async () => {
            const keycloakSub: string = faker.string.uuid();
            const pkExternalData: ExternalPkData[] = [
                {
                    pkId: faker.string.uuid(),
                    rollenart: RollenArt.LEHR,
                    kennung: faker.lorem.word(),
                },
                {
                    pkId: faker.string.uuid(),
                    rollenart: RollenArt.LERN,
                    kennung: faker.lorem.word(),
                },
            ];

            personRepoMock.findByKeycloakUserId.mockResolvedValueOnce(createMock<Person<true>>());
            personRepoMock.findById.mockResolvedValueOnce(undefined);
            dbiamPersonenkontextRepoMock.findExternalPkData.mockResolvedValueOnce(pkExternalData);

            await expect(keycloakinternalController.getExternalData({ sub: keycloakSub })).rejects.toThrow(
                HttpException,
            );
        });

        it('should throw error if aggregate doesnt initialize fields field correctly', async () => {
            const keycloakSub: string = faker.string.uuid();
            personRepoMock.findByKeycloakUserId.mockResolvedValueOnce(undefined);

            await expect(keycloakinternalController.getExternalData({ sub: keycloakSub })).rejects.toThrow(
                HttpException,
            );
        });
    });
});
