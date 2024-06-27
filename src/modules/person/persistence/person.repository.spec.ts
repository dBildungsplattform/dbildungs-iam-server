import { faker } from '@faker-js/faker';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
} from '../../../../test/utils/index.js';
import { createMock } from '@golevelup/ts-jest';
import { Person } from '../../person/domain/person.js';
import { DomainError } from '../../../shared/error/index.js';
import { PersonFactory } from '../../person/domain/person.factory.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { UsernameGeneratorService } from '../../person/domain/username-generator.service.js';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { EventService } from '../../../core/eventbus/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { Email } from '../../email/domain/email.js';
import { EmailRepo } from '../../email/persistence/email.repo.js';
import { EmailFactory } from '../../email/domain/email.factory.js';
import { EmailGeneratorService } from '../../email/domain/email-generator.service.js';
import { EmailServiceRepo } from '../../email/persistence/email-service.repo.js';

describe('PersonRepository', () => {
    let module: TestingModule;
    let sut: PersonRepository;
    let emailRepo: EmailRepo;
    let emailFactory: EmailFactory;
    let personFactory: PersonFactory;
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
                PersonFactory,
                PersonRepository,
            ],
        }).compile();
        emailRepo = module.get(EmailRepo);
        emailFactory = module.get(EmailFactory);
        personFactory = module.get(PersonFactory);
        sut = module.get(PersonRepository);
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
        const person: Person<true> | DomainError = await sut.create(personResult);
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

    describe('findEmailAddressByPerson', () => {
        describe('when email for personId is found', () => {
            it('should return current address', async () => {
                const person: Person<true> = await createPerson();
                const email: Email<false> = emailFactory.createNew(person.id);
                const validEmail: Result<Email<false>> = await email.enable();

                if (!validEmail.ok) throw Error();
                const savedEmail: Email<true> | DomainError = await emailRepo.save(validEmail.value);
                if (savedEmail instanceof DomainError) throw new Error();
                const currentAddress: Option<string> = savedEmail.currentAddress;
                if (!currentAddress) throw new Error();

                expect(await sut.findEmailAddressByPerson(person.id)).toStrictEqual(currentAddress);
            });
        });

        describe('when email for personId is NOT found', () => {
            it('should return undefined', async () => {
                const person: Person<true> = await createPerson();
                const email: Email<false> = emailFactory.createNew(person.id);
                const validEmail: Result<Email<false>> = await email.enable();

                if (!validEmail.ok) throw Error();
                const savedEmail: Email<true> | DomainError = await emailRepo.save(validEmail.value);
                if (savedEmail instanceof DomainError) throw new Error();

                expect(await sut.findEmailAddressByPerson(faker.string.uuid())).toBeFalsy();
            });
        });

        describe('when email for personId is found, but email is disabled', () => {
            it('should return', async () => {
                const person: Person<true> = await createPerson();
                const email: Email<false> = emailFactory.createNew(person.id);

                const validEmail: Result<Email<false>> = await email.enable();
                if (!validEmail.ok) throw Error();
                validEmail.value.disable();
                const savedEmail: Email<true> | DomainError = await emailRepo.save(validEmail.value);
                if (savedEmail instanceof DomainError) throw new Error();

                expect(await sut.findEmailAddressByPerson(person.id)).toBeFalsy();
            });
        });
    });
});
