import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { DomainError } from '../../../../shared/error/domain.error.js';
import { PersonID, PersonUsername } from '../../../../shared/types/index.js';
import { Err, Ok, UnionToResult } from '../../../../shared/util/result.js';
import { LdapClientService, PersonData } from '../../ldap/domain/ldap-client.service.js';
import { CreateUserAction, CreateUserResponse } from '../../ox/actions/user/create-user.action.js';
import { GetDataForUserResponse } from '../../ox/actions/user/get-data-user.action.js';
import { OxSendService } from '../../ox/domain/ox-send.service.js';
import { OxService } from '../../ox/domain/ox.service.js';
import { OxPrimaryMailAlreadyExistsError } from '../../ox/error/ox-primary-mail-already-exists.error.js';
import { AddressWithStatusesDescDto } from '../api/dtos/address-with-statuses/address-with-statuses-desc.dto.js';
import { SetEmailAddressForSpshPersonParams } from '../api/dtos/params/set-email-address-for-spsh-person.params.js';
import { EmailDomainNotFoundError } from '../error/email-domain-not-found.error.js';
import { EmailAddressStatusEnum } from '../persistence/email-address-status.entity.js';
import { EmailAddressStatusRepo } from '../persistence/email-address-status.repo.js';
import { EmailAddressRepo } from '../persistence/email-address.repo.js';
import { EmailDomainRepo } from '../persistence/email-domain.repo.js';
import { EmailAddressGenerator } from './email-address-generator.js';
import { EmailAddressStatus } from './email-address-status.js';
import { EmailAddress } from './email-address.js';
import { EmailDomain } from './email-domain.js';
import { EmailUpdateInProgressError } from '../error/email-update-in-progress.error.js';
import { EmailAddressGenerationAttemptsExceededError } from '../error/email-address-generation-attempts-exceeds.error.js';
import { uniq } from 'lodash-es';

@Injectable()
export class SetEmailAddressForSpshPersonService {
    public constructor(
        private readonly emailAddressRepo: EmailAddressRepo,
        private readonly emailDomainRepo: EmailDomainRepo,
        private readonly emailAddressStatusRepo: EmailAddressStatusRepo,
        private readonly logger: ClassLogger,
        private readonly emailAddressGenerator: EmailAddressGenerator,
        private readonly oxService: OxService,
        private readonly oxSendService: OxSendService,
        private readonly ldapClientService: LdapClientService,
    ) {}

    public async setEmailAddressForSpshPerson(params: SetEmailAddressForSpshPersonParams): Promise<void> {
        this.logger.info(`SET EMAIL FOR SPSHPERSONID: ${params.spshPersonId} - Request Received`);

        const emailDomain: Option<EmailDomain<true>> = await this.emailDomainRepo.findBySpshServiceProviderId(
            params.spshServiceProviderId,
        );

        if (!emailDomain) {
            this.logger.error(
                `SET EMAIL FOR SPSHPERSONID: ${params.spshPersonId} - EmailDomain with spshServiceProviderId ${params.spshServiceProviderId} not found`,
            );
            throw new EmailDomainNotFoundError(
                `EmailDomain with spshServiceProviderId ${params.spshServiceProviderId} not found`,
            );
        }

        if (await this.checkForPendingEmail(params.spshPersonId)) {
            this.logger.error(
                `SET EMAIL FOR SPSHPERSONID: ${params.spshPersonId} - Some e-mail already requested, aborting.`,
            );
            throw new EmailUpdateInProgressError('e-mail generation already in progress');
        }

        const uniqueKennungen: string[] = uniq(params.kennungen);

        const ATTEMPTS: number = 5;

        await this.createOrUpdateEmailWithRetries(
            ATTEMPTS,
            params.firstName,
            params.lastName,
            params.spshPersonId,
            params.spshUsername,
            uniqueKennungen,
            emailDomain,
        );
    }

    private async createOrUpdateEmailWithRetries(
        attempts: number,
        firstName: string,
        lastName: string,
        spshPersonId: string,
        spshUsername: string,
        kennungen: string[],
        emailDomain: EmailDomain<true>,
    ): Promise<Result<void>> {
        for (let i: number = 0; i < attempts; i++) {
            this.logger.info(`SET EMAIL FOR SPSHPERSONID: ${spshPersonId} - Attempt ${i + 1}`);

            try {
                // eslint-disable-next-line no-await-in-loop
                const result: Result<void> = await this.createOrUpdateEmail(
                    firstName,
                    lastName,
                    spshPersonId,
                    spshUsername,
                    kennungen,
                    emailDomain,
                );

                if (result.ok) {
                    // Success, abort the retry loop
                    this.logger.info(`SET EMAIL FOR SPSHPERSONID: ${spshPersonId} - Success`);
                    return Ok(undefined);
                }

                this.logger.logUnknownAsError(
                    `SET EMAIL FOR SPSHPERSONID: ${spshPersonId} - Error while creating or updating the email`,
                    result.error,
                );
            } catch (err) {
                this.logger.logUnknownAsError(`SET EMAIL FOR SPSHPERSONID: ${spshPersonId} - Unknown error`, err);
            }
        }

        this.logger.error(`SET EMAIL FOR SPSHPERSONID: ${spshPersonId} - All attempts failed, aborting`);
        return Err(new EmailAddressGenerationAttemptsExceededError());
    }

