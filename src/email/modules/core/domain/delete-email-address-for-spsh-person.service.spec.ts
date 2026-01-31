import { vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '../../../../../test/utils/createMock.js';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggingTestModule } from '../../../../../test/utils/logging-test.module.js';
import { EmailAddressRepo } from '../persistence/email-address.repo.js';
import { DeleteEmailsAddressesForSpshPersonService } from './delete-email-adresses-for-spsh-person.service.js';
import { EmailAddress } from './email-address.js';
import { EmailAddressStatusEnum } from '../persistence/email-address-status.entity.js';
import { OxService } from '../../ox/domain/ox.service.js';
import { LdapClientService } from '../../ldap/domain/ldap-client.service.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { Ok, Err } from '../../../../shared/util/result.js';
import { OxNoSuchUserError } from '../../ox/error/ox-no-such-user.error.js';

describe('DeleteEmailsAddressesForSpshPersonService', () => {
    let module: TestingModule;
    let sut: DeleteEmailsAddressesForSpshPersonService;
    let emailAddressRepoMock: DeepMocked<EmailAddressRepo>;
    let oxServiceMock: DeepMocked<OxService>;
    let ldapClientServiceMock: DeepMocked<LdapClientService>;
    let loggerMock: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule],
            providers: [
                DeleteEmailsAddressesForSpshPersonService,
                {
                    provide: EmailAddressRepo,
                    useValue: createMock(EmailAddressRepo),
                },
                {
                    provide: OxService,
                    useValue: createMock(OxService),
                },
                {
                    provide: LdapClientService,
                    useValue: createMock(LdapClientService),
                },
            ],
        })
            .overrideProvider(ClassLogger)
            .useValue(createMock(ClassLogger))
            .compile();

        sut = module.get(DeleteEmailsAddressesForSpshPersonService);
        emailAddressRepoMock = module.get(EmailAddressRepo);
        oxServiceMock = module.get(OxService);
        ldapClientServiceMock = module.get(LdapClientService);
        loggerMock = module.get(ClassLogger);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        vi.resetAllMocks();
        vi.restoreAllMocks();
    });

    function makeEmail(): EmailAddress<true> {
        return new EmailAddress(
            faker.string.uuid(),
            faker.date.past(),
            faker.date.recent(),
            faker.internet.email(),
            0,
            faker.string.uuid(),
            faker.string.uuid(),
            faker.string.uuid(),
            undefined,
            [{ status: EmailAddressStatusEnum.ACTIVE }],
        );
    }

    it('should log and return if no addresses found', async () => {
        emailAddressRepoMock.findBySpshPersonIdSortedByPriorityAsc.mockResolvedValue([]);
        const spshPersonId: string = faker.string.uuid();

        await sut.deleteEmailAddressesForSpshPerson({ spshPersonId });

        expect(loggerMock.info).toHaveBeenCalledWith(
            `No email addresses found for spshPerson ${spshPersonId}. Skipping deletion.`,
        );
        expect(emailAddressRepoMock.save).not.toHaveBeenCalled();
    });

    it('should set status and markedForCron, save all, and delete from OX and LDAP, then delete from DB', async () => {
        const spshPersonId: string = faker.string.uuid();
        const oxUserCounter: string = faker.string.uuid();
        const externalId: string = faker.string.uuid();
        const domain: string = 'example.com';
        const email: EmailAddress<true> = makeEmail();
        email.oxUserCounter = oxUserCounter;
        email.externalId = externalId;
        vi.spyOn(email, 'getDomain').mockReturnValue(domain);

        emailAddressRepoMock.findBySpshPersonIdSortedByPriorityAsc.mockResolvedValue([email]);
        emailAddressRepoMock.save.mockResolvedValue(Ok(email));
        oxServiceMock.deleteUser.mockResolvedValue(Ok(undefined));
        ldapClientServiceMock.deletePerson.mockResolvedValue(Ok(undefined));
        emailAddressRepoMock.delete.mockResolvedValue();

        await sut.deleteEmailAddressesForSpshPerson({ spshPersonId });

        expect(emailAddressRepoMock.save).toHaveBeenCalledWith(
            expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                markedForCron: expect.any(Date),
            }),
        );
        expect(oxServiceMock.deleteUser).toHaveBeenCalledWith(oxUserCounter);
        expect(ldapClientServiceMock.deletePerson).toHaveBeenCalledWith(externalId, domain);
        expect(emailAddressRepoMock.delete).toHaveBeenCalledWith(email);
        expect(loggerMock.info).toHaveBeenCalledWith(
            `Successfully deleted all email addresses for spshPerson ${spshPersonId} from DB.`,
        );
    });

    it('should log and skip OX deletion if oxUserCounter is missing', async () => {
        const spshPersonId: string = faker.string.uuid();
        const externalId: string = faker.string.uuid();
        const domain: string = 'example.com';
        const email: EmailAddress<true> = makeEmail();
        email.oxUserCounter = undefined;
        email.externalId = externalId;
        vi.spyOn(email, 'getDomain').mockReturnValue(domain);

        emailAddressRepoMock.findBySpshPersonIdSortedByPriorityAsc.mockResolvedValue([email]);
        emailAddressRepoMock.save.mockResolvedValue(Ok(email));
        ldapClientServiceMock.deletePerson.mockResolvedValue(Ok(undefined));
        emailAddressRepoMock.delete.mockResolvedValue();

        await sut.deleteEmailAddressesForSpshPerson({ spshPersonId });

        expect(loggerMock.warning).toHaveBeenCalledWith(
            `No oxUserCounter found for spshPerson ${spshPersonId} when deleting email addresses. Skipping Ox deletion`,
        );
        expect(oxServiceMock.deleteUser).not.toHaveBeenCalled();
        expect(emailAddressRepoMock.delete).toHaveBeenCalledWith(email);
    });

    it('should log and skip LDAP deletion if domain is missing', async () => {
        const spshPersonId: string = faker.string.uuid();
        const externalId: string = faker.string.uuid();
        const oxUserCounter: string = faker.string.uuid();
        const email: EmailAddress<true> = makeEmail();
        email.oxUserCounter = oxUserCounter;
        email.externalId = externalId;
        vi.spyOn(email, 'getDomain').mockReturnValue(undefined);

        emailAddressRepoMock.findBySpshPersonIdSortedByPriorityAsc.mockResolvedValue([email]);
        emailAddressRepoMock.save.mockResolvedValue(Ok(email));
        oxServiceMock.deleteUser.mockResolvedValue(Ok(undefined));
        emailAddressRepoMock.delete.mockResolvedValue();

        await sut.deleteEmailAddressesForSpshPerson({ spshPersonId });

        expect(loggerMock.warning).toHaveBeenCalledWith(
            `No externalId or domain found for spshPerson ${spshPersonId} when deleting email addresses. Skipping LDAP deletion`,
        );
        expect(ldapClientServiceMock.deletePerson).not.toHaveBeenCalled();
        expect(emailAddressRepoMock.delete).toHaveBeenCalledWith(email);
    });

    it('should not delete from DB if OX deletion fails', async () => {
        const spshPersonId: string = faker.string.uuid();
        const oxUserCounter: string = faker.string.uuid();
        const externalId: string = faker.string.uuid();
        const domain: string = 'example.com';
        const email: EmailAddress<true> = makeEmail();
        email.oxUserCounter = oxUserCounter;
        email.externalId = externalId;
        vi.spyOn(email, 'getDomain').mockReturnValue(domain);

        emailAddressRepoMock.findBySpshPersonIdSortedByPriorityAsc.mockResolvedValue([email]);
        emailAddressRepoMock.save.mockResolvedValue(Ok(email));
        oxServiceMock.deleteUser.mockResolvedValue(Err(new Error('fail')));
        ldapClientServiceMock.deletePerson.mockResolvedValue(Ok(undefined));

        await sut.deleteEmailAddressesForSpshPerson({ spshPersonId });

        expect(emailAddressRepoMock.delete).not.toHaveBeenCalled();
        expect(loggerMock.warning).toHaveBeenCalledWith(
            `Could not delete all external representations for spshPerson ${spshPersonId}. Keeping email addresses in DB with status TO_BE_DELETED for retry.`,
        );
    });

    it('should not delete from DB if LDAP deletion fails', async () => {
        const spshPersonId: string = faker.string.uuid();
        const oxUserCounter: string = faker.string.uuid();
        const externalId: string = faker.string.uuid();
        const domain: string = 'example.com';
        const email: EmailAddress<true> = makeEmail();
        email.oxUserCounter = oxUserCounter;
        email.externalId = externalId;
        vi.spyOn(email, 'getDomain').mockReturnValue(domain);

        emailAddressRepoMock.findBySpshPersonIdSortedByPriorityAsc.mockResolvedValue([email]);
        emailAddressRepoMock.save.mockResolvedValue(Ok(email));
        oxServiceMock.deleteUser.mockResolvedValue(Ok(undefined));
        ldapClientServiceMock.deletePerson.mockResolvedValue(Err(new Error('fail')));

        await sut.deleteEmailAddressesForSpshPerson({ spshPersonId });

        expect(emailAddressRepoMock.delete).not.toHaveBeenCalled();
        expect(loggerMock.warning).toHaveBeenCalledWith(
            `Could not delete all external representations for spshPerson ${spshPersonId}. Keeping email addresses in DB with status TO_BE_DELETED for retry.`,
        );
    });

    it('should log info if OX user does not exist (OxNoSuchUserError)', async () => {
        const spshPersonId: string = faker.string.uuid();
        const oxUserCounter: string = faker.string.uuid();
        const externalId: string = faker.string.uuid();
        const domain: string = 'example.com';
        const email: EmailAddress<true> = makeEmail();
        email.oxUserCounter = oxUserCounter;
        email.externalId = externalId;
        vi.spyOn(email, 'getDomain').mockReturnValue(domain);

        emailAddressRepoMock.findBySpshPersonIdSortedByPriorityAsc.mockResolvedValue([email]);
        emailAddressRepoMock.save.mockResolvedValue(Ok(email));
        oxServiceMock.deleteUser.mockResolvedValue({ ok: false, error: new OxNoSuchUserError('no such user') });
        ldapClientServiceMock.deletePerson.mockResolvedValue(Ok(undefined));
        emailAddressRepoMock.delete.mockResolvedValue();

        await sut.deleteEmailAddressesForSpshPerson({ spshPersonId });

        expect(loggerMock.info).toHaveBeenCalledWith(
            expect.stringContaining('does not exist in Ox anymore. Continuing deletion process.'),
        );
        expect(emailAddressRepoMock.delete).toHaveBeenCalledWith(email);
    });
});
