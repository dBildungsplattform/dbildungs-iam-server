import { Test, TestingModule } from '@nestjs/testing';
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
import { SetEmailAddressForSpshPersonService } from './set-email-address-for-spsh-person.service.js';
import { OxService } from '../../ox/domain/ox-service.js';
import { LdapClientService, PersonData } from '../../ldap/domain/ldap-client.service.js';
import { OxSendService } from '../../ox/domain/ox-send-service.js';
import { HttpService } from '@nestjs/axios';
import { CreateUserResponse } from '../../ox/actions/user/create-user.action.js';
import { OxPrimaryMailAlreadyExistsError } from '../../ox/error/ox-primary-mail-already-exists.error.js';
import { EmailCreationFailedError } from '../error/email-creaton-failed.error.js';

describe('SetEmailAddressForSpshPersonService', () => {
    let module: TestingModule;
    let sut: SetEmailAddressForSpshPersonService;
    let loggerMock: DeepMocked<ClassLogger>;
    let emailAddressRepoMock: DeepMocked<EmailAddressRepo>;
    let emailDomainRepoMock: DeepMocked<EmailDomainRepo>;
    let emailAddressStatusRepoMock: DeepMocked<EmailAddressStatusRepo>;
    let emailAddressGeneratorMock: DeepMocked<EmailAddressGenerator>;
    let oxSendServiceMock: DeepMocked<OxSendService>;
    let ldapClientServiceMock: DeepMocked<LdapClientService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                SetEmailAddressForSpshPersonService,
                ClassLogger,
                EmailAddressRepo,
                EmailAddressStatusRepo,
                EmailDomainRepo,
                EmailAddressGenerator,
                OxService,
                OxSendService,
                LdapClientService,
                HttpService,
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
            .overrideProvider(OxService)
            .useValue(createMock<OxService>())
            .overrideProvider(LdapClientService)
            .useValue(createMock<LdapClientService>())
            .overrideProvider(OxSendService)
            .useValue(createMock<OxSendService>())
            .overrideProvider(HttpService)
            .useValue(createMock<HttpService>())
            .compile();

        sut = module.get(SetEmailAddressForSpshPersonService);
        loggerMock = module.get(ClassLogger);
        emailAddressRepoMock = module.get(EmailAddressRepo);
        emailDomainRepoMock = module.get(EmailDomainRepo);
        emailAddressGeneratorMock = module.get(EmailAddressGenerator);
        emailAddressStatusRepoMock = module.get(EmailAddressStatusRepo);
        oxSendServiceMock = module.get(OxSendService);
        ldapClientServiceMock = module.get(LdapClientService);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    it('should successfullly create first email address for person', async () => {
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

        oxSendServiceMock.send.mockResolvedValue({
            ok: true,
            value: {
                id: faker.string.numeric({ length: 5 }),
                firstname: 'max',
                lastname: 'mustermann',
                username: 'max.mustermann',
                primaryEmail: 'max.mustermann@example.com',
                mailenabled: true,
            } satisfies CreateUserResponse,
        });

        ldapClientServiceMock.createPerson.mockResolvedValue({
            ok: true,
            value: {
                firstName: 'Max',
                lastName: 'Mustermann',
                uid: faker.string.uuid(),
            } satisfies PersonData,
        });
        ldapClientServiceMock.isPersonExisting.mockResolvedValue({ ok: true, value: false });

        await sut.setEmailAddressForSpshPerson({
            firstName: 'Max',
            lastName: 'Mustermann',
            spshPersonId: faker.string.uuid(),
            spshUsername: faker.internet.userName(),
            kennungen: ['01234567'],
            emailDomainId: faker.string.uuid(),
        });

        expect(emailAddressRepoMock.save).toHaveBeenCalledTimes(2);
        expect(emailAddressStatusRepoMock.create).toHaveBeenCalledTimes(2);
        expect(emailAddressStatusRepoMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                status: EmailAddressStatusEnum.PENDING,
            }),
        );
        expect(emailAddressStatusRepoMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                status: EmailAddressStatusEnum.ACTIVE,
            }),
        );
    });

    it('should mark email as exists only in ox and retry if OxPrimaryMailAlreadyExistsError is result of ox operation', async () => {
        emailAddressRepoMock.findBySpshPersonIdSortedByPriorityAsc.mockResolvedValue([]);
        emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValue({
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

        oxSendServiceMock.send
            .mockResolvedValueOnce({
                ok: false,
                error: new OxPrimaryMailAlreadyExistsError(''),
            })
            .mockResolvedValueOnce({
                ok: true,
                value: {
                    id: faker.string.numeric({ length: 5 }),
                    firstname: 'max',
                    lastname: 'mustermann',
                    username: 'max.mustermann',
                    primaryEmail: 'max.mustermann@example.com',
                    mailenabled: true,
                } satisfies CreateUserResponse,
            });

        ldapClientServiceMock.createPerson.mockResolvedValue({
            ok: true,
            value: {
                firstName: 'Max',
                lastName: 'Mustermann',
                uid: faker.string.uuid(),
            } satisfies PersonData,
        });
        ldapClientServiceMock.isPersonExisting.mockResolvedValue({ ok: true, value: false });

        await sut.setEmailAddressForSpshPerson({
            firstName: 'Max',
            lastName: 'Mustermann',
            spshPersonId: faker.string.uuid(),
            spshUsername: faker.internet.userName(),
            kennungen: [],
            emailDomainId: faker.string.uuid(),
        });

        expect(emailAddressRepoMock.save).toHaveBeenCalledTimes(4);
        expect(emailAddressStatusRepoMock.create).toHaveBeenCalledTimes(4);
        expect(emailAddressStatusRepoMock.create).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ status: EmailAddressStatusEnum.PENDING }),
        );

        expect(emailAddressStatusRepoMock.create).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ status: EmailAddressStatusEnum.EXISTS_ONLY_IN_OX }),
        );

        expect(emailAddressStatusRepoMock.create).toHaveBeenNthCalledWith(
            3,
            expect.objectContaining({ status: EmailAddressStatusEnum.PENDING }),
        );

        expect(emailAddressStatusRepoMock.create).toHaveBeenNthCalledWith(
            4,
            expect.objectContaining({ status: EmailAddressStatusEnum.ACTIVE }),
        );
    });

    it('should fail if oxUser cannot be connected because oxUserId is undefined', async () => {
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

        oxSendServiceMock.send.mockResolvedValue({
            ok: true,
            value: {
                id: undefined as unknown as string,
                firstname: 'max',
                lastname: 'mustermann',
                username: 'max.mustermann',
                primaryEmail: 'max.mustermann@example.com',
                mailenabled: true,
            } satisfies CreateUserResponse,
        });

        ldapClientServiceMock.createPerson.mockResolvedValue({
            ok: true,
            value: {
                firstName: 'Max',
                lastName: 'Mustermann',
                uid: faker.string.uuid(),
            } satisfies PersonData,
        });
        ldapClientServiceMock.isPersonExisting.mockResolvedValue({ ok: true, value: false });

        await expect(
            sut.setEmailAddressForSpshPerson({
                firstName: 'Max',
                lastName: 'Mustermann',
                spshPersonId: faker.string.uuid(),
                spshUsername: faker.internet.userName(),
                kennungen: [],
                emailDomainId: faker.string.uuid(),
            }),
        ).rejects.toThrow();

        expect(emailAddressRepoMock.save).toHaveBeenCalledTimes(1);
        expect(emailAddressStatusRepoMock.create).toHaveBeenCalledTimes(2);
        expect(emailAddressStatusRepoMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                status: EmailAddressStatusEnum.PENDING,
            }),
        );
        expect(emailAddressStatusRepoMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                status: EmailAddressStatusEnum.FAILED,
            }),
        );
        expect(loggerMock.error).toHaveBeenCalledWith(
            expect.stringContaining('Failed to connect Ox user in Db because oxUserCounter is undefined'),
        );
    });

    it('should fail if oxUser cannot be connected because saving to db fails', async () => {
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
        emailAddressRepoMock.save
            .mockResolvedValueOnce(
                EmailAddress.construct({
                    id: 'id',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    address: 'max.mustermann@example.com',
                    priority: 0,
                    spshPersonId: faker.string.uuid(),
                }),
            )
            .mockResolvedValue(new EmailCreationFailedError('Any Domain Error'));

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

        oxSendServiceMock.send.mockResolvedValue({
            ok: true,
            value: {
                id: faker.string.numeric({ length: 5 }),
                firstname: 'max',
                lastname: 'mustermann',
                username: 'max.mustermann',
                primaryEmail: 'max.mustermann@example.com',
                mailenabled: true,
            } satisfies CreateUserResponse,
        });

        ldapClientServiceMock.createPerson.mockResolvedValue({
            ok: true,
            value: {
                firstName: 'Max',
                lastName: 'Mustermann',
                uid: faker.string.uuid(),
            } satisfies PersonData,
        });
        ldapClientServiceMock.isPersonExisting.mockResolvedValue({ ok: true, value: false });

        await expect(
            sut.setEmailAddressForSpshPerson({
                firstName: 'Max',
                lastName: 'Mustermann',
                spshPersonId: faker.string.uuid(),
                spshUsername: faker.internet.userName(),
                kennungen: [],
                emailDomainId: faker.string.uuid(),
            }),
        ).rejects.toThrow();

        expect(emailAddressRepoMock.save).toHaveBeenCalledTimes(2);
        expect(emailAddressStatusRepoMock.create).toHaveBeenCalledTimes(2);
        expect(emailAddressStatusRepoMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                status: EmailAddressStatusEnum.PENDING,
            }),
        );
        expect(emailAddressStatusRepoMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                status: EmailAddressStatusEnum.FAILED,
            }),
        );
        expect(loggerMock.error).toHaveBeenCalledWith(
            expect.stringContaining('Failed to save email address after trying to connect oxUserCounter'),
        );
    });

    it('should fail if creating user in ldap fails', async () => {
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

        oxSendServiceMock.send.mockResolvedValue({
            ok: true,
            value: {
                id: faker.string.numeric({ length: 5 }),
                firstname: 'max',
                lastname: 'mustermann',
                username: 'max.mustermann',
                primaryEmail: 'max.mustermann@example.com',
                mailenabled: true,
            } satisfies CreateUserResponse,
        });

        ldapClientServiceMock.createPerson.mockResolvedValue({
            ok: false,
            error: new Error('LDAP Creation Error'),
        });
        ldapClientServiceMock.isPersonExisting.mockResolvedValue({ ok: true, value: false });

        await expect(
            sut.setEmailAddressForSpshPerson({
                firstName: 'Max',
                lastName: 'Mustermann',
                spshPersonId: faker.string.uuid(),
                spshUsername: faker.internet.userName(),
                kennungen: [],
                emailDomainId: faker.string.uuid(),
            }),
        ).rejects.toThrow();

        expect(emailAddressRepoMock.save).toHaveBeenCalledTimes(2);
        expect(emailAddressStatusRepoMock.create).toHaveBeenCalledTimes(2);
        expect(emailAddressStatusRepoMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                status: EmailAddressStatusEnum.PENDING,
            }),
        );
        expect(emailAddressStatusRepoMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                status: EmailAddressStatusEnum.FAILED,
            }),
        );
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
            spshUsername: faker.internet.userName(),
            kennungen: [],
            emailDomainId: 'missing-domain-id',
        };

        await expect(sut.setEmailAddressForSpshPerson(params)).rejects.toThrow(
            new EmailDomainNotFoundError(`EmailDomain with id ${params.emailDomainId} not found`),
        );
        expect(loggerMock.error).toHaveBeenCalledWith(
            expect.stringContaining('EmailDomain with id missing-domain-id not found'),
        );
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
            spshUsername: faker.internet.userName(),
            kennungen: [],
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
            spshUsername: faker.internet.userName(),
            kennungen: [],
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
                spshUsername: faker.internet.userName(),
                kennungen: [],
                emailDomainId: faker.string.uuid(),
            }),
        ).rejects.toThrow(domainError);

        expect(emailAddressRepoMock.save).toHaveBeenCalledTimes(1);
        expect(emailAddressStatusRepoMock.create).toHaveBeenCalledTimes(0);
        expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining('Failed to create email address'));
    });
});