    /**
     * Checks if the person has a e-mail that is currently in a pending state
     * @param spshPersonId
     */
    private async checkForPendingEmail(spshPersonId: PersonID): Promise<boolean> {
        const addressesWithStatuses: AddressWithStatusesDescDto[] =
            await this.emailAddressRepo.findAllEmailAddressesWithStatusesDescBySpshPersonId(spshPersonId);

        return !!addressesWithStatuses.find(
            (aws: AddressWithStatusesDescDto) => aws.statuses[0]?.status === EmailAddressStatusEnum.PENDING,
        );
    }

    /**
     * Tries to (re)activate an existing mail or generate a new one, if the existing ones no longer match the name
     * Also updates OX and LDAP entries
     */
    private async createOrUpdateEmail(
        firstName: string,
        lastName: string,
        spshPersonId: string,
        spshUsername: string,
        kennungen: string[],
        emailDomain: EmailDomain<true>,
    ): Promise<Result<void>> {
        const newPrimaryEmail: Result<EmailAddress<true>, DomainError> = await this.getOrCreateAvailableEmail({
            emailDomain: emailDomain,
            firstName,
            lastName,
            spshPersonId,
        });

        if (!newPrimaryEmail.ok) {
            this.logger.logUnknownAsError(`Could not determine available e-mail`, newPrimaryEmail.error);

            return newPrimaryEmail;
        }

        const externalId: string = newPrimaryEmail.value.externalId; // Used as ox username and ldap uid.

        {
            const allEmailsWithStatuses: AddressWithStatusesDescDto[] = (
                await this.emailAddressRepo.findAllEmailAddressesWithStatusesDescBySpshPersonId(spshPersonId)
            ).sort(
                (a: AddressWithStatusesDescDto, b: AddressWithStatusesDescDto) =>
                    a.emailAddress.priority - b.emailAddress.priority,
            );

            const currentPrioZero: AddressWithStatusesDescDto | undefined = allEmailsWithStatuses.find(
                (em: AddressWithStatusesDescDto) => em.emailAddress.priority === 0,
            );

            // Shift email back if necessary
            if (currentPrioZero?.emailAddress.id !== newPrimaryEmail.value.id) {
                if (currentPrioZero && currentPrioZero.statuses[0]?.status !== EmailAddressStatusEnum.ACTIVE) {
                    const shiftResult: Result<unknown, Error> = await this.emailAddressRepo.shiftPriorities(
                        currentPrioZero.emailAddress,
                        2,
                    );

                    if (!shiftResult.ok) {
                        this.logger.logUnknownAsError(
                            `Error while updating e-mail priorities for prio 0 mail`,
                            shiftResult.error,
                        );

                        await this.emailAddressStatusRepo.create(
                            EmailAddressStatus.createNew({
                                emailAddressId: newPrimaryEmail.value.id,
                                status: EmailAddressStatusEnum.FAILED,
                            }),
                        );

                        return shiftResult;
                    }
                }
            }
        }

        let alternativeEmail: EmailAddress<true> | undefined;

        // Don't set pending status, if the email is already prio 0
        if (newPrimaryEmail.value.priority > 0) {
            await this.emailAddressStatusRepo.create(
                EmailAddressStatus.createNew({
                    emailAddressId: newPrimaryEmail.value.id,
                    status: EmailAddressStatusEnum.PENDING,
                }),
            );

            const updatedEmailsResult: Result<EmailAddress<true>[], Error> =
                await this.emailAddressRepo.shiftPriorities(newPrimaryEmail.value, 0);

            if (!updatedEmailsResult.ok) {
                this.logger.logUnknownAsError(`Error while updating e-mail priorities`, updatedEmailsResult.error);

                await this.emailAddressStatusRepo.create(
                    EmailAddressStatus.createNew({
                        emailAddressId: newPrimaryEmail.value.id,
                        status: EmailAddressStatusEnum.FAILED,
                    }),
                );

                return updatedEmailsResult;
            }

            await this.emailAddressRepo.ensureStatusesAndCronDateForPerson(spshPersonId, new Date()); // TODO

            // Find the email which is not at priority 1 to use as an alternative mail
            alternativeEmail = updatedEmailsResult.value.find((em: EmailAddress<true>) => em.priority === 1);
        } else {
            const mails: EmailAddress<true>[] =
                await this.emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(spshPersonId);
            alternativeEmail = mails.find((em: EmailAddress<true>) => em.priority === 1);
        }

        // Update or create ox user
        const oxUserIdResult: Result<string> = await this.upsertOxUser(
            spshUsername,
            firstName,
            lastName,
            newPrimaryEmail.value,
            alternativeEmail,
            kennungen,
        );

        if (!oxUserIdResult.ok) {
            this.logger.logUnknownAsError(`Error while updating ox user`, oxUserIdResult.error);

            if (oxUserIdResult.error instanceof OxPrimaryMailAlreadyExistsError) {
                await this.emailAddressStatusRepo.create(
                    EmailAddressStatus.createNew({
                        emailAddressId: newPrimaryEmail.value.id,
                        status: EmailAddressStatusEnum.EXISTS_ONLY_IN_OX,
                    }),
                );
            } else {
                await this.emailAddressStatusRepo.create(
                    EmailAddressStatus.createNew({
                        emailAddressId: newPrimaryEmail.value.id,
                        status: EmailAddressStatusEnum.FAILED,
                    }),
                );
            }

            return oxUserIdResult;
        }

        // Update e-mail with the ox user ID
        {
            newPrimaryEmail.value.oxUserCounter = oxUserIdResult.value;
            const saveResult: Result<unknown, DomainError> = UnionToResult(
                await this.emailAddressRepo.save(newPrimaryEmail.value),
            );

            if (!saveResult.ok) {
                this.logger.logUnknownAsError(`Error while updating e-mail`, saveResult.error);

                // Persist the e-mail as failed
                await this.emailAddressStatusRepo.create(
                    EmailAddressStatus.createNew({
                        emailAddressId: newPrimaryEmail.value.id,
                        status: EmailAddressStatusEnum.FAILED,
                    }),
                );

                return saveResult;
            }
        }

        // update or create LDAP user
        const ldapResult: Result<void> = await this.upsertLdapUser(
            externalId,
            spshUsername,
            firstName,
            lastName,
            newPrimaryEmail.value.address,
            alternativeEmail?.address,
            emailDomain.domain,
        );

        if (!ldapResult.ok) {
            this.logger.logUnknownAsError(`Error while updating/creating LDAP user`, ldapResult.error);

            // Persist the e-mail as failed
            await this.emailAddressStatusRepo.create(
                EmailAddressStatus.createNew({
                    emailAddressId: newPrimaryEmail.value.id,
                    status: EmailAddressStatusEnum.FAILED,
                }),
            );

            return ldapResult;
        }

        // Everything was a success, set the e-mail to active
        await this.emailAddressStatusRepo.create(
            EmailAddressStatus.createNew({
                emailAddressId: newPrimaryEmail.value.id,
                status: EmailAddressStatusEnum.ACTIVE,
            }),
        );

        return Ok(undefined);
    }

