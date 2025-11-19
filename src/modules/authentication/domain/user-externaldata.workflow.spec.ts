import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
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
    ExternalPkData,
} from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { UserExternaldataWorkflowAggregate } from './user-extenaldata.workflow.js';

describe('UserExternaldataWorkflow', () => {
    let module: TestingModule;
    let sut: UserExternaldataWorkflowAggregate;
    let dBiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let emailResolverServiceMock: DeepMocked<EmailResolverService>;

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
                {
                    provide: EmailResolverService,
                    useValue: createMock<EmailResolverService>(),
                },
            ],
        }).compile();
        dBiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        personRepositoryMock = module.get(PersonRepository);
        emailResolverServiceMock = module.get(EmailResolverService);
        sut = UserExternaldataWorkflowAggregate.createNew(
            dBiamPersonenkontextRepoMock,
            personRepositoryMock,
            createMock<ConfigService>(),
            emailResolverServiceMock,
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

            personRepositoryMock.findById.mockResolvedValue(person);
            dBiamPersonenkontextRepoMock.findExternalPkData.mockResolvedValue(createMock<ExternalPkData[]>());
            emailResolverServiceMock.shouldUseEmailMicroservice.mockReturnValue(true);
            emailResolverServiceMock.findEmailBySpshPersonWithOxLoginId.mockResolvedValue(
                createMock<EmailAddressResponse>({ oxLoginId: oxLoginId }),
            );

            await sut.initialize(person.id);
            expect(sut.person).toBeDefined();
            expect(sut.checkedExternalPkData).toBeDefined();
            expect(sut.contextID).toBe(oxLoginId);
        });

        it('should return entity Not found error when person not found', async () => {
            personRepositoryMock.findById.mockResolvedValue(undefined);
            dBiamPersonenkontextRepoMock.findExternalPkData.mockResolvedValue(createMock<ExternalPkData[]>());

            const response: void | DomainError = await sut.initialize(faker.string.uuid());
            expect(response).toBeInstanceOf(DomainError);
        });
    });
});
