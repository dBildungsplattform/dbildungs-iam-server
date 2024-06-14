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
import { EmailGeneratorService } from '../domain/email-generator.service.js';
import { createMock } from '@golevelup/ts-jest';
import { Person } from '../../person/domain/person.js';
import { DomainError } from '../../../shared/error/index.js';
import { PersonFactory } from '../../person/domain/person.factory.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { UsernameGeneratorService } from '../../person/domain/username-generator.service.js';
import { KeycloakUserService } from '../../keycloak-administration/index.js';

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
                {
                    provide: EmailGeneratorService,
                    useValue: createMock<EmailGeneratorService>(),
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

    describe('findById', () => {
        it('should return one email by id', async () => {
            const person: Person<true> = await createPerson();
            const email: Email<false> = emailFactory.createNew(faker.internet.email(), false, person.id);
            const savedEmail: Email<true> = await sut.save(email);
            const foundEmail: Option<Email<true>> = await sut.findById(savedEmail.id);

            expect(foundEmail).toBeTruthy();
            expect(foundEmail).toEqual(savedEmail);
        });
    });

    describe('findByIds', () => {
        it('should return several emails by id', async () => {
            const person: Person<true> = await createPerson();
            const email1: Email<false> = emailFactory.createNew(faker.internet.email(), false, person.id);
            const email2: Email<false> = emailFactory.createNew(faker.internet.email(), false, person.id);
            const savedEmail1: Email<true> = await sut.save(email1);
            const savedEmail2: Email<true> = await sut.save(email2);

            const foundEmailsMap: Map<string, Email<true>> = await sut.findByIds([savedEmail1.id, savedEmail2.id]);

            expect(foundEmailsMap).toBeTruthy();
            expect(foundEmailsMap.get(savedEmail1.id)).toEqual(savedEmail1);
            expect(foundEmailsMap.get(savedEmail2.id)).toEqual(savedEmail2);
        });
    });

    describe('findByName', () => {
        it('should return email by name', async () => {
            const person: Person<true> = await createPerson();
            const name: string = faker.internet.email();
            const email: Email<false> = emailFactory.createNew(name, false, person.id);
            const savedEmail: Email<true> = await sut.save(email);

            const foundEmail: Option<Email<true>> = await sut.findByName(savedEmail.name);

            expect(foundEmail).toBeTruthy();
            expect(foundEmail).toEqual(savedEmail);
        });
    });

    describe('findByPersonId', () => {
        it('should return email by personId', async () => {
            const person: Person<true> = await createPerson();
            const name: string = faker.internet.email();
            const email: Email<false> = emailFactory.createNew(name, false, person.id);
            const savedEmail: Email<true> = await sut.save(email);

            const foundEmails: Email<true>[] = await sut.findByPersonId(person.id);

            expect(foundEmails).toBeTruthy();
            expect(foundEmails).toContainEqual(expect.objectContaining({ id: savedEmail.id }));
        });
    });

    describe('save with id (update)', () => {
        it('should update entity, when id is set', async () => {
            const person: Person<true> = await createPerson();
            const name: string = faker.internet.email();
            const email: Email<false> = emailFactory.createNew(name, false, person.id);
            const savedEmail: Email<true> = await sut.save(email);
            const newEmail: Email<false> = emailFactory.construct(
                savedEmail.id,
                faker.date.past(),
                faker.date.recent(),
                'test',
                false,
                person.id,
            );
            const updatedMail: Email<true> = await sut.save(newEmail);
            const foundEmail: Option<Email<true>> = await sut.findById(updatedMail.id);

            expect(foundEmail).toBeTruthy();
            expect(foundEmail).toEqual(updatedMail);
        });
    });
});