    /**
     * Tries to match an existing email, if none can be found a new email will be generated and persisted (with priority = Infinity)
     */
    private async getOrCreateAvailableEmail(params: {
        spshPersonId: PersonID;
        firstName: string;
        lastName: string;
        emailDomain: EmailDomain<true>;
    }): Promise<Result<EmailAddress<true>, DomainError>> {
        // Try to match an existing email first
        const existingAddresses: AddressWithStatusesDescDto[] =
            await this.emailAddressRepo.findAllEmailAddressesWithStatusesDescBySpshPersonId(params.spshPersonId);

        existingAddresses.sort(
            (a: AddressWithStatusesDescDto, b: AddressWithStatusesDescDto) =>
                a.emailAddress.priority - b.emailAddress.priority,
        );

        const matchingEmail: Option<AddressWithStatusesDescDto> = existingAddresses.find(
            (em: AddressWithStatusesDescDto) =>
                // Exclude EXISTS_ONLY_IN_OX emails
                em.statuses[0]?.status !== EmailAddressStatusEnum.EXISTS_ONLY_IN_OX &&
                this.emailAddressGenerator.isEqualIgnoreCount(
                    em.emailAddress.address,
                    params.firstName,
                    params.lastName,
                    params.emailDomain.domain,
                ),
        );

        if (matchingEmail) {
            return Ok(matchingEmail.emailAddress);
        }

        // Use externalId from existing E-Mails if possible, otherwise use spsh person ID
        const externalId: string =
            existingAddresses.find((em: AddressWithStatusesDescDto) => !!em.emailAddress.externalId)?.emailAddress
                .externalId ?? params.spshPersonId;

        // Find an existing ox user ID
        const oxUserCounter: string | undefined = existingAddresses.find(
            (em: AddressWithStatusesDescDto) => !!em.emailAddress.oxUserCounter,
        )?.emailAddress.oxUserCounter;

        // Generate a new email
        const generationResult: Result<string, Error> = await this.emailAddressGenerator.generateAvailableAddress(
            params.firstName,
            params.lastName,
            params.emailDomain.domain,
        );

        if (!generationResult.ok) {
            this.logger.error(
                `GENERATE EMAIL ADDRESS FOR SPSH PERSON: ${params.spshPersonId} - Failed: ${generationResult.error.message}`,
            );
            throw generationResult.error;
        }

        const emailAddressToCreate: EmailAddress<false> = EmailAddress.createNew({
            address: generationResult.value,
            priority: Infinity, // Needs to be shifted into position
            spshPersonId: params.spshPersonId,
            externalId,
            oxUserCounter,
            markedForCron: undefined,
        });

        const createResult: EmailAddress<true> | DomainError = await this.emailAddressRepo.save(emailAddressToCreate);

        return UnionToResult(createResult);
    }

