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
import { EntityNotFoundError } from '../../../../shared/error/entity-not-found.error.js';
import { OxError } from '../../../../shared/error/ox.error.js';
import { OxPrimaryMailAlreadyExistsError } from '../../ox/error/ox-primary-mail-already-exists.error.js';

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

        // Don't retry by default
        sut.RETRY_ATTEMPTS = 1;
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

        it('should not change priorities if the email is already active', async () => {
            const domain: EmailDomain<true> = await setupDomain();
            const params: SetEmailAddressForSpshPersonParams = makeParams(domain.spshServiceProviderId);
            const oldOxId: string = faker.string.numeric(5);

            const email: EmailAddress<true> = await setupEmailWithStatus(
                EmailAddress.createNew({
                    address: faker.internet.email(),
                    externalId: params.spshPersonId,
                    oxUserCounter: oldOxId,
                    priority: 0,
                    spshPersonId: params.spshPersonId,
                    markedForCron: faker.date.future(),
                }),
                EmailAddressStatusEnum.FAILED,
            );

            emailAddressGeneratorMock.isEqualIgnoreCount.mockReturnValueOnce(true);
            oxSendServiceMock.send.mockResolvedValueOnce(Ok(createMock())); // Check if person exists
            oxSendServiceMock.send.mockResolvedValueOnce(Ok(createMock())); // Update person
            ldapClientServiceMock.isPersonExisting.mockResolvedValueOnce(Ok(true)); // Check if person exists
            ldapClientServiceMock.updatePerson.mockResolvedValueOnce(Ok(createMock()));

            const shiftPrioritiesSpy: jest.SpyInstance = jest.spyOn(emailAddressRepo, 'shiftPriorities');

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

            expect(shiftPrioritiesSpy).not.toHaveBeenCalled();
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

        it('should error when updating of priorities fails', async () => {
            const domain: EmailDomain<true> = await setupDomain();
            const params: SetEmailAddressForSpshPersonParams = makeParams(domain.spshServiceProviderId);
            const expectedEmailAddress: string = `${params.firstName}.${params.lastName}@${domain.domain}`;

            emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValueOnce(Ok(expectedEmailAddress));
            const error: EntityNotFoundError = new EntityNotFoundError('E-Mail');
            jest.spyOn(emailAddressRepo, 'shiftPriorities').mockResolvedValueOnce(Err(error));

            await expect(() => sut.setEmailAddressForSpshPerson(params)).rejects.toBeInstanceOf(
                EmailAddressGenerationAttemptsExceededError,
            );

            const emailResult: AddressWithStatusesDescDto[] =
                await emailAddressRepo.findAllEmailAddressesWithStatusesDescBySpshPersonId(params.spshPersonId);

            expect(emailResult).toHaveLength(1);
            expect(emailResult[0]?.statuses[0]).toEqual(
                expect.objectContaining({
                    status: EmailAddressStatusEnum.FAILED,
                }),
            );
        });

        describe('getOrCreateAvailableEmail', () => {
            it('should return error if generation failed', async () => {
                const domain: EmailDomain<true> = await setupDomain();
                const params: SetEmailAddressForSpshPersonParams = makeParams(domain.spshServiceProviderId);

                const error: Error = new Error('test error');
                emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValueOnce(Err(error));

                await expect(() => sut.setEmailAddressForSpshPerson(params)).rejects.toBeInstanceOf(
                    EmailAddressGenerationAttemptsExceededError,
                );

                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    `Could not determine available e-mail`,
                    error,
                );
            });
        });

        describe('upsertOxUser', () => {
            let domain: EmailDomain<true>;
            let params: SetEmailAddressForSpshPersonParams;
            let address: string;

            beforeEach(async () => {
                domain = await setupDomain();
                params = makeParams(domain.spshServiceProviderId);
                address = `${params.firstName}.${params.lastName}@${domain.domain}`;

                emailAddressGeneratorMock.isEqualIgnoreCount.mockReturnValue(false);
                emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValueOnce(Ok(address));
            });

            it('should error when exists check fails', async () => {
                // E-Mails with ox id needs to exist
                await setupEmailWithStatus(
                    EmailAddress.createNew({
                        priority: 0,
                        spshPersonId: params.spshPersonId,
                        address: faker.internet.email(),
                        externalId: params.spshPersonId,
                        oxUserCounter: faker.string.numeric(5),
                    }),
                    EmailAddressStatusEnum.ACTIVE,
                );
                const error: OxError = new OxError('test error');
                oxSendServiceMock.send.mockResolvedValueOnce(Err(error));

                await expect(() => sut.setEmailAddressForSpshPerson(params)).rejects.toBeInstanceOf(
                    EmailAddressGenerationAttemptsExceededError,
                );

                const emailResult: AddressWithStatusesDescDto[] =
                    await emailAddressRepo.findAllEmailAddressesWithStatusesDescBySpshPersonId(params.spshPersonId);
                emailResult.sort(
                    (a: AddressWithStatusesDescDto, b: AddressWithStatusesDescDto) =>
                        a.emailAddress.priority - b.emailAddress.priority,
                );

                expect(emailResult).toHaveLength(2);
                expect(emailResult[0]?.statuses[0]).toEqual(
                    expect.objectContaining({
                        status: EmailAddressStatusEnum.FAILED,
                    }),
                );
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(`Error while updating ox user`, error);
            });

            it('should error when modify fails', async () => {
                // E-Mails with ox id needs to exist
                await setupEmailWithStatus(
                    EmailAddress.createNew({
                        priority: 0,
                        spshPersonId: params.spshPersonId,
                        address: faker.internet.email(),
                        externalId: params.spshPersonId,
                        oxUserCounter: faker.string.numeric(5),
                    }),
                    EmailAddressStatusEnum.ACTIVE,
                );
                const error: OxError = new OxError('test error');
                oxSendServiceMock.send.mockResolvedValueOnce(Ok(true)); // exists
                oxSendServiceMock.send.mockResolvedValueOnce(Err(error)); // modify

                await expect(() => sut.setEmailAddressForSpshPerson(params)).rejects.toBeInstanceOf(
                    EmailAddressGenerationAttemptsExceededError,
                );

                const emailResult: AddressWithStatusesDescDto[] =
                    await emailAddressRepo.findAllEmailAddressesWithStatusesDescBySpshPersonId(params.spshPersonId);
                emailResult.sort(
                    (a: AddressWithStatusesDescDto, b: AddressWithStatusesDescDto) =>
                        a.emailAddress.priority - b.emailAddress.priority,
                );

                expect(emailResult).toHaveLength(2);
                expect(emailResult[0]?.statuses[0]).toEqual(
                    expect.objectContaining({
                        status: EmailAddressStatusEnum.FAILED,
                    }),
                );
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(`Error while updating ox user`, error);
            });

            it('should error when create fails', async () => {
                const error: OxError = new OxError('test error');
                oxSendServiceMock.send.mockResolvedValueOnce(Err(error)); // modify

                await expect(() => sut.setEmailAddressForSpshPerson(params)).rejects.toBeInstanceOf(
                    EmailAddressGenerationAttemptsExceededError,
                );

                const emailResult: AddressWithStatusesDescDto[] =
                    await emailAddressRepo.findAllEmailAddressesWithStatusesDescBySpshPersonId(params.spshPersonId);
                emailResult.sort(
                    (a: AddressWithStatusesDescDto, b: AddressWithStatusesDescDto) =>
                        a.emailAddress.priority - b.emailAddress.priority,
                );

                expect(emailResult).toHaveLength(1);
                expect(emailResult[0]?.statuses[0]).toEqual(
                    expect.objectContaining({
                        status: EmailAddressStatusEnum.FAILED,
                    }),
                );
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(`Error while updating ox user`, error);
            });

            it('should set status to ALREADY_IN_OX if that error was returned', async () => {
                const error: OxPrimaryMailAlreadyExistsError = new OxPrimaryMailAlreadyExistsError('test error');
                oxSendServiceMock.send.mockResolvedValueOnce(Err(error)); // modify

                await expect(() => sut.setEmailAddressForSpshPerson(params)).rejects.toBeInstanceOf(
                    EmailAddressGenerationAttemptsExceededError,
                );

                const emailResult: AddressWithStatusesDescDto[] =
                    await emailAddressRepo.findAllEmailAddressesWithStatusesDescBySpshPersonId(params.spshPersonId);
                emailResult.sort(
                    (a: AddressWithStatusesDescDto, b: AddressWithStatusesDescDto) =>
                        a.emailAddress.priority - b.emailAddress.priority,
                );

                expect(emailResult).toHaveLength(1);
                expect(emailResult[0]?.statuses[0]).toEqual(
                    expect.objectContaining({
                        status: EmailAddressStatusEnum.EXISTS_ONLY_IN_OX,
                    }),
                );
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(`Error while updating ox user`, error);
            });
        });

        describe('upsertLdap', () => {
            let domain: EmailDomain<true>;
            let params: SetEmailAddressForSpshPersonParams;
            let expectedEmailAddress: string;

            beforeEach(async () => {
                domain = await setupDomain();
                params = makeParams(domain.spshServiceProviderId);
                expectedEmailAddress = `${params.firstName}.${params.lastName}@${domain.domain}`;

                emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValueOnce(Ok(expectedEmailAddress));

                oxSendServiceMock.send.mockResolvedValueOnce(Ok({ id: faker.string.numeric(5) }));
            });

            it('should error when exists-check fails', async () => {
                const error: Error = new Error('Test Error');
                ldapClientServiceMock.isPersonExisting.mockResolvedValueOnce(Err(error));

                await expect(() => sut.setEmailAddressForSpshPerson(params)).rejects.toBeInstanceOf(
                    EmailAddressGenerationAttemptsExceededError,
                );

                const emailResult: AddressWithStatusesDescDto[] =
                    await emailAddressRepo.findAllEmailAddressesWithStatusesDescBySpshPersonId(params.spshPersonId);

                expect(emailResult).toHaveLength(1);
                expect(emailResult[0]?.statuses[0]).toEqual(
                    expect.objectContaining({
                        status: EmailAddressStatusEnum.FAILED,
                    }),
                );
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    `Error while updating/creating LDAP user`,
                    error,
                );
            });

            it('should error when ldap upsert create fails', async () => {
                ldapClientServiceMock.isPersonExisting.mockResolvedValueOnce(Ok(false));
                const error: Error = new Error('Test Error');
                ldapClientServiceMock.createPerson.mockResolvedValueOnce(Err(error));

                await expect(() => sut.setEmailAddressForSpshPerson(params)).rejects.toBeInstanceOf(
                    EmailAddressGenerationAttemptsExceededError,
                );

                const emailResult: AddressWithStatusesDescDto[] =
                    await emailAddressRepo.findAllEmailAddressesWithStatusesDescBySpshPersonId(params.spshPersonId);

                expect(emailResult).toHaveLength(1);
                expect(emailResult[0]?.statuses[0]).toEqual(
                    expect.objectContaining({
                        status: EmailAddressStatusEnum.FAILED,
                    }),
                );
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    `Error while updating/creating LDAP user`,
                    error,
                );
            });

            it('should error when ldap upsert update fails', async () => {
                ldapClientServiceMock.isPersonExisting.mockResolvedValueOnce(Ok(true));
                const error: Error = new Error('Test Error');
                ldapClientServiceMock.updatePerson.mockResolvedValueOnce(Err(error));

                await expect(() => sut.setEmailAddressForSpshPerson(params)).rejects.toBeInstanceOf(
                    EmailAddressGenerationAttemptsExceededError,
                );

                const emailResult: AddressWithStatusesDescDto[] =
                    await emailAddressRepo.findAllEmailAddressesWithStatusesDescBySpshPersonId(params.spshPersonId);

                expect(emailResult).toHaveLength(1);
                expect(emailResult[0]?.statuses[0]).toEqual(
                    expect.objectContaining({
                        status: EmailAddressStatusEnum.FAILED,
                    }),
                );
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    `Error while updating/creating LDAP user`,
                    error,
                );
            });
        });

        it('should log on unknown error', async () => {
            const domain: EmailDomain<true> = await setupDomain();
            const params: SetEmailAddressForSpshPersonParams = makeParams(domain.spshServiceProviderId);

            const error: Error = new Error('Test Error');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(sut as any, 'createOrUpdateEmail').mockRejectedValueOnce(error);

            await expect(() => sut.setEmailAddressForSpshPerson(params)).rejects.toBeInstanceOf(
                EmailAddressGenerationAttemptsExceededError,
            );

            expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                `SET EMAIL FOR SPSHPERSONID: ${params.spshPersonId} - Unknown error`,
                error,
            );
        });
    });
});
