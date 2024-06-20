import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { EmailGeneratorService } from './email-generator.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailFactory } from './email.factory.js';
import { Email } from './email.js';
import { faker } from '@faker-js/faker';
import { Person } from '../../person/domain/person.js';
import { EmailInvalidError } from '../error/email-invalid.error.js';
import { EmailAddress } from './email-address.js';

describe('Email Aggregate', () => {
    let module: TestingModule;
    let emailFactory: EmailFactory;
    let emailGeneratorServiceMock: DeepMocked<EmailGeneratorService>;
    let personRepositoryMock: DeepMocked<PersonRepository>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                EmailFactory,
                {
                    provide: EmailGeneratorService,
                    useValue: createMock<EmailGeneratorService>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
            ],
        }).compile();
        emailGeneratorServiceMock = module.get(EmailGeneratorService);
        personRepositoryMock = module.get(PersonRepository);
        emailFactory = module.get(EmailFactory);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('activate', () => {
        describe('when person cannot be found', () => {
            it('should return EmailInvalidError', async () => {
                const email: Email<false, false> = emailFactory.createNew(faker.string.uuid());
                personRepositoryMock.findById.mockResolvedValueOnce(undefined);

                const result: Result<Email<false, true>> = await email.enable();

                expect(result.ok).toBeFalsy();
            });
        });

        describe('when generation of address fails', () => {
            it('should return EmailInvalidError', async () => {
                const email: Email<false, false> = emailFactory.createNew(faker.string.uuid());
                personRepositoryMock.findById.mockResolvedValueOnce(createMock<Person<true>>());
                emailGeneratorServiceMock.generateAddress.mockResolvedValueOnce({
                    ok: false,
                    error: new EmailInvalidError(),
                });
                const result: Result<Email<false, true>> = await email.enable();

                expect(result.ok).toBeFalsy();
            });
        });
    });

    describe('disable', () => {
        describe('when no emailAddresses exist', () => {
            it('should return false', () => {
                const email: Email<false, false> = emailFactory.createNew(faker.string.uuid());
                const result: boolean = email.disable();
                expect(result).toBeFalsy();
            });
        });

        describe('when emailAddresses exist', () => {
            it('should set all of them to disabled return true ', async () => {
                const email: Email<false, false> = emailFactory.createNew(faker.string.uuid());

                personRepositoryMock.findById.mockResolvedValueOnce(createMock<Person<true>>());
                emailGeneratorServiceMock.generateAddress.mockResolvedValueOnce({
                    ok: true,
                    value: faker.internet.email(),
                });
                const enabledEmail: Result<Email<false, true>> = await email.enable();

                if (!enabledEmail.ok) throw new Error();
                const result: boolean = enabledEmail.value.disable();
                expect(result).toBeTruthy();
                const emailAddresses: EmailAddress[] | undefined = enabledEmail.value.emailAddresses;
                if (!emailAddresses) throw new Error();
                expect(emailAddresses.every((ea: EmailAddress) => !ea.enabled));
            });
        });
    });

    describe('isEnabled', () => {
        describe('when no emailAddresses exist', () => {
            it('should return false', () => {
                const email: Email<false, false> = emailFactory.createNew(faker.string.uuid());

                expect(email.isEnabled()).toBeFalsy();
            });
        });

        describe('when emailAddresses exist and at least one is enabled', () => {
            it('should return true ', async () => {
                const email: Email<false, false> = emailFactory.createNew(faker.string.uuid());
                personRepositoryMock.findById.mockResolvedValueOnce(createMock<Person<true>>());
                emailGeneratorServiceMock.generateAddress.mockResolvedValueOnce({
                    ok: true,
                    value: faker.internet.email(),
                });
                const enabledEmail: Result<Email<false, true>> = await email.enable();

                if (!enabledEmail.ok) throw new Error();
                expect(enabledEmail.value.isEnabled()).toBeTruthy();
            });
        });
    });
});
