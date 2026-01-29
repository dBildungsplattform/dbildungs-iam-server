import { Mock, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '../../../../../test/utils/createMock.js';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseTestModule } from '../../../../../test/utils/database-test.module.js';
import { EmailConfigTestModule } from '../../../../../test/utils/email-config-test.module.js';
import { LoggingTestModule } from '../../../../../test/utils/logging-test.module.js';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../../../test/utils/timeouts.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { DomainError } from '../../../../shared/error/domain.error.js';
import { Err, Ok } from '../../../../shared/util/result.js';
import { LdapClientService, PersonData } from '../../ldap/domain/ldap-client.service.js';
import { OxSendService } from '../../ox/domain/ox-send.service.js';
import { OxService } from '../../ox/domain/ox.service.js';
import { SetEmailAddressForSpshPersonBodyParams } from '../api/dtos/params/set-email-address-for-spsh-person.bodyparams.js';
import { EmailAddressGenerationAttemptsExceededError } from '../error/email-address-generation-attempts-exceeds.error.js';
import { EmailDomainNotFoundError } from '../error/email-domain-not-found.error.js';
import { EmailUpdateInProgressError } from '../error/email-update-in-progress.error.js';
import { EmailAddressStatusEnum } from '../persistence/email-address-status.entity.js';
import { EmailAddressRepo } from '../persistence/email-address.repo.js';
import { EmailDomainRepo } from '../persistence/email-domain.repo.js';
import { EmailAddressGenerator } from './email-address-generator.js';
import { EmailAddress } from './email-address.js';
import { EmailDomain } from './email-domain.js';
import { SetEmailAddressForSpshPersonService } from './set-email-address-for-spsh-person.service.js';
import { EntityNotFoundError } from '../../../../shared/error/entity-not-found.error.js';
import { OxError } from '../../../../shared/error/ox.error.js';
import { OxPrimaryMailAlreadyExistsError } from '../../ox/error/ox-primary-mail-already-exists.error.js';
import { expectOkResult } from '../../../../../test/utils/test-types.js';
import { EmailAddressNotFoundError } from '../error/email-address-not-found.error.js';
import { SetEmailAddressForSpshPersonPathParams } from '../api/dtos/params/set-email-address-for-spsh-person.pathparams.js';

