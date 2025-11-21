import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseTestModule } from '../../../../../test/utils/database-test.module.js';
import { EmailConfigTestModule } from '../../../../../test/utils/email-config-test.module.js';
import { LoggingTestModule } from '../../../../../test/utils/logging-test.module.js';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../../../test/utils/timeouts.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { DomainError } from '../../../../shared/error/domain.error.js';
import { Err, Ok } from '../../../../shared/util/result.js';
import { LdapClientService } from '../../ldap/domain/ldap-client.service.js';
import { OxSendService } from '../../ox/domain/ox-send.service.js';
import { OxService } from '../../ox/domain/ox.service.js';
import { AddressWithStatusesDescDto } from '../api/dtos/address-with-statuses/address-with-statuses-desc.dto.js';
import { SetEmailAddressForSpshPersonParams } from '../api/dtos/params/set-email-address-for-spsh-person.params.js';
import { EmailAddressGenerationAttemptsExceededError } from '../error/email-address-generation-attempts-exceeds.error.js';
import { EmailDomainNotFoundError } from '../error/email-domain-not-found.error.js';
import { EmailUpdateInProgressError } from '../error/email-update-in-progress.error.js';
import { EmailAddressStatusEnum } from '../persistence/email-address-status.entity.js';
import { EmailAddressStatusRepo } from '../persistence/email-address-status.repo.js';
import { EmailAddressRepo } from '../persistence/email-address.repo.js';
import { EmailDomainRepo } from '../persistence/email-domain.repo.js';
import { EmailAddressGenerator } from './email-address-generator.js';
import { EmailAddressStatus } from './email-address-status.js';
import { EmailAddress } from './email-address.js';
import { EmailDomain } from './email-domain.js';
import { SetEmailAddressForSpshPersonService } from './set-email-address-for-spsh-person.service.js';