    private async upsertOxUser(
        spshUsername: PersonUsername,
        firstname: string,
        lastname: string,
        primaryEmail: EmailAddress<true>,
        alternativeEmail: EmailAddress<true> | undefined,
        kennungen: string[],
    ): Promise<Result<string>> {
        if (alternativeEmail && primaryEmail.oxUserCounter !== alternativeEmail.oxUserCounter) {
            return Err(new Error('Primary and alternative have different external OX IDs'));
        }

        const externalId: string = primaryEmail.externalId;
        const oxUserCounter: string | undefined = primaryEmail.oxUserCounter;

        if (oxUserCounter) {
            // Check if OX User exists -> otherwise error

            const exists: Result<GetDataForUserResponse, DomainError> = await this.oxSendService.send(
                this.oxService.createGetDataForUserAction(externalId),
            );

            // Maybe split this
            if (!exists.ok) {
                return Err(new Error('TODO'));
            }

            // update OX user

            const aliases: string[] = [primaryEmail.address, alternativeEmail?.address].filter(Boolean);

            const changeResult: Result<void, DomainError> = await this.oxSendService.send(
                this.oxService.createChangeUserAction(
                    oxUserCounter,
                    externalId,
                    aliases,
                    firstname,
                    lastname,
                    spshUsername,
                    primaryEmail.address,
                    primaryEmail.address,
                ),
            );

            if (!changeResult.ok) {
                return Err(new Error('TODO'));
            }

            await this.oxService.setUserOxGroups(oxUserCounter, kennungen);

            return Ok(oxUserCounter);
        } else {
            // create ox user (keep ID!)

            const createAction: CreateUserAction = this.oxService.createCreateUserAction({
                username: externalId,
                displayName: spshUsername,
                firstname,
                lastname,
                primaryEmail: primaryEmail.address,
                // TODO: Do we need alternative here?
            });

            const createResult: Result<CreateUserResponse, DomainError> = await this.oxSendService.send(createAction);

            if (!createResult.ok) {
                this.logger.error('TODO');
                return createResult;
            }

            return Ok(createResult.value.id);
        }
    }

    private async upsertLdapUser(
        uid: string,
        username: string,
        firstName: string,
        lastName: string,

        primaryEmail: string,
        alternativeEmail: string | undefined,

        domain: string,
    ): Promise<Result<void>> {
        const exists: Result<boolean> = await this.ldapClientService.isPersonExisting(uid, domain);

        if (!exists.ok) {
            return Err(new Error('TODO'));
        }

        if (exists.value) {
            // Update
            const updateResult: Result<PersonData> = await this.ldapClientService.updatePerson(
                {
                    uid,
                    username,
                    firstName,
                    lastName,
                },
                domain,
                primaryEmail,
                alternativeEmail,
            );

            if (!updateResult.ok) {
                return updateResult;
            }
        } else {
            // Create
            const createResult: Result<PersonData> = await this.ldapClientService.createPerson(
                {
                    uid,
                    username,
                    firstName,
                    lastName,
                },
                domain,
                primaryEmail,
                alternativeEmail,
            );

            if (!createResult.ok) {
                return createResult;
            }
        }

        return Ok(undefined);
    }
}