describe('SetEmailAddressForSpshPersonService', () => {
    let module: TestingModule;
    let sut: SetEmailAddressForSpshPersonService;
    let orm: MikroORM;

    let emailAddressRepo: EmailAddressRepo;
    let emailDomainRepo: EmailDomainRepo;

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
                {
                    provide: EmailAddressGenerator,
                    useValue: createMock(EmailAddressGenerator),
                },
                {
                    provide: OxService,
                    useValue: createMock(OxService),
                },
                {
                    provide: OxSendService,
                    useValue: createMock(OxSendService),
                },
                {
                    provide: LdapClientService,
                    useValue: createMock(LdapClientService),
                },
            ],
        }).compile();

        sut = module.get(SetEmailAddressForSpshPersonService);
        orm = module.get(MikroORM);

        emailAddressRepo = module.get(EmailAddressRepo);
        emailDomainRepo = module.get(EmailDomainRepo);

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

        vi.resetAllMocks();
        vi.restoreAllMocks();

        // Don't retry by default
        sut.RETRY_ATTEMPTS = 1;
    });

    function makeParams(
        spshServiceProviderId: string,
    ): [SetEmailAddressForSpshPersonPathParams, SetEmailAddressForSpshPersonBodyParams] {
        return [
            {
                spshPersonId: faker.string.uuid(),
            },
            {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                kennungen: [],
                spshServiceProviderId,
                spshUsername: faker.internet.userName(),
            },
        ];
    }

    async function setupDomain(): Promise<EmailDomain<true>> {
        return await emailDomainRepo.create(
            EmailDomain.createNew({
                domain: faker.internet.domainName(),
                spshServiceProviderId: faker.string.uuid(),
            }),
        );
    }

    async function setupEmail(mail: EmailAddress<false>): Promise<EmailAddress<true>> {
        const result: Result<EmailAddress<true>, DomainError> = await emailAddressRepo.save(mail);

        expectOkResult(result);

        return result.value;
    }

    describe('setEmailAddressForSpshPerson', () => {
        it('should create new email if no other mail exists', async () => {
            const domain: EmailDomain<true> = await setupDomain();
            const [pathParams, bodyParams]: [
                SetEmailAddressForSpshPersonPathParams,
                SetEmailAddressForSpshPersonBodyParams,
            ] = makeParams(domain.spshServiceProviderId);
            const newOxId: string = faker.string.numeric(5);
            const expectedEmailAddress: string = `${bodyParams.firstName}.${bodyParams.lastName}@${domain.domain}`;

            emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValueOnce(Ok(expectedEmailAddress));
            oxSendServiceMock.send.mockResolvedValueOnce(Ok({ id: newOxId }));
            ldapClientServiceMock.isPersonExisting.mockResolvedValueOnce(Ok(false));
            ldapClientServiceMock.createPerson.mockResolvedValueOnce(
                Ok({
                    firstName: bodyParams.firstName,
                    lastName: bodyParams.lastName,
                    username: bodyParams.spshUsername,
                    uid: pathParams.spshPersonId,
                }),
            );

            await sut.setEmailAddressForSpshPerson({ ...pathParams, ...bodyParams });

            expect(oxServiceMock.createCreateUserAction).toHaveBeenCalledWith({
                username: pathParams.spshPersonId,
                displayName: bodyParams.spshUsername,
                firstname: bodyParams.firstName,
                lastname: bodyParams.lastName,
                primaryEmail: expectedEmailAddress,
            });
            expect(ldapClientServiceMock.isPersonExisting).toHaveBeenCalledWith(pathParams.spshPersonId, domain.domain);
            expect(loggerMock.info).toHaveBeenCalledWith(
                `SET EMAIL FOR SPSHPERSONID: ${pathParams.spshPersonId} - Success`,
            );
        });

        it('should reactivate old email', async () => {
            const domain: EmailDomain<true> = await setupDomain();
            const [pathParams, bodyParams]: [
                SetEmailAddressForSpshPersonPathParams,
                SetEmailAddressForSpshPersonBodyParams,
            ] = makeParams(domain.spshServiceProviderId);
            const oldOxId: string = faker.string.numeric(5);

            const email1: EmailAddress<true> = await setupEmail(
                EmailAddress.createNew({
                    address: faker.internet.email(),
                    externalId: pathParams.spshPersonId,
                    oxUserCounter: oldOxId,
                    priority: 0,
                    spshPersonId: pathParams.spshPersonId,
                    markedForCron: undefined,
                    sortedStatuses: [{ status: EmailAddressStatusEnum.ACTIVE }],
                }),
            );

            const email2: EmailAddress<true> = await setupEmail(
                EmailAddress.createNew({
                    address: faker.internet.email(),
                    externalId: pathParams.spshPersonId,
                    oxUserCounter: oldOxId,
                    priority: 1,
                    spshPersonId: pathParams.spshPersonId,
                    markedForCron: faker.date.future(),
                    sortedStatuses: [{ status: EmailAddressStatusEnum.ACTIVE }],
                }),
            );

            const email3: EmailAddress<true> = await setupEmail(
                EmailAddress.createNew({
                    address: faker.internet.email(),
                    externalId: pathParams.spshPersonId,
                    oxUserCounter: oldOxId,
                    priority: 2,
                    spshPersonId: pathParams.spshPersonId,
                    markedForCron: faker.date.future(),
                    sortedStatuses: [{ status: EmailAddressStatusEnum.DEACTIVE }],
                }),
            );

            // Third email should be reactiveated
            emailAddressGeneratorMock.isEqualIgnoreCount.mockReturnValueOnce(false);
            emailAddressGeneratorMock.isEqualIgnoreCount.mockReturnValueOnce(false);
            emailAddressGeneratorMock.isEqualIgnoreCount.mockReturnValueOnce(true);

            oxSendServiceMock.send.mockResolvedValueOnce(Ok({})); // Check if person exists
            oxSendServiceMock.send.mockResolvedValueOnce(Ok({})); // Update person
            ldapClientServiceMock.isPersonExisting.mockResolvedValueOnce(Ok(true)); // Check if person exists
            ldapClientServiceMock.updatePerson.mockResolvedValueOnce(Ok({} as PersonData));

            await sut.setEmailAddressForSpshPerson({ ...pathParams, ...bodyParams });

            const emailResult: EmailAddress<true>[] = await emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(
                pathParams.spshPersonId,
            );

            expect(emailResult).toHaveLength(3);
            expect(emailResult[0]).toEqual(
                expect.objectContaining({
                    id: email3.id,
                    address: email3.address,
                    priority: 0,
                    spshPersonId: pathParams.spshPersonId,
                    oxUserCounter: oldOxId,
                    externalId: pathParams.spshPersonId,
                    markedForCron: undefined,
                }),
            );
            expect(emailResult[0]?.getStatus()).toEqual(EmailAddressStatusEnum.ACTIVE);
            expect(emailResult[1]).toEqual(
                expect.objectContaining({
                    id: email1.id,
                    address: email1.address,
                    priority: 1,
                    spshPersonId: pathParams.spshPersonId,
                    oxUserCounter: oldOxId,
                    externalId: pathParams.spshPersonId,
                    markedForCron: expect.any(Date) as Date,
                }),
            );
            expect(emailResult[1]?.getStatus()).toEqual(EmailAddressStatusEnum.ACTIVE);
            expect(emailResult[2]).toEqual(
                expect.objectContaining({
                    id: email2.id,
                    address: email2.address,
                    priority: 2,
                    spshPersonId: pathParams.spshPersonId,
                    oxUserCounter: oldOxId,
                    externalId: pathParams.spshPersonId,
                    markedForCron: expect.any(Date) as Date,
                }),
            );
            expect(emailResult[2]?.getStatus()).toEqual(EmailAddressStatusEnum.DEACTIVE);

            expect(oxServiceMock.createChangeUserAction).toHaveBeenCalledWith(
                oldOxId,
                pathParams.spshPersonId,
                expect.arrayContaining([email3.address]),
                bodyParams.firstName,
                bodyParams.lastName,
                bodyParams.spshUsername,
                email3.address,
                email3.address,
            );
            expect(ldapClientServiceMock.isPersonExisting).toHaveBeenCalledWith(pathParams.spshPersonId, domain.domain);
            expect(ldapClientServiceMock.updatePerson).toHaveBeenCalledWith(
                {
                    firstName: bodyParams.firstName,
                    lastName: bodyParams.lastName,
                    username: bodyParams.spshUsername,
                    uid: pathParams.spshPersonId,
                },
                domain.domain,
                email3.address,
                email1.address,
            );
        });

        it('should shift failed email from prio 0', async () => {
            const domain: EmailDomain<true> = await setupDomain();
            const [pathParams, bodyParams]: [
                SetEmailAddressForSpshPersonPathParams,
                SetEmailAddressForSpshPersonBodyParams,
            ] = makeParams(domain.spshServiceProviderId);
            const oldOxId: string = faker.string.numeric(5);
            const expectedEmailAddress: string = `${bodyParams.firstName}.${bodyParams.lastName}@${domain.domain}`;

            const email: EmailAddress<true> = await setupEmail(
                EmailAddress.createNew({
                    address: faker.internet.email(),
                    externalId: pathParams.spshPersonId,
                    oxUserCounter: oldOxId,
                    priority: 0,
                    spshPersonId: pathParams.spshPersonId,
                    markedForCron: undefined,
                    sortedStatuses: [{ status: EmailAddressStatusEnum.FAILED }],
                }),
            );

            emailAddressGeneratorMock.isEqualIgnoreCount.mockReturnValueOnce(false);
            emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValueOnce(Ok(expectedEmailAddress));
            oxSendServiceMock.send.mockResolvedValueOnce(Ok({})); // Check if person exists
            oxSendServiceMock.send.mockResolvedValueOnce(Ok({})); // Update person
            ldapClientServiceMock.isPersonExisting.mockResolvedValueOnce(Ok(true)); // Check if person exists
            ldapClientServiceMock.updatePerson.mockResolvedValueOnce(Ok({} as PersonData));

            await sut.setEmailAddressForSpshPerson({ ...pathParams, ...bodyParams });

            const emailResult: EmailAddress<true>[] = await emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(
                pathParams.spshPersonId,
            );

            expect(emailResult).toHaveLength(2);
            expect(emailResult[0]).toEqual(
                expect.objectContaining({
                    address: expectedEmailAddress,
                    priority: 0,
                    spshPersonId: pathParams.spshPersonId,
                    oxUserCounter: oldOxId,
                    externalId: pathParams.spshPersonId,
                    markedForCron: undefined,
                }),
            );
            expect(emailResult[0]?.getStatus()).toEqual(EmailAddressStatusEnum.ACTIVE);
            expect(emailResult[1]).toEqual(
                expect.objectContaining({
                    address: email.address,
                    priority: 2,
                    spshPersonId: pathParams.spshPersonId,
                    oxUserCounter: oldOxId,
                    externalId: pathParams.spshPersonId,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    markedForCron: expect.any(Date),
                }),
            );
            expect(emailResult[1]?.getStatus()).toEqual(EmailAddressStatusEnum.FAILED);
        });

        it('should error if shifting of old failed address fails', async () => {
            const domain: EmailDomain<true> = await setupDomain();
            const [pathParams, bodyParams]: [
                SetEmailAddressForSpshPersonPathParams,
                SetEmailAddressForSpshPersonBodyParams,
            ] = makeParams(domain.spshServiceProviderId);
            const oldOxId: string = faker.string.numeric(5);
            const expectedEmailAddress: string = `${bodyParams.firstName}.${bodyParams.lastName}@${domain.domain}`;

            await setupEmail(
                EmailAddress.createNew({
                    address: faker.internet.email(),
                    externalId: pathParams.spshPersonId,
                    oxUserCounter: oldOxId,
                    priority: 0,
                    spshPersonId: pathParams.spshPersonId,
                    markedForCron: undefined,
                    sortedStatuses: [{ status: EmailAddressStatusEnum.FAILED }],
                }),
            );

            emailAddressGeneratorMock.isEqualIgnoreCount.mockReturnValueOnce(false);
            emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValueOnce(Ok(expectedEmailAddress));
            oxSendServiceMock.send.mockResolvedValueOnce(Ok({})); // Check if person exists
            oxSendServiceMock.send.mockResolvedValueOnce(Ok({})); // Update person
            ldapClientServiceMock.isPersonExisting.mockResolvedValueOnce(Ok(true)); // Check if person exists
            ldapClientServiceMock.updatePerson.mockResolvedValueOnce(Ok({} as PersonData));

            const error: EntityNotFoundError = new EntityNotFoundError('test error');
            vi.spyOn(emailAddressRepo, 'shiftPriorities').mockResolvedValueOnce(Err(error));

            await expect(() =>
                sut.setEmailAddressForSpshPerson({ ...pathParams, ...bodyParams }),
            ).rejects.toBeInstanceOf(EmailAddressGenerationAttemptsExceededError);

            expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                `Error while updating e-mail priorities for prio 0 mail`,
                error,
            );
        });

        it('should not change priorities if the email has prio 0 and the status is not ALREADY_IN_OX', async () => {
            const domain: EmailDomain<true> = await setupDomain();
            const [pathParams, bodyParams]: [
                SetEmailAddressForSpshPersonPathParams,
                SetEmailAddressForSpshPersonBodyParams,
            ] = makeParams(domain.spshServiceProviderId);
            const oldOxId: string = faker.string.numeric(5);

            const email: EmailAddress<true> = await setupEmail(
                EmailAddress.createNew({
                    address: faker.internet.email(),
                    externalId: pathParams.spshPersonId,
                    oxUserCounter: oldOxId,
                    priority: 0,
                    spshPersonId: pathParams.spshPersonId,
                    markedForCron: faker.date.future(),
                    sortedStatuses: [{ status: EmailAddressStatusEnum.FAILED }],
                }),
            );

            emailAddressGeneratorMock.isEqualIgnoreCount.mockReturnValueOnce(true);
            oxSendServiceMock.send.mockResolvedValueOnce(Ok({})); // Check if person exists
            oxSendServiceMock.send.mockResolvedValueOnce(Ok({})); // Update person
            ldapClientServiceMock.isPersonExisting.mockResolvedValueOnce(Ok(true)); // Check if person exists
            ldapClientServiceMock.updatePerson.mockResolvedValueOnce(Ok({} as PersonData));

            const shiftPrioritiesSpy: Mock = vi.spyOn(emailAddressRepo, 'shiftPriorities');

            await sut.setEmailAddressForSpshPerson({ ...pathParams, ...bodyParams });

            const emailResult: EmailAddress<true>[] = await emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(
                pathParams.spshPersonId,
            );

            expect(emailResult).toHaveLength(1);
            expect(emailResult[0]).toEqual(
                expect.objectContaining({
                    id: email.id,
                    address: email.address,
                    priority: 0,
                    spshPersonId: pathParams.spshPersonId,
                    oxUserCounter: oldOxId,
                    externalId: pathParams.spshPersonId,
                    markedForCron: undefined,
                }),
            );
            expect(emailResult[0]?.getStatus()).toEqual(EmailAddressStatusEnum.ACTIVE);

            expect(shiftPrioritiesSpy).not.toHaveBeenCalled();
        });

        it('should throw error if domain can not be found', async () => {
            const [pathParams, bodyParams]: [
                SetEmailAddressForSpshPersonPathParams,
                SetEmailAddressForSpshPersonBodyParams,
            ] = makeParams(faker.string.uuid());
            await expect(() =>
                sut.setEmailAddressForSpshPerson({ ...pathParams, ...bodyParams }),
            ).rejects.toBeInstanceOf(EmailDomainNotFoundError);
        });

        it('should throw error if user already has a pending e-mail', async () => {
            const domain: EmailDomain<true> = await setupDomain();
            const [pathParams, bodyParams]: [
                SetEmailAddressForSpshPersonPathParams,
                SetEmailAddressForSpshPersonBodyParams,
            ] = makeParams(domain.spshServiceProviderId);

            await setupEmail(
                EmailAddress.createNew({
                    address: faker.internet.email(),
                    externalId: pathParams.spshPersonId,
                    oxUserCounter: undefined,
                    priority: 0,
                    spshPersonId: pathParams.spshPersonId,
                    sortedStatuses: [{ status: EmailAddressStatusEnum.PENDING }],
                }),
            );

            await expect(() =>
                sut.setEmailAddressForSpshPerson({ ...pathParams, ...bodyParams }),
            ).rejects.toBeInstanceOf(EmailUpdateInProgressError);
        });

        it('should throw error if new email can not be determined', async () => {
            const domain: EmailDomain<true> = await setupDomain();
            const [pathParams, bodyParams]: [
                SetEmailAddressForSpshPersonPathParams,
                SetEmailAddressForSpshPersonBodyParams,
            ] = makeParams(domain.spshServiceProviderId);
            const generationError: Error = new Error('Could not generate mail');

            // User has no emails
            emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValueOnce(Err(generationError));

            await expect(() =>
                sut.setEmailAddressForSpshPerson({ ...pathParams, ...bodyParams }),
            ).rejects.toBeInstanceOf(EmailAddressGenerationAttemptsExceededError);

            expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                `SET EMAIL FOR SPSHPERSONID: ${pathParams.spshPersonId} - Error while creating or updating the email`,
                generationError,
            );
        });

        it('should error when updating of priorities fails', async () => {
            const domain: EmailDomain<true> = await setupDomain();
            const [pathParams, bodyParams]: [
                SetEmailAddressForSpshPersonPathParams,
                SetEmailAddressForSpshPersonBodyParams,
            ] = makeParams(domain.spshServiceProviderId);
            const expectedEmailAddress: string = `${bodyParams.firstName}.${bodyParams.lastName}@${domain.domain}`;

            emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValueOnce(Ok(expectedEmailAddress));
            const error: EntityNotFoundError = new EntityNotFoundError('E-Mail');
            vi.spyOn(emailAddressRepo, 'shiftPriorities').mockResolvedValueOnce(Err(error));

            await expect(() =>
                sut.setEmailAddressForSpshPerson({ ...pathParams, ...bodyParams }),
            ).rejects.toBeInstanceOf(EmailAddressGenerationAttemptsExceededError);

            const emailResult: EmailAddress<true>[] = await emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(
                pathParams.spshPersonId,
            );

            expect(emailResult).toHaveLength(1);
            expect(emailResult[0]?.getStatus()).toEqual(EmailAddressStatusEnum.FAILED);
        });

        it('should error if save after ox-sync fails', async () => {
            const domain: EmailDomain<true> = await setupDomain();
            const [pathParams, bodyParams]: [
                SetEmailAddressForSpshPersonPathParams,
                SetEmailAddressForSpshPersonBodyParams,
            ] = makeParams(domain.spshServiceProviderId);
            await setupEmail(
                EmailAddress.createNew({
                    address: faker.internet.email(),
                    externalId: pathParams.spshPersonId,
                    oxUserCounter: undefined,
                    priority: 2,
                    spshPersonId: pathParams.spshPersonId,
                    sortedStatuses: [{ status: EmailAddressStatusEnum.DEACTIVE }],
                }),
            );
            const newOxId: string = faker.string.numeric(5);
            emailAddressGeneratorMock.isEqualIgnoreCount.mockReturnValueOnce(true);
            oxSendServiceMock.send.mockResolvedValueOnce(Ok({ id: newOxId }));
            ldapClientServiceMock.isPersonExisting.mockResolvedValueOnce(Ok(false));
            ldapClientServiceMock.createPerson.mockResolvedValueOnce(Ok({} as PersonData));

            const originalSave: EmailAddressRepo['save'] = emailAddressRepo.save;
            vi.spyOn(emailAddressRepo, 'save')
                // set pending status
                .mockImplementationOnce(originalSave)
                // save email after ox upsert
                .mockImplementationOnce(() => Promise.resolve(Err(new EntityNotFoundError('E-Mail'))));

            await expect(() =>
                sut.setEmailAddressForSpshPerson({ ...pathParams, ...bodyParams }),
            ).rejects.toBeInstanceOf(EmailAddressGenerationAttemptsExceededError);

            const emailResult: EmailAddress<true>[] = await emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(
                pathParams.spshPersonId,
            );

            expect(emailResult).toHaveLength(1);
            expect(emailResult[0]?.getStatus()).toEqual(EmailAddressStatusEnum.FAILED);
        });

        describe('getOrCreateAvailableEmail', () => {
            it('should return error if generation failed', async () => {
                const domain: EmailDomain<true> = await setupDomain();
                const [pathParams, bodyParams]: [
                    SetEmailAddressForSpshPersonPathParams,
                    SetEmailAddressForSpshPersonBodyParams,
                ] = makeParams(domain.spshServiceProviderId);

                const error: Error = new Error('test error');
                emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValueOnce(Err(error));

                await expect(() =>
                    sut.setEmailAddressForSpshPerson({ ...pathParams, ...bodyParams }),
                ).rejects.toBeInstanceOf(EmailAddressGenerationAttemptsExceededError);

                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    `Could not determine available e-mail`,
                    error,
                );
            });
        });

        describe('upsertOxUser', () => {
            let domain: EmailDomain<true>;
            let params: [SetEmailAddressForSpshPersonPathParams, SetEmailAddressForSpshPersonBodyParams];
            let address: string;

            beforeEach(async () => {
                domain = await setupDomain();
                params = makeParams(domain.spshServiceProviderId);
                address = `${params[1].firstName}.${params[1].lastName}@${domain.domain}`;

                emailAddressGeneratorMock.isEqualIgnoreCount.mockReturnValue(false);
                emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValueOnce(Ok(address));
            });

            it('should error when exists check fails', async () => {
                // E-Mails with ox id needs to exist
                await setupEmail(
                    EmailAddress.createNew({
                        priority: 0,
                        spshPersonId: params[0].spshPersonId,
                        address: faker.internet.email(),
                        externalId: params[0].spshPersonId,
                        oxUserCounter: faker.string.numeric(5),
                        sortedStatuses: [{ status: EmailAddressStatusEnum.ACTIVE }],
                    }),
                );
                const error: OxError = new OxError('test error');
                oxSendServiceMock.send.mockResolvedValueOnce(Err(error));

                await expect(() =>
                    sut.setEmailAddressForSpshPerson({ ...params[0], ...params[1] }),
                ).rejects.toBeInstanceOf(EmailAddressGenerationAttemptsExceededError);

                const emailResult: EmailAddress<true>[] = await emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(
                    params[0].spshPersonId,
                );

                expect(emailResult).toHaveLength(2);
                expect(emailResult[0]?.getStatus()).toEqual(EmailAddressStatusEnum.FAILED);
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(`Error while updating ox user`, error);
            });

            it('should error when user does not exist', async () => {
                // E-Mails with ox id needs to exist
                await setupEmail(
                    EmailAddress.createNew({
                        priority: 0,
                        spshPersonId: params[0].spshPersonId,
                        address: faker.internet.email(),
                        externalId: params[0].spshPersonId,
                        oxUserCounter: faker.string.numeric(5),
                        sortedStatuses: [{ status: EmailAddressStatusEnum.ACTIVE }],
                    }),
                );
                oxSendServiceMock.send.mockResolvedValueOnce(Ok(false));

                await expect(() =>
                    sut.setEmailAddressForSpshPerson({ ...params[0], ...params[1] }),
                ).rejects.toBeInstanceOf(EmailAddressGenerationAttemptsExceededError);

                const emailResult: EmailAddress<true>[] = await emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(
                    params[0].spshPersonId,
                );

                expect(emailResult).toHaveLength(2);
                expect(emailResult[0]?.getStatus()).toEqual(EmailAddressStatusEnum.FAILED);
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    `Error while updating ox user`,
                    new OxError('User not found'),
                );
            });

            it('should error when modify fails', async () => {
                // E-Mails with ox id needs to exist
                await setupEmail(
                    EmailAddress.createNew({
                        priority: 0,
                        spshPersonId: params[0].spshPersonId,
                        address: faker.internet.email(),
                        externalId: params[0].spshPersonId,
                        oxUserCounter: faker.string.numeric(5),
                        sortedStatuses: [{ status: EmailAddressStatusEnum.ACTIVE }],
                    }),
                );
                const error: OxError = new OxError('test error');
                oxSendServiceMock.send.mockResolvedValueOnce(Ok(true)); // exists
                oxSendServiceMock.send.mockResolvedValueOnce(Err(error)); // modify

                await expect(() =>
                    sut.setEmailAddressForSpshPerson({ ...params[0], ...params[1] }),
                ).rejects.toBeInstanceOf(EmailAddressGenerationAttemptsExceededError);

                const emailResult: EmailAddress<true>[] = await emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(
                    params[0].spshPersonId,
                );

                expect(emailResult).toHaveLength(2);
                expect(emailResult[0]?.getStatus()).toEqual(EmailAddressStatusEnum.FAILED);
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(`Error while updating ox user`, error);
            });

            it('should error when create fails', async () => {
                const error: OxError = new OxError('test error');
                oxSendServiceMock.send.mockResolvedValueOnce(Err(error)); // modify

                await expect(() =>
                    sut.setEmailAddressForSpshPerson({ ...params[0], ...params[1] }),
                ).rejects.toBeInstanceOf(EmailAddressGenerationAttemptsExceededError);

                const emailResult: EmailAddress<true>[] = await emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(
                    params[0].spshPersonId,
                );

                expect(emailResult).toHaveLength(1);
                expect(emailResult[0]?.getStatus()).toEqual(EmailAddressStatusEnum.FAILED);
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(`Error while updating ox user`, error);
            });

            it('should set status to ALREADY_IN_OX if that error was returned', async () => {
                const error: OxPrimaryMailAlreadyExistsError = new OxPrimaryMailAlreadyExistsError('test error');
                oxSendServiceMock.send.mockResolvedValueOnce(Err(error)); // modify

                await expect(() =>
                    sut.setEmailAddressForSpshPerson({ ...params[0], ...params[1] }),
                ).rejects.toBeInstanceOf(EmailAddressGenerationAttemptsExceededError);

                const emailResult: EmailAddress<true>[] = await emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(
                    params[0].spshPersonId,
                );

                expect(emailResult).toHaveLength(1);
                expect(emailResult[0]?.getStatus()).toEqual(EmailAddressStatusEnum.EXISTS_ONLY_IN_OX);
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(`Error while updating ox user`, error);
            });
        });

        describe('upsertLdap', () => {
            let domain: EmailDomain<true>;
            let params: [SetEmailAddressForSpshPersonPathParams, SetEmailAddressForSpshPersonBodyParams];
            let expectedEmailAddress: string;

            beforeEach(async () => {
                domain = await setupDomain();
                params = makeParams(domain.spshServiceProviderId);
                expectedEmailAddress = `${params[1].firstName}.${params[1].lastName}@${domain.domain}`;

                emailAddressGeneratorMock.generateAvailableAddress.mockResolvedValueOnce(Ok(expectedEmailAddress));

                oxSendServiceMock.send.mockResolvedValueOnce(Ok({ id: faker.string.numeric(5) }));
            });

            it('should error when exists-check fails', async () => {
                const error: Error = new Error('Test Error');
                ldapClientServiceMock.isPersonExisting.mockResolvedValueOnce(Err(error));

                await expect(() =>
                    sut.setEmailAddressForSpshPerson({ ...params[0], ...params[1] }),
                ).rejects.toBeInstanceOf(EmailAddressGenerationAttemptsExceededError);

                const emailResult: EmailAddress<true>[] = await emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(
                    params[0].spshPersonId,
                );

                expect(emailResult).toHaveLength(1);
                expect(emailResult[0]?.getStatus()).toEqual(EmailAddressStatusEnum.FAILED);
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    `Error while updating/creating LDAP user`,
                    error,
                );
            });

            it('should error when ldap upsert create fails', async () => {
                ldapClientServiceMock.isPersonExisting.mockResolvedValueOnce(Ok(false));
                const error: Error = new Error('Test Error');
                ldapClientServiceMock.createPerson.mockResolvedValueOnce(Err(error));

                await expect(() =>
                    sut.setEmailAddressForSpshPerson({ ...params[0], ...params[1] }),
                ).rejects.toBeInstanceOf(EmailAddressGenerationAttemptsExceededError);

                const emailResult: EmailAddress<true>[] = await emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(
                    params[0].spshPersonId,
                );

                expect(emailResult).toHaveLength(1);
                expect(emailResult[0]?.getStatus()).toEqual(EmailAddressStatusEnum.FAILED);
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    `Error while updating/creating LDAP user`,
                    error,
                );
            });

            it('should error when ldap upsert update fails', async () => {
                ldapClientServiceMock.isPersonExisting.mockResolvedValueOnce(Ok(true));
                const error: Error = new Error('Test Error');
                ldapClientServiceMock.updatePerson.mockResolvedValueOnce(Err(error));

                await expect(() =>
                    sut.setEmailAddressForSpshPerson({ ...params[0], ...params[1] }),
                ).rejects.toBeInstanceOf(EmailAddressGenerationAttemptsExceededError);

                const emailResult: EmailAddress<true>[] = await emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(
                    params[0].spshPersonId,
                );

                expect(emailResult).toHaveLength(1);
                expect(emailResult[0]?.getStatus()).toEqual(EmailAddressStatusEnum.FAILED);
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    `Error while updating/creating LDAP user`,
                    error,
                );
            });
        });

        it('should log on unknown error', async () => {
            const domain: EmailDomain<true> = await setupDomain();
            const [pathParams, bodyParams]: [
                SetEmailAddressForSpshPersonPathParams,
                SetEmailAddressForSpshPersonBodyParams,
            ] = makeParams(domain.spshServiceProviderId);

            const error: Error = new Error('Test Error');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.spyOn(sut as any, 'createOrUpdateEmail').mockRejectedValueOnce(error);

            await expect(() =>
                sut.setEmailAddressForSpshPerson({ ...pathParams, ...bodyParams }),
            ).rejects.toBeInstanceOf(EmailAddressGenerationAttemptsExceededError);

            expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                `SET EMAIL FOR SPSHPERSONID: ${pathParams.spshPersonId} - Unknown error`,
                error,
            );
        });
    });

    describe('internals', () => {
        describe('updateEmailIgnoreMissing', () => {
            it('should return update result if okay', async () => {
                const email: EmailAddress<true> = await setupEmail(
                    EmailAddress.createNew({
                        address: faker.internet.email(),
                        externalId: faker.string.uuid(),
                        oxUserCounter: undefined,
                        priority: 0,
                        spshPersonId: faker.string.uuid(),
                        markedForCron: undefined,
                        sortedStatuses: [],
                    }),
                );

                const result: EmailAddress<true> = await sut['updateEmailIgnoreMissing'](email);

                expect(result).not.toBe(email); // Should not be the same instance
                expect(loggerMock.logUnknownAsError).not.toHaveBeenCalled();
            });

            it('should log error when update fails', async () => {
                const email: EmailAddress<true> = await setupEmail(
                    EmailAddress.createNew({
                        address: faker.internet.email(),
                        externalId: faker.string.uuid(),
                        oxUserCounter: undefined,
                        priority: 0,
                        spshPersonId: faker.string.uuid(),
                        markedForCron: undefined,
                        sortedStatuses: [],
                    }),
                );
                const error: DomainError = new EmailAddressNotFoundError();
                vi.spyOn(emailAddressRepo, 'save').mockResolvedValueOnce(Err(error));

                const result: EmailAddress<true> = await sut['updateEmailIgnoreMissing'](email);

                expect(result).toBe(email); // Returns the input address
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    `Saving of E-Mail-Address ${email.address} failed`,
                    error,
                );
            });
        });
    });
});
