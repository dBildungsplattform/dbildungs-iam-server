import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EmailAddressDeletionService } from './email-address-deletion.service.js';
import { EmailRepo } from '../persistence/email.repo.js';
import { EventService } from '../../../core/eventbus/services/event.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailAddress, EmailAddressStatus } from '../domain/email-address.js';
import { faker } from '@faker-js/faker';
import { Person } from '../../person/domain/person.js';
import { PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';

describe('EmailAddressDeletionService', () => {
    let module: TestingModule;
    let sut: EmailAddressDeletionService;

    let emailRepoMock: DeepMocked<EmailRepo>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let loggerMock: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                EmailAddressDeletionService,
                {
                    provide: ClassLogger,
                    useValue: createMock<ClassLogger>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
                {
                    provide: EmailRepo,
                    useValue: createMock<EmailRepo>(),
                },
                {
                    provide: EventService,
                    useValue: createMock<EventService>(),
                },
            ],
        }).compile();

        sut = module.get(EmailAddressDeletionService);

        emailRepoMock = module.get(EmailRepo);
        personRepositoryMock = module.get(PersonRepository);
        loggerMock = module.get(ClassLogger);
    });

    function createDisabledEmailAddressesForPersons(persons: Person<true>[]): EmailAddress<true>[] {
        const list: EmailAddress<true>[] = [];
        const dateInPast: Date = new Date();
        dateInPast.setDate(dateInPast.getDate() - 180);
        for (const person of persons) {
            const emailAddress: EmailAddress<true> = createMock<EmailAddress<true>>({
                get status(): EmailAddressStatus {
                    return EmailAddressStatus.DISABLED;
                },
                get address(): string {
                    return person.vorname + '.' + person.familienname + '@schule-sh.de';
                },
                get personId(): PersonID {
                    return person.id;
                },
                updatedAt: dateInPast,
            });
            list.push(emailAddress);
        }

        return list;
    }

    function createPersons(size: number = 3): Person<true>[] {
        const list: Person<true>[] = [];
        for (let i: number = 0; i < size; i++) {
            const person: Person<true> = createMock<Person<true>>({
                id: faker.string.uuid(),
                referrer: faker.internet.userName(),
                vorname: faker.person.firstName(),
                familienname: faker.person.lastName(),
            });
            list.push(person);
        }

        return list;
    }

    function createPersonsAndEmailAddresses(size: number = 3): [Person<true>[], EmailAddress<true>[]] {
        const persons: Person<true>[] = createPersons(size);
        const emailAddresses: EmailAddress<true>[] = createDisabledEmailAddressesForPersons(persons);

        return [persons, emailAddresses];
    }

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('deleteEmailAddresses', () => {
        describe('when', () => {
            it('should ', async () => {
                const [persons, emailAddresses]: [Person<true>[], EmailAddress<true>[]] =
                    createPersonsAndEmailAddresses();
                const permissionsMock: PersonPermissions = createMock<PersonPermissions>();

                emailRepoMock.getEmailAddressesDeleteList.mockResolvedValueOnce(emailAddresses);
                personRepositoryMock.findByIds.mockResolvedValueOnce(persons);

                await sut.deleteEmailAddresses(permissionsMock);

                expect(loggerMock.info).toHaveBeenCalledWith('Non-primary EAs:');
            });
        });
    });
});
