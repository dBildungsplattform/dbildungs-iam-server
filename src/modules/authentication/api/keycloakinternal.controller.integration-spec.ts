import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { Test, TestingModule } from '@nestjs/testing';

import { Loaded, LoadedReference, MikroORM, Reference } from '@mikro-orm/core';
import { HttpException } from '@nestjs/common';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { DatabaseTestModule, DoFactory } from '../../../../test/utils/index.js';
import { LoggingTestModule } from '../../../../test/utils/logging-test.module.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { PersonModule } from '../../person/person.module.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import {
    DBiamPersonenkontextRepo,
    ExternalPkData,
    PersonenkontextErweitertVirtualEntityLoaded,
} from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextEntity } from '../../personenkontext/persistence/personenkontext.entity.js';
import { PersonenKontextModule } from '../../personenkontext/personenkontext.module.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { RolleModule } from '../../rolle/rolle.module.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderEntity } from '../../service-provider/repo/service-provider.entity.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { ServiceProviderModule } from '../../service-provider/service-provider.module.js';
import { UserExternaldataWorkflowFactory } from '../domain/user-extenaldata.factory.js';
import { UserExternalDataResponse } from './externaldata/user-externaldata.response.js';
import { KeycloakInternalController } from './keycloakinternal.controller.js';
import { EmailMicroserviceModule } from '../../email-microservice/email-microservice.module.js';
import { EmailResolverService } from '../../email-microservice/domain/email-resolver.service.js';
import { EmailAddressResponse } from '../../../email/modules/core/api/dtos/response/email-address.response.js';
import { Ok } from '../../../shared/util/result.js';
import { ServiceProviderSystem } from '../../service-provider/domain/service-provider.enum.js';
import { EmailAddressStatusEnum } from '../../../email/modules/core/persistence/email-address-status.entity.js';

function createLoadedReference<T extends object>(entity: T): LoadedReference<T> {
    const reference: Reference<T> = createMock<Reference<T>>(Reference);
    reference.unwrap = vi.fn().mockReturnValue(entity);
    const loadedReference: LoadedReference<T> = {
        ...reference,
        isInitialized: () => true,
        get: () => reference.unwrap(),
    } as LoadedReference<T>;

    return loadedReference;
}

