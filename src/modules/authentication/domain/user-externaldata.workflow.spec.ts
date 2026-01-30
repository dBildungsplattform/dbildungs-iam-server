import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { LoggingTestModule } from '../../../../test/utils/logging-test.module.js';
import { EventModule } from '../../../core/eventbus/event.module.js';
import { EmailAddressResponse } from '../../../email/modules/core/api/dtos/response/email-address.response.js';
import { DomainError } from '../../../shared/error/index.js';
import { EmailResolverService } from '../../email-microservice/domain/email-resolver.service.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import {
    DBiamPersonenkontextRepo,
    PersonenkontextErweitertVirtualEntityLoaded,
} from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { UserExternaldataWorkflowAggregate } from './user-extenaldata.workflow.js';
import { RequiredExternalPkData } from '../api/keycloakinternal.controller.js';
import { ServiceProviderEntity } from '../../service-provider/repo/service-provider.entity.js';
import { EmailAddressNotFoundError } from '../../email/error/email-address-not-found.error.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { PersonenkontextEntity } from '../../personenkontext/persistence/personenkontext.entity.js';
import { LoadedReference, Reference } from '@mikro-orm/core';
import { Err, Ok } from '../../../shared/util/result.js';
import { EmailAddressStatusEnum } from '../../../email/modules/core/persistence/email-address-status.entity.js';
import { EmailAddress } from '../../../email/modules/core/domain/email-address.js';

function createLoadedServiceProviderReferences(id?: string, name?: string): LoadedReference<ServiceProviderEntity> {
    const serviceProviderReference: Reference<ServiceProviderEntity> =
        createMock<Reference<ServiceProviderEntity>>(Reference);
    serviceProviderReference.unwrap = vi.fn().mockReturnValue(
        createMock<ServiceProviderEntity>(ServiceProviderEntity, {
            id: id ?? faker.string.uuid(),
            name: name ?? faker.company.name(),
        }),
    );
    const loadedServiceProvider: LoadedReference<ServiceProviderEntity> = {
        ...serviceProviderReference,
        isInitialized: () => true,
        get: () => serviceProviderReference.unwrap(),
    } as LoadedReference<ServiceProviderEntity>;

    return loadedServiceProvider;
}

function createLoadedPersonenkontextReference(id?: string): LoadedReference<PersonenkontextEntity> {
    const personenKontextReference: Reference<PersonenkontextEntity> =
        createMock<Reference<PersonenkontextEntity>>(Reference);
    personenKontextReference.unwrap = vi
        .fn()
        .mockReturnValue(createMock<PersonenkontextEntity>(PersonenkontextEntity, { id: id ?? faker.string.uuid() }));
    const loadedPersonenKontext: LoadedReference<PersonenkontextEntity> = {
        ...personenKontextReference,
        isInitialized: () => true,
        get: () => personenKontextReference.unwrap(),
    } as LoadedReference<PersonenkontextEntity>;

    return loadedPersonenKontext;
}

