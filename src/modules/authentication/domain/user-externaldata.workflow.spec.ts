import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LoggingTestModule } from '../../../../test/utils/logging-test.module.js';
import { EventModule } from '../../../core/eventbus/event.module.js';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import {
    DBiamPersonenkontextRepo,
    ExternalPkData,
} from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { UserExternaldataWorkflowAggregate } from './user-extenaldata.workflow.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import { Person } from '../../person/domain/person.js';
import { DomainError } from '../../../shared/error/index.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
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

            await sut.initialize(person.id);
            expect(sut.person).toBeDefined();
            expect(sut.checkedExternalPkData).toBeDefined();
        });

        it('should not initialize aggregate when serviceProvider has no vidisAngebotId', async () => {
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
            const mockExternalPkData: ExternalPkData[] = [
                {
                    rollenart: RollenArt.LEHR,
                    kennung: '1234567',
                    serviceProvider: [
                        createMock<ServiceProviderEntity>({
                            id: faker.string.uuid(),
                            name: 'ServiceProvider A',
                            vidisAngebotId: undefined,
                        }),
                        createMock<ServiceProviderEntity>({
                            id: faker.string.uuid(),
                            name: 'ServiceProvider B',
                            vidisAngebotId: '1357900',
                        }),
                    ],
                },
                {
                    rollenart: RollenArt.LEHR,
                    kennung: '7654321',
                    serviceProvider: [
                        createMock<ServiceProviderEntity>({
                            id: faker.string.uuid(),
                            name: 'ServiceProvider A',
                            vidisAngebotId: undefined,
                        }),
                    ],
                },
            ];

            personRepositoryMock.findById.mockResolvedValue(person);
            dBiamPersonenkontextRepoMock.findExternalPkData.mockResolvedValue(mockExternalPkData);

            await sut.initialize(person.id);
            expect(sut.person).toBeDefined();
            expect(sut.checkedExternalPkData).toBeDefined();
            expect(sut.checkedExternalPkData?.length).toBe(1);
        });

        it('should return entity Not found error when person not found', async () => {
            personRepositoryMock.findById.mockResolvedValue(undefined);
            dBiamPersonenkontextRepoMock.findExternalPkData.mockResolvedValue(createMock<ExternalPkData[]>());

            const response: void | DomainError = await sut.initialize(faker.string.uuid());
            expect(response).toBeInstanceOf(DomainError);
        });
    });
});