describe('SetEmailAddressForSpshPersonService', () => {
    let module: TestingModule;
    let sut: SetEmailAddressForSpshPersonService;
    let orm: MikroORM;

    let emailAddressRepo: EmailAddressRepo;
    let emailDomainRepo: EmailDomainRepo;
    let emailAddressStatusRepo: EmailAddressStatusRepo;

    let loggerMock: DeepMocked<ClassLogger>;
    let emailAddressGeneratorMock: DeepMocked<EmailAddressGenerator>;
    let oxSendServiceMock: DeepMocked<OxSendService>;
    let ldapClientServiceMock: DeepMocked<LdapClientService>;
    let oxServiceMock: DeepMocked<OxService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                LoggingTestModule,
                EmailConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
            ],
            providers: [
                SetEmailAddressForSpshPersonService,
                EmailAddressRepo,
                EmailDomainRepo,
                EmailAddressStatusRepo,
                {
                    provide: EmailAddressGenerator,
                    useValue: createMock<EmailAddressGenerator>(),
                },
                {
                    provide: OxService,
                    useValue: createMock<OxService>(),
                },
                {
                    provide: OxSendService,
                    useValue: createMock<OxSendService>(),
                },
                {
                    provide: LdapClientService,
                    useValue: createMock<LdapClientService>(),
                },
            ],
        }).compile();

        sut = module.get(SetEmailAddressForSpshPersonService);
        orm = module.get(MikroORM);

        emailAddressRepo = module.get(EmailAddressRepo);
        emailDomainRepo = module.get(EmailDomainRepo);
        emailAddressStatusRepo = module.get(EmailAddressStatusRepo);

        loggerMock = module.get(ClassLogger);
        emailAddressGeneratorMock = module.get(EmailAddressGenerator);
        oxSendServiceMock = module.get(OxSendService);
        ldapClientServiceMock = module.get(LdapClientService);
        oxServiceMock = module.get(OxService);

        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);

        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    function makeParams(spshServiceProviderId: string): SetEmailAddressForSpshPersonParams {
        return {
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            kennungen: [],
            spshPersonId: faker.string.uuid(),
            spshServiceProviderId,
            spshUsername: faker.internet.userName(),
        };
    }

    async function setupDomain(): Promise<EmailDomain<true>> {
        return await emailDomainRepo.create(
            EmailDomain.createNew({
                domain: faker.internet.domainName(),
                spshServiceProviderId: faker.string.uuid(),
            }),
        );
    }

    async function setupEmailWithStatus(
        mail: EmailAddress<false>,
        status: EmailAddressStatusEnum,
    ): Promise<EmailAddress<true>> {
        const result: EmailAddress<true> | DomainError = await emailAddressRepo.save(mail);

        if (result instanceof DomainError) {
            throw result;
        }

        await emailAddressStatusRepo.create(
            EmailAddressStatus.createNew({
                emailAddressId: result.id,
                status,
            }),
        );

        return result;
    }

    describe('setEmailAddressForSpshPerson', () => {
        beforeEach(() => {
            // Don't retry by default
            sut.RETRY_ATTEMPTS = 1;
        });

        it('should create new email if no other mail exists', async () => {
            const domain: EmailDomain<true> = await setupDomain();
            const params: SetEmailAddressForSpshPersonParams = makeParams(domain.spshServiceProviderId);
            const newOxId: string = faker.string.numeric(5);
            const expectedEmailAddress: string = `${params.firstName}.${params.lastName}@${domain.domain}`;

            emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValueOnce(Ok(expectedEmailAddress));
            oxSendServiceMock.send.mockResolvedValueOnce(Ok({ id: newOxId }));
            ldapClientServiceMock.isPersonExisting.mockResolvedValueOnce(Ok(false));
            ldapClientServiceMock.createPerson.mockResolvedValueOnce(Ok(createMock()));

            await sut.setEmailAddressForSpshPerson(params);

            expect(oxServiceMock.createCreateUserAction).toHaveBeenCalledWith({
                username: params.spshPersonId,
                displayName: params.spshUsername,
                firstname: params.firstName,
                lastname: params.lastName,
                primaryEmail: expectedEmailAddress,
            });
            expect(ldapClientServiceMock.isPersonExisting).toHaveBeenCalledWith(params.spshPersonId, domain.domain);
            expect(loggerMock.info).toHaveBeenCalledWith(
                `SET EMAIL FOR SPSHPERSONID: ${params.spshPersonId} - Success`,
            );
        });

        it('should reactivate existing email', async () => {
            const domain: EmailDomain<true> = await setupDomain();
            const params: SetEmailAddressForSpshPersonParams = makeParams(domain.spshServiceProviderId);
            const oldOxId: string = faker.string.numeric(5);

            const email: EmailAddress<true> = await setupEmailWithStatus(
                EmailAddress.createNew({
                    address: faker.internet.email(),
                    externalId: params.spshPersonId,
                    oxUserCounter: oldOxId,
                    priority: 2,
                    spshPersonId: params.spshPersonId,
                    markedForCron: faker.date.future(),
                }),
                EmailAddressStatusEnum.DEACTIVE,
            );

            emailAddressGeneratorMock.isEqualIgnoreCount.mockReturnValueOnce(true);
            oxSendServiceMock.send.mockResolvedValueOnce(Ok(createMock())); // Check if person exists
            oxSendServiceMock.send.mockResolvedValueOnce(Ok(createMock())); // Update person
            ldapClientServiceMock.isPersonExisting.mockResolvedValueOnce(Ok(true)); // Check if person exists
            ldapClientServiceMock.updatePerson.mockResolvedValueOnce(Ok(createMock()));

            await sut.setEmailAddressForSpshPerson(params);

            const emailResult: AddressWithStatusesDescDto[] =
                await emailAddressRepo.findAllEmailAddressesWithStatusesDescBySpshPersonId(params.spshPersonId);

            expect(emailResult).toHaveLength(1);
            expect(emailResult[0]?.emailAddress).toEqual(
                expect.objectContaining({
                    id: email.id,
                    address: email.address,
                    priority: 0,
                    spshPersonId: params.spshPersonId,
                    oxUserCounter: oldOxId,
                    externalId: params.spshPersonId,
                    markedForCron: undefined,
                }),
            );
            expect(emailResult[0]?.statuses[0]).toEqual(
                expect.objectContaining({
                    emailAddressId: email.id,
                    status: EmailAddressStatusEnum.ACTIVE,
                }),
            );

            expect(oxServiceMock.createChangeUserAction).toHaveBeenCalledWith(
                oldOxId,
                params.spshPersonId,
                expect.arrayContaining([email.address]),
                params.firstName,
                params.lastName,
                params.spshUsername,
                email.address,
                email.address,
            );
            expect(ldapClientServiceMock.isPersonExisting).toHaveBeenCalledWith(params.spshPersonId, domain.domain);
            expect(ldapClientServiceMock.updatePerson).toHaveBeenCalledWith(
                {
                    firstName: params.firstName,
                    lastName: params.lastName,
                    username: params.spshUsername,
                    uid: params.spshPersonId,
                },
                domain.domain,
                email.address,
                undefined,
            );
        });

        it('should throw error if domain can not be found', async () => {
            await expect(() =>
                sut.setEmailAddressForSpshPerson(makeParams(faker.string.uuid())),
            ).rejects.toBeInstanceOf(EmailDomainNotFoundError);
        });

        it('should throw error if user already has a pending e-mail', async () => {
            const domain: EmailDomain<true> = await setupDomain();
            const params: SetEmailAddressForSpshPersonParams = makeParams(domain.spshServiceProviderId);

            await setupEmailWithStatus(
                EmailAddress.createNew({
                    address: faker.internet.email(),
                    externalId: params.spshPersonId,
                    oxUserCounter: undefined,
                    priority: 0,
                    spshPersonId: params.spshPersonId,
                }),
                EmailAddressStatusEnum.PENDING,
            );

            await expect(() => sut.setEmailAddressForSpshPerson(params)).rejects.toBeInstanceOf(
                EmailUpdateInProgressError,
            );
        });

        it('should throw error if new email can not be determined', async () => {
            const domain: EmailDomain<true> = await setupDomain();
            const params: SetEmailAddressForSpshPersonParams = makeParams(domain.spshServiceProviderId);
            const generationError: Error = new Error('Could not generate mail');

            // User has no emails
            emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValueOnce(Err(generationError));

            await expect(() => sut.setEmailAddressForSpshPerson(params)).rejects.toBeInstanceOf(
                EmailAddressGenerationAttemptsExceededError,
            );

            expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                `SET EMAIL FOR SPSHPERSONID: ${params.spshPersonId} - Error while creating or updating the email`,
                generationError,
            );
        });
    });
});