describe('UserExternaldataWorkflow', () => {
    let sut: UserExternaldataWorkflowAggregate;
    let dBiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let emailResolverServiceMock: DeepMocked<EmailResolverService>;
    let configServiceMock: DeepMocked<ConfigService>;

    beforeEach(() => {
        configServiceMock = createMock<ConfigService>(ConfigService);
        configServiceMock.getOrThrow.mockReturnValue({});

        dBiamPersonenkontextRepoMock = createMock<DBiamPersonenkontextRepo>(DBiamPersonenkontextRepo);
        personRepositoryMock = createMock<PersonRepository>(PersonRepository);
        emailResolverServiceMock = createMock<EmailResolverService>(EmailResolverService);
        sut = UserExternaldataWorkflowAggregate.createNew(
            dBiamPersonenkontextRepoMock,
            personRepositoryMock,
            configServiceMock,
            emailResolverServiceMock,
        );
    });

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('initialize', () => {
        it('should initialize aggregate', async () => {
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

            personRepositoryMock.findById.mockResolvedValue(person);
            dBiamPersonenkontextRepoMock.findExternalPkData.mockResolvedValue([]);
            dBiamPersonenkontextRepoMock.findPKErweiterungen.mockResolvedValue([]);
            emailResolverServiceMock.shouldUseEmailMicroservice.mockReturnValue(false);

            await sut.initialize(person.id);
            expect(sut.person).toBeDefined();
            expect(sut.checkedExternalPkData).toBeDefined();
        });

        it('should initialize aggregate with contextID', async () => {
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
            const oxLoginId: string = faker.string.uuid();
            const oxContextId: string = 'test-context-id';

            personRepositoryMock.findById.mockResolvedValue(person);
            dBiamPersonenkontextRepoMock.findExternalPkData.mockResolvedValue([]);
            dBiamPersonenkontextRepoMock.findPKErweiterungen.mockResolvedValue([]);
            emailResolverServiceMock.shouldUseEmailMicroservice.mockReturnValue(true);
            const emailAddress: EmailAddress<true> = EmailAddress.construct({
                id: faker.string.uuid(),
                createdAt: faker.date.past(),
                updatedAt: faker.date.recent(),
                address: faker.internet.email(),
                priority: 0,
                spshPersonId: person.id,
                oxUserCounter: undefined,
                externalId: oxLoginId,
                sortedStatuses: [{ status: EmailAddressStatusEnum.ACTIVE }],
            });

            const response: EmailAddressResponse = new EmailAddressResponse(
                emailAddress,
                EmailAddressStatusEnum.ACTIVE,
                oxContextId,
            );
            emailResolverServiceMock.findEmailBySpshPersonAsEmailAddressResponse.mockResolvedValue(Ok(response));

            await sut.initialize(person.id);
            expect(sut.person).toBeDefined();
            expect(sut.checkedExternalPkData).toBeDefined();
            expect(sut.oxLoginId).toBe(`${oxLoginId}@${oxContextId}`);
        });

        it('should return entity Not found error when person not found', async () => {
            personRepositoryMock.findById.mockResolvedValue(undefined);
            dBiamPersonenkontextRepoMock.findExternalPkData.mockResolvedValue([]);
            dBiamPersonenkontextRepoMock.findPKErweiterungen.mockResolvedValue([]);

            const response: Option<DomainError> = await sut.initialize(faker.string.uuid());
            expect(response).toBeInstanceOf(DomainError);
        });

        it('should return Error from email microservice', async () => {
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
            const error: EmailAddressNotFoundError = new EmailAddressNotFoundError();

            personRepositoryMock.findById.mockResolvedValue(person);
            dBiamPersonenkontextRepoMock.findExternalPkData.mockResolvedValue([]);
            emailResolverServiceMock.shouldUseEmailMicroservice.mockReturnValue(true);
            emailResolverServiceMock.findEmailBySpshPersonAsEmailAddressResponse.mockResolvedValue(Err(error));

            const response: Option<DomainError> = await sut.initialize(person.id);

            expect(response).toBe(error);
        });
    });

    describe('mergeServiceProviders', () => {
        it('should merge service providers for matching pkId', () => {
            const externalPkData: RequiredExternalPkData[] = [
                {
                    pkId: 'pk1',
                    serviceProvider: [{ id: 'sp1', name: 'Provider 1' } as ServiceProviderEntity],
                    rollenart: RollenArt.LEHR,
                    kennung: 'kennung1',
                },
            ];

            const personenkontextErweitertVirtualEntityLoaded: PersonenkontextErweitertVirtualEntityLoaded = {
                personenkontext: createLoadedPersonenkontextReference('pk1'),
                serviceProvider: createLoadedServiceProviderReferences('sp2', 'Provider 2'),
            };

            const result: RequiredExternalPkData[] = UserExternaldataWorkflowAggregate.mergeServiceProviders(
                externalPkData,
                [personenkontextErweitertVirtualEntityLoaded],
            );

            expect(result[0]!.serviceProvider).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ id: 'sp1', name: 'Provider 1' }),
                    expect.objectContaining({ id: 'sp2', name: 'Provider 2' }),
                ]),
            );
        });

        it('should not add duplicates when merging', () => {
            const externalPkData: RequiredExternalPkData[] = [
                {
                    pkId: 'pk1',
                    rollenart: RollenArt.LEHR,
                    kennung: faker.string.alpha(),
                    serviceProvider: [
                        createMock<ServiceProviderEntity>(ServiceProviderEntity, {
                            id: 'sp1',
                            name: 'Provider 1',
                        }),
                    ],
                },
            ];

            const personenKontextErweiterungen: PersonenkontextErweitertVirtualEntityLoaded[] = [
                {
                    personenkontext: createLoadedPersonenkontextReference('pk1'),
                    serviceProvider: createLoadedServiceProviderReferences('sp1', 'Provider 1'),
                },
            ];

            const result: RequiredExternalPkData[] = UserExternaldataWorkflowAggregate.mergeServiceProviders(
                externalPkData,
                personenKontextErweiterungen,
            );

            expect(result[0]!.serviceProvider).toHaveLength(1);
        });

        it('should handle empty personenKontextErweiterungen', () => {
            const externalPkData: RequiredExternalPkData[] = [
                {
                    pkId: 'pk1',
                    serviceProvider: [
                        createMock<ServiceProviderEntity>(ServiceProviderEntity, { id: 'sp1', name: 'Provider 1' }),
                    ],
                    rollenart: RollenArt.LEHR,
                    kennung: faker.string.alpha(),
                },
            ];

            const result: RequiredExternalPkData[] = UserExternaldataWorkflowAggregate.mergeServiceProviders(
                externalPkData,
                [],
            );

            expect(result).toHaveLength(1);
            expect(result[0]!.pkId).toBe('pk1');
            expect(result[0]!.serviceProvider).toEqual(
                expect.arrayContaining([expect.objectContaining({ id: 'sp1', name: 'Provider 1' })]),
            );
        });

        it('should handle empty externalPkData', () => {
            const personenKontextErweiterungen: PersonenkontextErweitertVirtualEntityLoaded[] = [
                {
                    personenkontext: createLoadedPersonenkontextReference('pk1'),
                    serviceProvider: createLoadedServiceProviderReferences('sp1', 'Provider 1'),
                },
            ];
            const result: RequiredExternalPkData[] = UserExternaldataWorkflowAggregate.mergeServiceProviders(
                [],
                personenKontextErweiterungen,
            );

            expect(result).toEqual([]);
        });

        it('should merge multiple service providers for same pkId', () => {
            const externalPkData: RequiredExternalPkData[] = [
                {
                    pkId: 'pk1',
                    serviceProvider: [
                        createMock<ServiceProviderEntity>(ServiceProviderEntity, { id: 'sp1', name: 'Provider 1' }),
                    ],
                    rollenart: RollenArt.LEHR,
                    kennung: faker.string.alpha(),
                },
            ];

            const personenKontextErweiterungen: PersonenkontextErweitertVirtualEntityLoaded[] = [
                {
                    personenkontext: createLoadedPersonenkontextReference('pk1'),
                    serviceProvider: createLoadedServiceProviderReferences('sp2', 'Provider 2'),
                },
                {
                    personenkontext: createLoadedPersonenkontextReference('pk1'),
                    serviceProvider: createLoadedServiceProviderReferences('sp3', 'Provider 3'),
                },
            ];

            const result: RequiredExternalPkData[] = UserExternaldataWorkflowAggregate.mergeServiceProviders(
                externalPkData,
                personenKontextErweiterungen,
            );

            expect(result[0]!.serviceProvider).toHaveLength(3);
            expect(result[0]!.serviceProvider.map((sp: ServiceProviderEntity) => sp.id)).toEqual(['sp1', 'sp2', 'sp3']);
        });
    });

    describe('getExternalPkDataWithSpWithVidisAngebotId', () => {
        it('should return pkData where at least one serviceProvider has vidisAngebotId', () => {
            const externalPkData: RequiredExternalPkData[] = [
                {
                    pkId: 'pk1',
                    serviceProvider: [
                        createMock<ServiceProviderEntity>(ServiceProviderEntity, {
                            id: 'sp1',
                            name: 'Provider 1',
                            vidisAngebotId: 'vidis-123',
                        }),
                    ],
                    rollenart: RollenArt.LEHR,
                    kennung: faker.string.alpha(),
                },
                {
                    pkId: 'pk1',
                    serviceProvider: [
                        createMock<ServiceProviderEntity>(ServiceProviderEntity, {
                            id: 'sp2',
                            name: 'Provider 2',
                        }),
                    ],
                    rollenart: RollenArt.LEHR,
                    kennung: faker.string.alpha(),
                },
            ];

            const result: RequiredExternalPkData[] =
                UserExternaldataWorkflowAggregate.getExternalPkDataWithSpWithVidisAngebotId(externalPkData);

            expect(result).toHaveLength(1);
            expect(result[0]!.pkId).toBe('pk1');
        });

        it('should return empty array if no serviceProvider has vidisAngebotId', () => {
            const externalPkData: RequiredExternalPkData[] = [
                {
                    pkId: 'pk1',
                    serviceProvider: [
                        createMock<ServiceProviderEntity>(ServiceProviderEntity, {
                            id: 'sp1',
                            name: 'Provider 1',
                            vidisAngebotId: undefined,
                        }),
                    ],
                    rollenart: RollenArt.LEHR,
                    kennung: faker.string.alpha(),
                },
                {
                    pkId: 'pk2',
                    serviceProvider: [
                        createMock<ServiceProviderEntity>(ServiceProviderEntity, {
                            id: 'sp2',
                            name: 'Provider 2',
                            vidisAngebotId: undefined,
                        }),
                    ],
                    rollenart: RollenArt.LEHR,
                    kennung: faker.string.alpha(),
                },
            ];

            const result: RequiredExternalPkData[] =
                UserExternaldataWorkflowAggregate.getExternalPkDataWithSpWithVidisAngebotId(externalPkData);

            expect(result).toEqual([]);
        });

        it('should handle empty externalPkData array', () => {
            const result: RequiredExternalPkData[] =
                UserExternaldataWorkflowAggregate.getExternalPkDataWithSpWithVidisAngebotId([]);
            expect(result).toEqual([]);
        });

        it('should include pkData if multiple serviceProviders and one has vidisAngebotId', () => {
            const externalPkData: RequiredExternalPkData[] = [
                {
                    pkId: 'pk1',
                    serviceProvider: [
                        createMock<ServiceProviderEntity>(ServiceProviderEntity, {
                            id: 'sp1',
                            name: 'Provider 1',
                            vidisAngebotId: undefined,
                        }),
                        createMock<ServiceProviderEntity>(ServiceProviderEntity, {
                            id: 'sp2',
                            name: 'Provider 2',
                            vidisAngebotId: 'vidis-456',
                        }),
                    ],
                    rollenart: RollenArt.LEHR,
                    kennung: faker.string.alpha(),
                },
            ];

            const result: RequiredExternalPkData[] =
                UserExternaldataWorkflowAggregate.getExternalPkDataWithSpWithVidisAngebotId(externalPkData);

            expect(result).toHaveLength(1);
            expect(result[0]!.pkId).toBe('pk1');
        });

        it('should ignore falsy values like empty string for vidisAngebotId', () => {
            const externalPkData: RequiredExternalPkData[] = [
                {
                    pkId: 'pk1',
                    serviceProvider: [
                        createMock<ServiceProviderEntity>(ServiceProviderEntity, {
                            id: 'sp1',
                            name: 'Provider 1',
                            vidisAngebotId: '',
                        }),
                    ],
                    rollenart: RollenArt.LEHR,
                    kennung: faker.string.alpha(),
                },
            ];

            const result: RequiredExternalPkData[] =
                UserExternaldataWorkflowAggregate.getExternalPkDataWithSpWithVidisAngebotId(externalPkData);

            expect(result).toEqual([]);
        });
    });
});
