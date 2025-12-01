import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { LoggingTestModule } from '../../../../test/utils/logging-test.module.js';
import { EventModule } from '../../../core/eventbus/event.module.js';
import { DomainError } from '../../../shared/error/index.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import {
    DBiamPersonenkontextRepo,
    ExternalPkData,
    PersonenkontextErweitertVirtualEntityLoaded,
} from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { UserExternaldataWorkflowAggregate } from './user-extenaldata.workflow.js';
import { RequiredExternalPkData } from '../api/keycloakinternal.controller.js';
import { ServiceProviderEntity } from '../../service-provider/repo/service-provider.entity.js';

describe('UserExternaldataWorkflow', () => {
    let module: TestingModule;
    let sut: UserExternaldataWorkflowAggregate;
    let dBiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let personRepositoryMock: DeepMocked<PersonRepository>;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule, EventModule, ConfigTestModule],
            providers: [
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
            ],
        }).compile();
        dBiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        personRepositoryMock = module.get(PersonRepository);
        sut = UserExternaldataWorkflowAggregate.createNew(
            dBiamPersonenkontextRepoMock,
            personRepositoryMock,
            createMock<ConfigService>(),
        );
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
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
            dBiamPersonenkontextRepoMock.findExternalPkData.mockResolvedValue(createMock<ExternalPkData[]>());
            dBiamPersonenkontextRepoMock.findPKErweiterungen.mockResolvedValue(
                createMock<PersonenkontextErweitertVirtualEntityLoaded[]>(),
            );

            await sut.initialize(person.id);
            expect(sut.person).toBeDefined();
            expect(sut.checkedExternalPkData).toBeDefined();
        });

        it('should return entity Not found error when person not found', async () => {
            personRepositoryMock.findById.mockResolvedValue(undefined);
            dBiamPersonenkontextRepoMock.findExternalPkData.mockResolvedValue(createMock<ExternalPkData[]>());
            dBiamPersonenkontextRepoMock.findPKErweiterungen.mockResolvedValue(
                createMock<PersonenkontextErweitertVirtualEntityLoaded[]>(),
            );

            const response: void | DomainError = await sut.initialize(faker.string.uuid());
            expect(response).toBeInstanceOf(DomainError);
        });
    });

    describe('mergeServiceProviders', () => {
        it('should merge service providers for matching pkId', () => {
            const externalPkData: DeepMocked<RequiredExternalPkData>[] = [
                createMock<RequiredExternalPkData>({
                    pkId: 'pk1',
                    serviceProvider: [{ id: 'sp1', name: 'Provider 1' }],
                }),
            ];

            const personenKontextErweiterungen: DeepMocked<PersonenkontextErweitertVirtualEntityLoaded>[] = [
                createMock<PersonenkontextErweitertVirtualEntityLoaded>({
                    personenkontext: { unwrap: () => ({ id: 'pk1' }) },
                    serviceProvider: { unwrap: () => ({ id: 'sp2', name: 'Provider 2' }) },
                }),
            ];

            const result: RequiredExternalPkData[] = UserExternaldataWorkflowAggregate.mergeServiceProviders(
                externalPkData,
                personenKontextErweiterungen,
            );

            expect(result[0]!.serviceProvider).toEqual(
                expect.arrayContaining([
                    { id: 'sp1', name: 'Provider 1' },
                    { id: 'sp2', name: 'Provider 2' },
                ]),
            );
        });

        it('should not add duplicates when merging', () => {
            const externalPkData: DeepMocked<RequiredExternalPkData>[] = [
                createMock<RequiredExternalPkData>({
                    pkId: 'pk1',
                    serviceProvider: [{ id: 'sp1', name: 'Provider 1' }],
                }),
            ];

            const personenKontextErweiterungen: DeepMocked<PersonenkontextErweitertVirtualEntityLoaded>[] = [
                createMock<PersonenkontextErweitertVirtualEntityLoaded>({
                    personenkontext: { unwrap: () => ({ id: 'pk1' }) },
                    serviceProvider: { unwrap: () => ({ id: 'sp1', name: 'Provider 1' }) },
                }),
            ];

            const result: RequiredExternalPkData[] = UserExternaldataWorkflowAggregate.mergeServiceProviders(
                externalPkData,
                personenKontextErweiterungen,
            );

            expect(result[0]!.serviceProvider).toHaveLength(1);
        });

        it('should handle empty personenKontextErweiterungen', () => {
            const externalPkData: DeepMocked<RequiredExternalPkData>[] = [
                createMock<RequiredExternalPkData>({
                    pkId: 'pk1',
                    serviceProvider: [{ id: 'sp1', name: 'Provider 1' }],
                }),
            ];

            const result: RequiredExternalPkData[] = UserExternaldataWorkflowAggregate.mergeServiceProviders(
                externalPkData,
                [],
            );

            expect(result).toHaveLength(1);
            expect(result[0]!.pkId).toBe('pk1');
            expect(result[0]!.serviceProvider).toEqual([{ id: 'sp1', name: 'Provider 1' }]);
        });

        it('should handle empty externalPkData', () => {
            const result: RequiredExternalPkData[] = UserExternaldataWorkflowAggregate.mergeServiceProviders(
                [],
                [
                    createMock<PersonenkontextErweitertVirtualEntityLoaded>({
                        personenkontext: { unwrap: () => ({ id: 'pk1' }) },
                        serviceProvider: { unwrap: () => ({ id: 'sp2', name: 'Provider 2' }) },
                    }),
                ],
            );

            expect(result).toEqual([]);
        });

        it('should merge multiple service providers for same pkId', () => {
            const externalPkData: DeepMocked<RequiredExternalPkData>[] = [
                createMock<RequiredExternalPkData>({
                    pkId: 'pk1',
                    serviceProvider: [{ id: 'sp1', name: 'Provider 1' }],
                }),
            ];

            const personenKontextErweiterungen: DeepMocked<PersonenkontextErweitertVirtualEntityLoaded>[] = [
                createMock<PersonenkontextErweitertVirtualEntityLoaded>({
                    personenkontext: { unwrap: () => ({ id: 'pk1' }) },
                    serviceProvider: { unwrap: () => ({ id: 'sp2', name: 'Provider 2' }) },
                }),
                createMock<PersonenkontextErweitertVirtualEntityLoaded>({
                    personenkontext: { unwrap: () => ({ id: 'pk1' }) },
                    serviceProvider: { unwrap: () => ({ id: 'sp3', name: 'Provider 3' }) },
                }),
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
                createMock<RequiredExternalPkData>({
                    pkId: 'pk1',
                    serviceProvider: [{ id: 'sp1', name: 'Provider 1', vidisAngebotId: 'vidis-123' }],
                }),
                createMock<RequiredExternalPkData>({
                    pkId: 'pk2',
                    serviceProvider: [{ id: 'sp2', name: 'Provider 2', vidisAngebotId: undefined }],
                }),
            ];

            const result: RequiredExternalPkData[] =
                UserExternaldataWorkflowAggregate.getExternalPkDataWithSpWithVidisAngebotId(externalPkData);

            expect(result).toHaveLength(1);
            expect(result[0]!.pkId).toBe('pk1');
        });

        it('should return empty array if no serviceProvider has vidisAngebotId', () => {
            const externalPkData: RequiredExternalPkData[] = [
                createMock<RequiredExternalPkData>({
                    pkId: 'pk1',
                    serviceProvider: [{ id: 'sp1', name: 'Provider 1', vidisAngebotId: undefined }],
                }),
                createMock<RequiredExternalPkData>({
                    pkId: 'pk2',
                    serviceProvider: [{ id: 'sp2', name: 'Provider 2', vidisAngebotId: undefined }],
                }),
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
                createMock<RequiredExternalPkData>({
                    pkId: 'pk1',
                    serviceProvider: [
                        { id: 'sp1', name: 'Provider 1', vidisAngebotId: undefined },
                        { id: 'sp2', name: 'Provider 2', vidisAngebotId: 'vidis-456' },
                    ],
                }),
            ];

            const result: RequiredExternalPkData[] =
                UserExternaldataWorkflowAggregate.getExternalPkDataWithSpWithVidisAngebotId(externalPkData);

            expect(result).toHaveLength(1);
            expect(result[0]!.pkId).toBe('pk1');
        });

        it('should ignore falsy values like empty string for vidisAngebotId', () => {
            const externalPkData: RequiredExternalPkData[] = [
                createMock<RequiredExternalPkData>({
                    pkId: 'pk1',
                    serviceProvider: [{ id: 'sp1', name: 'Provider 1', vidisAngebotId: '' }],
                }),
            ];

            const result: RequiredExternalPkData[] =
                UserExternaldataWorkflowAggregate.getExternalPkDataWithSpWithVidisAngebotId(externalPkData);

            expect(result).toEqual([]);
        });
    });
});