describe('KeycloakInternalController', () => {
    let module: TestingModule;
    let keycloakinternalController: KeycloakInternalController;
    let serviceProviderRepo: ServiceProviderRepo;
    let dbiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let personRepoMock: DeepMocked<PersonRepository>;
    let emailResolverServiceMock: DeepMocked<EmailResolverService>;
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
                EmailMicroserviceModule,
            ],
            providers: [KeycloakInternalController, UserExternaldataWorkflowFactory],
        })
            .overrideProvider(PersonRepository)
            .useValue(createMock(PersonRepository))
            .overrideProvider(DBiamPersonenkontextRepo)
            .useValue(createMock(DBiamPersonenkontextRepo))
            .overrideProvider(EmailResolverService)
            .useValue(createMock(EmailResolverService))
            .compile();

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));

        keycloakinternalController = module.get(KeycloakInternalController);
        serviceProviderRepo = module.get(ServiceProviderRepo);
        dbiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        personRepoMock = module.get(PersonRepository);
        emailResolverServiceMock = module.get(EmailResolverService);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    afterAll(async () => {
        await module.get(MikroORM).close();
        await module.close();
    });

    it('should be defined', () => {
        expect(keycloakinternalController).toBeDefined();
    });

    describe('externalData', () => {
        it('should return user external data old way', async () => {
            emailResolverServiceMock.shouldUseEmailMicroservice.mockReturnValue(false);
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
                    serviceProvider: [
                        createMock<ServiceProviderEntity>(ServiceProviderEntity, {
                            vidisAngebotId: faker.string.uuid(),
                        }),
                    ],
                },
                {
                    pkId: faker.string.uuid(),
                    rollenart: RollenArt.LEHR,
                    kennung: faker.lorem.word(),
                    serviceProvider: [
                        createMock<ServiceProviderEntity>(ServiceProviderEntity, {
                            vidisAngebotId: faker.string.uuid(),
                        }),
                    ],
                },
                {
                    pkId: faker.string.uuid(),
                    rollenart: RollenArt.LEHR,
                    kennung: faker.lorem.word(),
                    serviceProvider: [
                        createMock<ServiceProviderEntity>(ServiceProviderEntity, {
                            externalSystem: ServiceProviderSystem.EMAIL,
                            vidisAngebotId: undefined,
                        }),
                    ],
                },
                {
                    pkId: faker.string.uuid(),
                    rollenart: RollenArt.LEHR,
                    kennung: undefined, //To Be Filtered Out
                    serviceProvider: [],
                },
            ];
            const sp: ServiceProvider<true> = await serviceProviderRepo.save(DoFactory.createServiceProvider(false));

            const pk: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
                personId: person.id,
                rolleId: faker.string.uuid(),
                organisationId: faker.string.uuid(),
            });

            let serviceProviderEntity: ServiceProviderEntity = new ServiceProviderEntity();
            serviceProviderEntity = Object.assign(serviceProviderEntity, sp);

            let personenkontextEntity: PersonenkontextEntity = new PersonenkontextEntity();
            personenkontextEntity = Object.assign(personenkontextEntity, pk);

            const spRef: LoadedReference<Loaded<ServiceProviderEntity>> = createLoadedReference(serviceProviderEntity);

            const pkRef: LoadedReference<Loaded<PersonenkontextEntity>> = createLoadedReference(personenkontextEntity);

            const personenKontextErweiterungen: PersonenkontextErweitertVirtualEntityLoaded[] = [
                {
                    personenkontext: pkRef,
                    serviceProvider: spRef,
                },
            ];

            personRepoMock.findByKeycloakUserId.mockResolvedValueOnce(person);
            personRepoMock.findById.mockResolvedValueOnce(person);
            dbiamPersonenkontextRepoMock.findExternalPkData.mockResolvedValueOnce(pkExternalData);
            dbiamPersonenkontextRepoMock.findPKErweiterungen.mockResolvedValueOnce(personenKontextErweiterungen);

            const result: UserExternalDataResponse = await keycloakinternalController.getExternalData({
                sub: keycloakSub,
            });
            expect(result).toBeInstanceOf(UserExternalDataResponse);
            expect(result.ox?.id).toContain(`${person.username}@`);
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
            expect(result.opsh.personenkontexte.length).toEqual(3);
            expect(result.onlineDateiablage.personId).toEqual(person.id);
        });

        it('should omit ox response if user has no email', async () => {
            emailResolverServiceMock.shouldUseEmailMicroservice.mockReturnValue(false);
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

            personRepoMock.findByKeycloakUserId.mockResolvedValueOnce(person);
            personRepoMock.findById.mockResolvedValueOnce(person);
            dbiamPersonenkontextRepoMock.findExternalPkData.mockResolvedValueOnce([]);
            dbiamPersonenkontextRepoMock.findPKErweiterungen.mockResolvedValueOnce([]);

            const result: UserExternalDataResponse = await keycloakinternalController.getExternalData({
                sub: keycloakSub,
            });

            expect(result).toBeInstanceOf(UserExternalDataResponse);
            expect(result.ox).toBeUndefined();
        });

        it('should return user external data new Microservice', async () => {
            emailResolverServiceMock.shouldUseEmailMicroservice.mockReturnValue(true);
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
                    serviceProvider: [
                        createMock<ServiceProviderEntity>(ServiceProviderEntity, {
                            vidisAngebotId: faker.string.uuid(),
                        }),
                    ],
                },
                {
                    pkId: faker.string.uuid(),
                    rollenart: RollenArt.LEHR,
                    kennung: faker.lorem.word(),
                    serviceProvider: [
                        createMock<ServiceProviderEntity>(ServiceProviderEntity, {
                            vidisAngebotId: faker.string.uuid(),
                        }),
                    ],
                },
                {
                    pkId: faker.string.uuid(),
                    rollenart: RollenArt.LEHR,
                    kennung: undefined, //To Be Filtered Out
                    serviceProvider: [],
                },
            ];
            const sp: ServiceProvider<true> = await serviceProviderRepo.save(DoFactory.createServiceProvider(false));

            const pk: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
                personId: person.id,
                rolleId: faker.string.uuid(),
                organisationId: faker.string.uuid(),
            });

            let serviceProviderEntity: ServiceProviderEntity = new ServiceProviderEntity();
            serviceProviderEntity = Object.assign(serviceProviderEntity, sp);

            let personenkontextEntity: PersonenkontextEntity = new PersonenkontextEntity();
            personenkontextEntity = Object.assign(personenkontextEntity, pk);

            const spRef: LoadedReference<Loaded<ServiceProviderEntity>> = createLoadedReference(serviceProviderEntity);

            const pkRef: LoadedReference<Loaded<PersonenkontextEntity>> = createLoadedReference(personenkontextEntity);

            const personenKontextErweiterungen: PersonenkontextErweitertVirtualEntityLoaded[] = [
                {
                    personenkontext: pkRef,
                    serviceProvider: spRef,
                },
            ];

            const emailAddressResponseMock: EmailAddressResponse =
                createMock<EmailAddressResponse>(EmailAddressResponse);
            emailAddressResponseMock.oxLoginId = `${faker.string.uuid()}@${faker.number.int({ min: 1000, max: 9999 })}`;
            emailAddressResponseMock.status = EmailAddressStatusEnum.ACTIVE;
            emailResolverServiceMock.findEmailBySpshPersonAsEmailAddressResponse.mockResolvedValueOnce(
                Ok(emailAddressResponseMock),
            );
            personRepoMock.findByKeycloakUserId.mockResolvedValueOnce(person);
            personRepoMock.findById.mockResolvedValueOnce(person);
            dbiamPersonenkontextRepoMock.findExternalPkData.mockResolvedValueOnce(pkExternalData);
            dbiamPersonenkontextRepoMock.findPKErweiterungen.mockResolvedValueOnce(personenKontextErweiterungen);

            const result: UserExternalDataResponse = await keycloakinternalController.getExternalData({
                sub: keycloakSub,
            });
            expect(result).toBeInstanceOf(UserExternalDataResponse);
            expect(result.ox?.id).toContain(`@`);
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

            personRepoMock.findByKeycloakUserId.mockResolvedValueOnce(DoFactory.createPerson(true));
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
