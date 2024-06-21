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
import { createMock } from '@golevelup/ts-jest';
import { Person } from '../../person/domain/person.js';
import { DomainError } from '../../../shared/error/index.js';
import { PersonFactory } from '../../person/domain/person.factory.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { UsernameGeneratorService } from '../../person/domain/username-generator.service.js';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { EmailGeneratorService } from '../domain/email-generator.service.js';
import { EmailServiceRepo } from './email-service.repo.js';
import { EventService } from '../../../core/eventbus/index.js';

describe('EmailRepo', () => {
    let module: TestingModule;
    let sut: EmailRepo;
    let emailFactory: EmailFactory;
    let personFactory: PersonFactory;
    let personRepository: PersonRepository;
    let orm: MikroORM;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true })],
            providers: [
                UsernameGeneratorService,
                EmailRepo,
                EmailFactory,
                EmailGeneratorService,
                EmailServiceRepo,
                {
                    provide: EventService,
                    useValue: createMock<EventService>(),
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
                PersonFactory,
                PersonRepository,
            ],
        }).compile();
        sut = module.get(EmailRepo);
        emailFactory = module.get(EmailFactory);
        personFactory = module.get(PersonFactory);
        personRepository = module.get(PersonRepository);
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
        //jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('findByPersonId', () => {
        it('should return email by personId', async () => {
            const person: Person<true> = await createPerson();
            const email: Email<false, false> = emailFactory.createNew(person.id);
            const validEmail: Result<Email<false, true>> = await email.enable();
            if (!validEmail.ok) throw Error();
            const savedEmail: Email<true, true> = await sut.save(validEmail.value);

            const foundEmail: Email<true, true> = await sut.findByPerson(person.id);

            expect(foundEmail).toBeTruthy();
            expect(foundEmail.id).toStrictEqual(savedEmail.id);
        });
    });

    describe('save with id (update)', () => {
        it('should update entity, when id is set', async () => {
            const person: Person<true> = await createPerson();
            const email: Email<false, false> = emailFactory.createNew(person.id);
            const validEmail: Result<Email<false, true>> = await email.enable();
            if (!validEmail.ok) throw Error();
            const savedEmail: Email<true, true> = await sut.save(validEmail.value);
            const newEmail: Email<true, true> = emailFactory.construct(
                savedEmail.id,
                faker.date.past(),
                faker.date.recent(),
                person.id,
                [],
            );
            const updatedMail: Email<true, true> = await sut.save(newEmail);
            const foundEmail: Option<Email<true, true>> = await sut.findById(updatedMail.id);

            expect(foundEmail).toBeTruthy();
            expect(foundEmail).toEqual(updatedMail);
        });
    });

    describe('deleteById', () => {
        describe('when email exists', () => {
            it('should return true', async () => {
                const person: Person<true> = await createPerson();
                const email: Email<false, false> = emailFactory.createNew(person.id);
                const validEmail: Result<Email<false, true>> = await email.enable();

                if (!validEmail.ok) throw Error();
                const savedEmail: Email<true, true> = await sut.save(validEmail.value);
                const result: boolean = await sut.deleteById(savedEmail.id);

                expect(result).toBeTruthy();
            });
        });

        describe('when email does NOT exist', () => {
            it('should return false', async () => {
                const result: boolean = await sut.deleteById(faker.string.uuid());

                expect(result).toBeFalsy();
            });
        });
    });
});
