import { Injectable } from '@nestjs/common';
import { SetEmailAddressForSpshPersonParams } from '../api/dtos/params/set-email-addess-for-spsh-person.params.js';
import { EmailAddressRepo } from '../persistence/email-address.repo.js';
import { EmailAddressGenerator } from './email-address-generator.js';
import { EmailAddress } from './email-address.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { EmailDomainRepo } from '../persistence/email-domain.repo.js';
import { EmailDomain } from './email-domain.js';
import { EmailDomainNotFoundError } from '../error/email-domain-not-found.error.js';
import { EmailAddressStatus } from './email-address-status.js';
import { EmailAddressStatusEnum } from '../persistence/email-address-status.entity.js';
import { EmailAddressStatusRepo } from '../persistence/email-address-status.repo.js';
import { DomainError } from '../../../../shared/error/domain.error.js';
import { OxService } from '../../ox/domain/ox-service.js';
import { OxSendService } from '../../ox/domain/ox-send-service.js';
import { CreateUserAction, CreateUserResponse } from '../../ox/actions/user/create-user.action.js';
import { PersonID, PersonReferrer } from '../../../../shared/types/index.js';
import { OxPrimaryMailAlreadyExistsError } from '../../ox/error/ox-primary-mail-already-exists.error.js';
import { LdapClientService, PersonData } from '../../ldap/domain/ldap-client.service.js';

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
        const existingAddresses: EmailAddress<true>[] =
            await this.emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(params.spshPersonId);
        const emailDomain: Option<EmailDomain<true>> = await this.emailDomainRepo.findById(params.emailDomainId);

        if (!emailDomain) {
            this.logger.error(
                `SET EMAIL FOR SPSHPERSONID: ${params.spshPersonId} - EmailDomain with id ${params.emailDomainId} not found`,
            );
            throw new EmailDomainNotFoundError(`EmailDomain with id ${params.emailDomainId} not found`);
        }
        if (existingAddresses.length > 0) {
            this.logger.crit(
                `SET EMAIL FOR SPSHPERSONID: ${params.spshPersonId} - Person already has email addresses assigned. Not implemented yet [WIP]`,
            );
            return;
        }
        await this.createFirstEmailForSpshPerson(
            params.firstName,
            params.lastName,
            params.spshPersonId,
            params.spshUsername,
            params.kennungen,
            emailDomain,
            5,
        );
    }

    private async createFirstEmailForSpshPerson(
        firstName: string,
        lastName: string,
        spshPersonId: string,
        spshUsername: string,
        kennungen: string[],
        emailDomain: EmailDomain<true>,
        recursionTry: number = 1,
    ): Promise<void> {
        //GENERATE AND SETUP EMAIL ADDRESS
        if (recursionTry === 0) {
            return;
        }

        const emailAddressToCreate: EmailAddress<false> = await this.generateEmailAddress({
            firstName: firstName,
            lastName: lastName,
            spshPersonId: spshPersonId,
            emailDomain: emailDomain,
        });

        //CREATE IN DB
        const createdEmailAddress: EmailAddress<true> | DomainError =
            await this.emailAddressRepo.save(emailAddressToCreate);

        if (createdEmailAddress instanceof DomainError) {
            this.logger.error(
                `CREATE FIRST EMAIL FOR SPSHPERSONID: ${spshPersonId} - Failed to create email address: ${createdEmailAddress.message}`,
            );
            return;
        }

        await this.emailAddressStatusRepo.create(
            EmailAddressStatus.createNew({
                emailAddressId: createdEmailAddress.id,
                status: EmailAddressStatusEnum.PENDING,
            }),
        );

        this.logger.info(
            `CREATE FIRST EMAIL FOR SPSHPERSONID: ${spshPersonId} - Successfully created email address ${createdEmailAddress.address} in status PENDING in DB`,
        );

        //CREATE IN OX
        let oxUserId: string | undefined = undefined;
        try {
            oxUserId = await this.createOxUserForSpshPerson(
                spshPersonId,
                spshUsername,
                firstName,
                lastName,
                createdEmailAddress,
            );
            this.logger.info(
                `CREATE FIRST EMAIL FOR SPSHPERSONID: ${spshPersonId} - Successfully created OX user with  oxUserId ${oxUserId}`,
            );
        } catch (error) {
            if (error instanceof OxPrimaryMailAlreadyExistsError) {
                this.logger.info(
                    `CREATE FIRST EMAIL FOR SPSHPERSONID: ${spshPersonId} - Email address ${createdEmailAddress.address} already exists in Ox, trying again with a new email address, ${recursionTry - 1} tries left`,
                );
                createdEmailAddress.spshPersonId = undefined;
                await this.emailAddressRepo.save(createdEmailAddress);

                await this.emailAddressStatusRepo.create(
                    EmailAddressStatus.createNew({
                        emailAddressId: createdEmailAddress.id,
                        status: EmailAddressStatusEnum.EXISTS_ONLY_IN_OX,
                    }),
                );

                await this.createFirstEmailForSpshPerson(
                    firstName,
                    lastName,
                    spshPersonId,
                    spshUsername,
                    kennungen,
                    emailDomain,
                    recursionTry - 1,
                );
            }
        }

        //CONNECT OXUSERID IN DB
        if (!oxUserId) {
            await this.emailAddressStatusRepo.create(
                EmailAddressStatus.createNew({
                    emailAddressId: createdEmailAddress.id,
                    status: EmailAddressStatusEnum.FAILED,
                }),
            );
            this.logger.error(
                `CREATE FIRST EMAIL FOR SPSHPERSONID: ${spshPersonId} - Failed to connect Ox user in Db because oxUserId is undefined`,
            );
            return;
        }
        createdEmailAddress.oxUserId = oxUserId;

        const saveResultAfterOxConnection: EmailAddress<true> | DomainError =
            await this.emailAddressRepo.save(createdEmailAddress);
        if (saveResultAfterOxConnection instanceof DomainError) {
            this.logger.error(
                `CREATE FIRST EMAIL FOR SPSHPERSONID: ${spshPersonId} - Failed to save email address after trying to connect oxUserId ${oxUserId}`,
            );
            return;
        }
        this.logger.info(
            `CREATE FIRST EMAIL FOR SPSHPERSONID: ${spshPersonId} - Successfully connected oxUserId ${oxUserId} in DB`,
        );

        //ADD OX USER TO OX GROUPS
        for (const kennung of kennungen) {
            //await in loop is on purpose because we dont want multiple parallel requests to ox here
            //eslint-disable-next-line no-await-in-loop
            await this.oxService.addOxUserToGroup(oxUserId, kennung);
        }

        //CREATE IN LDAP
        const createdLdapPerson: Result<PersonData, Error> = await this.ldapClientService.createPerson(
            {
                firstName: firstName,
                lastName: lastName,
                uid: spshPersonId,
            },
            emailDomain.domain,
            createdEmailAddress.address,
        );
        if (!createdLdapPerson.ok) {
            await this.emailAddressStatusRepo.create(
                EmailAddressStatus.createNew({
                    emailAddressId: createdEmailAddress.id,
                    status: EmailAddressStatusEnum.FAILED,
                }),
            );
            this.logger.error(
                `CREATE FIRST EMAIL FOR SPSHPERSONID: ${spshPersonId} - Failed to create LDAP person: ${createdLdapPerson.error}`,
            );
            return;
        }
        this.logger.info(`CREATE FIRST EMAIL FOR SPSHPERSONID: ${spshPersonId} - Successfully created LDAP person`);

        //Even we know the ldapUid already in the beginning (since it is spshpersonId for new users) we set it after creating the LDAP person to be sure that field can only be set if also user in ldap exist.
        const ldapUid: string = spshPersonId;
        saveResultAfterOxConnection.ldapUid = ldapUid;

        const saveResultAfterLdapConnection: EmailAddress<true> | DomainError =
            await this.emailAddressRepo.save(saveResultAfterOxConnection);
        if (saveResultAfterLdapConnection instanceof DomainError) {
            await this.emailAddressStatusRepo.create(
                EmailAddressStatus.createNew({
                    emailAddressId: createdEmailAddress.id,
                    status: EmailAddressStatusEnum.FAILED,
                }),
            );
            this.logger.error(
                `CREATE FIRST EMAIL FOR SPSHPERSONID: ${spshPersonId} - Failed to save email address after trying to connect ldapUid ${ldapUid}`,
            );
            return;
        }
        this.logger.info(
            `CREATE FIRST EMAIL FOR SPSHPERSONID: ${spshPersonId} - Successfully connected ldapUid ${ldapUid}`,
        );

        //ACTIVATE IN DB
        await this.emailAddressStatusRepo.create(
            EmailAddressStatus.createNew({
                emailAddressId: createdEmailAddress.id,
                status: EmailAddressStatusEnum.ACTIVE,
            }),
        );
        this.logger.info(
            `CREATE FIRST EMAIL FOR SPSHPERSONID: ${spshPersonId} - Successfully activated email address ${createdEmailAddress.address} in DB after completing all steps`,
        );
    }

    private async createOxUserForSpshPerson(
        spshPersonId: PersonID,
        spshUsername: PersonReferrer,
        firstName: string,
        lastName: string,
        mostRecentRequestedEmailAddress: EmailAddress<true>,
    ): Promise<string> {
        const requestedEmailAddressString: string = mostRecentRequestedEmailAddress.address;

        const action: CreateUserAction = this.oxService.createCreateUserAction({
            displayName: spshUsername,
            username: spshUsername,
            firstname: firstName,
            lastname: lastName,
            primaryEmail: requestedEmailAddressString,
        });
        const createUserResult: Result<CreateUserResponse, DomainError> = await this.oxSendService.send(action);

        if (!createUserResult.ok) {
            this.logger.error(
                `CREATE OX USER FOR SPSH PERSON: ${spshPersonId} - Could not create user in OX, error:${createUserResult.error.message}`,
            );
            throw createUserResult.error;
        }

        this.logger.info(
            `CREATE OX USER FOR SPSH PERSON: ${spshPersonId} - Successfully created user in OX, oxUserId:${createUserResult.value.id}, oxEmail:${createUserResult.value.primaryEmail}`,
        );

        return createUserResult.value.id;
    }

    private async generateEmailAddress(params: {
        spshPersonId: PersonID;
        firstName: string;
        lastName: string;
        emailDomain: EmailDomain<true>;
    }): Promise<EmailAddress<false>> {
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
            priority: 0,
            spshPersonId: params.spshPersonId,
            oxUserId: undefined,
            markedForCron: undefined,
        });

        return emailAddressToCreate;
    }
}
