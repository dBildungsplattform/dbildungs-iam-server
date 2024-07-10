import { faker } from '@faker-js/faker';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
} from '../../../../test/utils/index.js';
import { EmailRepo } from './email.repo.js';
import { Email } from '../domain/email.js';
import { EmailFactory } from '../domain/email.factory.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Person } from '../../person/domain/person.js';
import { DomainError } from '../../../shared/error/index.js';
import { PersonFactory } from '../../person/domain/person.factory.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { UsernameGeneratorService } from '../../person/domain/username-generator.service.js';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { EmailGeneratorService } from '../domain/email-generator.service.js';
import { EmailServiceRepo } from './email-service.repo.js';
import { EventService } from '../../../core/eventbus/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EmailAddressNotFoundError } from '../error/email-address-not-found.error.js';
import { EmailAddressAmbiguousError } from '../error/email-address-ambiguous.error.js';

describe('EmailRepo Mocked Services', () => {
    let module: TestingModule;
    let sut: EmailRepo;
    let emailFactory: EmailFactory;
    let personFactory: PersonFactory;
    let personRepository: PersonRepository;
    let emailGeneratorServiceMock: DeepMocked<EmailGeneratorService>;
    let orm: MikroORM;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true })],
            providers: [
                UsernameGeneratorService,
                EmailRepo,
                EmailFactory,
                EmailServiceRepo,
                PersonRepository,
                PersonFactory,
                {
                    provide: EmailGeneratorService,
                    useValue: createMock<EmailGeneratorService>(),
                },
                {
                    provide: EventService,
                    useValue: createMock<EventService>(),
                },
                {
                    provide: ClassLogger,
                    useValue: createMock<ClassLogger>(),
                },
                {
                    provide: KeycloakUserService,
                    useValue: createMock<KeycloakUserService>({
                        create: () =>
                            Promise.resolve({
                                ok: true,
                                value: faker.string.uuid(),
                            }),
                        setPassword: () =>
                            Promise.resolve({
                                ok: true,
                                value: faker.string.alphanumeric(16),
                            }),
                    }),
                },
            ],
        }).compile();
        sut = module.get(EmailRepo);
        emailFactory = module.get(EmailFactory);
        personFactory = module.get(PersonFactory);
        personRepository = module.get(PersonRepository);
        emailGeneratorServiceMock = module.get(EmailGeneratorService);
        orm = module.get(MikroORM);

        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    async function createPerson(): Promise<Person<true>> {
        const personResult: Person<false> | DomainError = await personFactory.createNew({
            vorname: faker.person.firstName(),
            familienname: faker.person.lastName(),
            username: faker.internet.userName(),
            password: faker.string.alphanumeric(8),
        });
        if (personResult instanceof DomainError) {
            throw personResult;
        }
        const person: Person<true> | DomainError = await personRepository.create(personResult);
        if (person instanceof DomainError) {
            throw person;
        }

        return person;
    }

    afterAll(async () => {
        await orm.close();
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('findByPerson', () => {
        describe('when NO email-address is found for personId', () => {
            it('should return EmailAddressNotFoundError', async () => {
                const person: Person<true> = await createPerson();
                const email: Email<false> = emailFactory.createNew(person.id);
                emailGeneratorServiceMock.generateAddress.mockResolvedValueOnce({
                    ok: true,
                    value: 'test.test@schule-sh.de',
                });

                const validEmail: Result<Email<false>> = await email.enable();
                if (!validEmail.ok) throw Error();
                const savedEmail: Email<true> | DomainError = await sut.save(validEmail.value);
                if (savedEmail instanceof DomainError) throw new Error();

                emailGeneratorServiceMock.isEqual.mockReturnValue(false);

                const foundEmail: Email<true> | DomainError = await sut.findByPerson(person.id);

                expect(foundEmail).toBeInstanceOf(EmailAddressNotFoundError);
            });
        });

        describe('when ambiguous email-address is found for personId', () => {
            it('should return EmailAddressAmbiguousError', async () => {
                const person: Person<true> = await createPerson();
                const email: Email<false> = emailFactory.createNew(person.id);
                emailGeneratorServiceMock.generateAddress.mockResolvedValueOnce({
                    ok: true,
                    value: 'test1.test@schule-sh.de',
                });

                const validEmail: Result<Email<false>> = await email.enable();
                if (!validEmail.ok) throw Error();
                const savedEmail: Email<true> | DomainError = await sut.save(validEmail.value);
                if (savedEmail instanceof DomainError) throw new Error();

                const email2: Email<false> = emailFactory.createNew(person.id);
                emailGeneratorServiceMock.generateAddress.mockResolvedValueOnce({
                    ok: true,
                    value: 'test2.test@schule-sh.de',
                });

                const validEmail2: Result<Email<false>> = await email2.enable();
                if (!validEmail2.ok) throw Error();
                const savedEmail2: Email<true> | DomainError = await sut.save(validEmail2.value);
                if (savedEmail2 instanceof DomainError) throw new Error();

                emailGeneratorServiceMock.isEqual.mockReturnValue(true);

                const foundEmail: Email<true> | DomainError = await sut.findByPerson(person.id);

                expect(foundEmail).toBeInstanceOf(EmailAddressAmbiguousError);
            });
        });
    });
});
