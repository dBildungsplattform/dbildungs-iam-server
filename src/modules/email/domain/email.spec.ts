import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { EmailGeneratorService } from './email-generator.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailFactory } from './email.factory.js';
import { Email } from './email.js';
import { faker } from '@faker-js/faker';
import { Person } from '../../person/domain/person.js';
import { EmailInvalidError } from '../error/email-invalid.error.js';

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

    afterEach(() => {
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
});
