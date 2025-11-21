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
} from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import {
    PersonenkontextErweitertVirtualEntityLoaded,
    RollenerweiterungRepo,
} from '../../rolle/repo/rollenerweiterung.repo.js';
import { UserExternaldataWorkflowAggregate } from './user-extenaldata.workflow.js';

describe('UserExternaldataWorkflow', () => {
    let module: TestingModule;
    let sut: UserExternaldataWorkflowAggregate;
    let dBiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let rollenerweiterungRepoMock: DeepMocked<RollenerweiterungRepo>;
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
                    provide: RollenerweiterungRepo,
                    useValue: createMock<RollenerweiterungRepo>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
            ],
        }).compile();
        dBiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        rollenerweiterungRepoMock = module.get(RollenerweiterungRepo);
        personRepositoryMock = module.get(PersonRepository);
        sut = UserExternaldataWorkflowAggregate.createNew(
            dBiamPersonenkontextRepoMock,
            rollenerweiterungRepoMock,
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
            rollenerweiterungRepoMock.findPKErweiterungen.mockResolvedValue(
                createMock<PersonenkontextErweitertVirtualEntityLoaded[]>(),
            );

            await sut.initialize(person.id);
            expect(sut.person).toBeDefined();
            expect(sut.checkedExternalPkData).toBeDefined();
        });

        it('should return entity Not found error when person not found', async () => {
            personRepositoryMock.findById.mockResolvedValue(undefined);
            dBiamPersonenkontextRepoMock.findExternalPkData.mockResolvedValue(createMock<ExternalPkData[]>());
            rollenerweiterungRepoMock.findPKErweiterungen.mockResolvedValue(
                createMock<PersonenkontextErweitertVirtualEntityLoaded[]>(),
            );

            const response: void | DomainError = await sut.initialize(faker.string.uuid());
            expect(response).toBeInstanceOf(DomainError);
        });
    });
});
