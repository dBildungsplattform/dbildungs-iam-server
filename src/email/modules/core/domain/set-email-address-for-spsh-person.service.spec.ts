import { Test, TestingModule } from '@nestjs/testing';
import { SetEmailAddressForSpshPersonService } from './services/set-email-address-for-spsh-person.service.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { EmailAddressRepo } from '../persistence/email-address.repo.js';
import { EmailDomainRepo } from '../persistence/email-domain.repo.js';
import { EmailAddress } from './email-address.js';
import { EmailDomain } from './email-domain.js';
import { faker } from '@faker-js/faker';
import { EmailAddressGenerator } from './email-address-generator.js';
import { EmailAddressStatusRepo } from '../persistence/email-address-status.repo.js';
import { EmailAddressStatus } from './email-address-status.js';
import { EmailAddressStatusEnum } from '../persistence/email-address-status.entity.js';
import { SetEmailAddressForSpshPersonParams } from '../api/dtos/params/set-email-addess-for-spsh-person.params.js';
import { EmailDomainNotFoundError } from '../error/email-domain-not-found.error.js';

describe('SetEmailAddressForSpshPersonService', () => {
    let module: TestingModule;
    let sut: SetEmailAddressForSpshPersonService;
    let loggerMock: DeepMocked<ClassLogger>;
    let emailAddressRepoMock: DeepMocked<EmailAddressRepo>;
    let emailDomainRepoMock: DeepMocked<EmailDomainRepo>;
    let emailAddressStatusRepoMock: DeepMocked<EmailAddressStatusRepo>;
    let emailAddressGeneratorMock: DeepMocked<EmailAddressGenerator>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                SetEmailAddressForSpshPersonService,
                ClassLogger,
                EmailAddressRepo,
                EmailAddressStatusRepo,
                EmailDomainRepo,
                EmailAddressGenerator,
            ],
        })
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .overrideProvider(EmailAddressRepo)
            .useValue(createMock<EmailAddressRepo>())
            .overrideProvider(EmailAddressStatusRepo)
            .useValue(createMock<EmailAddressStatusRepo>())
            .overrideProvider(EmailDomainRepo)
            .useValue(createMock<EmailDomainRepo>())
            .overrideProvider(EmailAddressGenerator)
            .useValue(createMock<EmailAddressGenerator>())
            .compile();

        sut = module.get(SetEmailAddressForSpshPersonService);
        loggerMock = module.get(ClassLogger);
        emailAddressRepoMock = module.get(EmailAddressRepo);
        emailDomainRepoMock = module.get(EmailDomainRepo);
        emailAddressGeneratorMock = module.get(EmailAddressGenerator);
        emailAddressStatusRepoMock = module.get(EmailAddressStatusRepo);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should create first email address for person', async () => {
        emailAddressRepoMock.findBySpshPersonIdSortedByPriorityAsc.mockResolvedValue([]);
        emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValueOnce({
            ok: true,
            value: 'max.mustermann@example.com',
        });
        emailDomainRepoMock.findById.mockResolvedValue(
            EmailDomain.construct({
                id: faker.string.uuid(),
                createdAt: new Date(),
                updatedAt: new Date(),
                domain: 'example.com',
            }),
        );
        emailAddressRepoMock.save.mockResolvedValue(
            EmailAddress.construct({
                id: 'id',
                createdAt: new Date(),
                updatedAt: new Date(),
                address: 'max.mustermann@example.com',
                priority: 0,
                spshPersonId: faker.string.uuid(),
            }),
        );
        emailAddressStatusRepoMock.create.mockResolvedValue(
            EmailAddressStatus.construct({
                id: faker.string.uuid(),
                createdAt: new Date(),
                updatedAt: new Date(),
                emailAddressId: faker.string.uuid(),
                status: EmailAddressStatusEnum.PENDING,
            }),
        );
        emailAddressRepoMock.existsEmailAddress.mockResolvedValue(false);

        await sut.setEmailAddressForSpshPerson({
            firstName: 'Max',
            lastName: 'Mustermann',
            spshPersonId: faker.string.uuid(),
            emailDomainId: faker.string.uuid(),
        });

        expect(emailAddressRepoMock.save).toHaveBeenCalledTimes(1);
        expect(emailAddressStatusRepoMock.create).toHaveBeenCalledTimes(1);
        expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('Created email address'));
    });

    it('should throw EmailDomainNotFoundError if email domain does not exist', async () => {
        emailAddressRepoMock.findBySpshPersonIdSortedByPriorityAsc.mockResolvedValue([]);
        emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValueOnce({
            ok: true,
            value: 'max.mustermann@example.com',
        });
        emailDomainRepoMock.findById.mockResolvedValue(undefined);

        const params: SetEmailAddressForSpshPersonParams = {
            firstName: 'Max',
            lastName: 'Mustermann',
            spshPersonId: faker.string.uuid(),
            emailDomainId: 'missing-domain-id',
        };

        await expect(sut.setEmailAddressForSpshPerson(params)).rejects.toThrow(
            new EmailDomainNotFoundError(`EmailDomain with id ${params.emailDomainId} not found`),
        );
        expect(loggerMock.error).toHaveBeenCalledWith('EmailDomain with id missing-domain-id not found');
    });

    it('should log and not create email address if person already has addresses', async () => {
        emailAddressRepoMock.findBySpshPersonIdSortedByPriorityAsc.mockResolvedValue([
            EmailAddress.construct({
                id: 'id',
                createdAt: new Date(),
                updatedAt: new Date(),
                address: 'max.mustermann@example.com',
                priority: 0,
                spshPersonId: faker.string.uuid(),
            }),
        ]);
        emailDomainRepoMock.findById.mockResolvedValue(
            EmailDomain.construct({
                id: faker.string.uuid(),
                createdAt: new Date(),
                updatedAt: new Date(),
                domain: 'example.com',
            }),
        );

        await sut.setEmailAddressForSpshPerson({
            firstName: 'Max',
            lastName: 'Mustermann',
            spshPersonId: faker.string.uuid(),
            emailDomainId: faker.string.uuid(),
        });
        expect(emailAddressRepoMock.save).not.toHaveBeenCalled();
        expect(loggerMock.crit).toHaveBeenCalled();
    });

    it('should throw if emailAddressGenerator.generateAvailableAddress returns error', async () => {
        emailAddressRepoMock.findBySpshPersonIdSortedByPriorityAsc.mockResolvedValue([]);
        emailDomainRepoMock.findById.mockResolvedValue(
            EmailDomain.construct({
                id: faker.string.uuid(),
                createdAt: new Date(),
                updatedAt: new Date(),
                domain: 'example.com',
            }),
        );
        emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValue({
            ok: false,
            error: new Error('Testerror'),
        });

        const params: SetEmailAddressForSpshPersonParams = {
            firstName: 'Max',
            lastName: 'Mustermann',
            spshPersonId: faker.string.uuid(),
            emailDomainId: faker.string.uuid(),
        };

        await expect(sut.setEmailAddressForSpshPerson(params)).rejects.toThrow(new Error('Testerror'));
        expect(emailAddressStatusRepoMock.create).not.toHaveBeenCalled();
    });

    it('should throw if save returns error', async () => {
        emailAddressRepoMock.findBySpshPersonIdSortedByPriorityAsc.mockResolvedValue([]);
        emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValueOnce({
            ok: true,
            value: 'max.mustermann@example.com',
        });
        emailDomainRepoMock.findById.mockResolvedValue(
            EmailDomain.construct({
                id: faker.string.uuid(),
                createdAt: new Date(),
                updatedAt: new Date(),
                domain: 'example.com',
            }),
        );
        const domainError: EmailDomainNotFoundError = new EmailDomainNotFoundError('Testerror');
        emailAddressRepoMock.save.mockResolvedValue(domainError);
        emailAddressRepoMock.existsEmailAddress.mockResolvedValue(false);

        await expect(
            sut.setEmailAddressForSpshPerson({
                firstName: 'Max',
                lastName: 'Mustermann',
                spshPersonId: faker.string.uuid(),
                emailDomainId: faker.string.uuid(),
            }),
        ).rejects.toThrow(domainError);

        expect(emailAddressRepoMock.save).toHaveBeenCalledTimes(1);
        expect(emailAddressStatusRepoMock.create).toHaveBeenCalledTimes(0);
        expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining('Failed to create email address'));
    });
});
