import { Injectable } from '@nestjs/common';
import { SetEmailAddressForSpshPersonParams } from '../api/dtos/params/set-email-addess-for-spsh-person.params.js';
import { EmailAddressRepo } from '../persistence/email-address.repo.js';
import { EmailAddressGenerator } from './email-address-generator.js';
import { EmailAddress } from './email-address.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { EmailDomainRepo } from '../persistence/email-domain.repo.js';
import { EmailDomain } from './email-domain.js';
import { EmailAddressStatus } from '../persistence/email-address.entity.js';
import { EmailDomainNotFoundError } from '../error/email-domain-not-found.error.js';

@Injectable()
export class SetEmailAddressForSpshPersonService {
    private emailAddressGenerator: EmailAddressGenerator;

    public constructor(
        private readonly emailAddressRepo: EmailAddressRepo,
        private readonly emailDomainRepo: EmailDomainRepo,
        private readonly logger: ClassLogger,
    ) {
        this.emailAddressGenerator = new EmailAddressGenerator(emailAddressRepo);
    }

    public async setEmailAddressForSpshPerson(params: SetEmailAddressForSpshPersonParams): Promise<void> {
        const existingAddresses: EmailAddress<true>[] =
            await this.emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(params.spshPersonId);
        const emailDomain: Option<EmailDomain<true>> = await this.emailDomainRepo.findById(params.emailDomainId);

        if (!emailDomain) {
            this.logger.error(`EmailDomain with id ${params.emailDomainId} not found`);
            throw new EmailDomainNotFoundError(`EmailDomain with id ${params.emailDomainId} not found`);
        }
        if (existingAddresses.length > 0) {
            this.logger.crit(
                `Person with id ${params.spshPersonId} already has email addresses assigned. Not implemented yet [WIP]`,
            );
        }
        await this.createFirstEmailForSpshPerson(params.firstName, params.lastName, params.spshPersonId, emailDomain);
    }

    private async createFirstEmailForSpshPerson(
        firstName: string,
        lastName: string,
        spshPersonId: string,
        emailDomain: EmailDomain<true>,
    ): Promise<void> {
        const generationResult: Result<string, Error> = await this.emailAddressGenerator.generateAvailableAddress(
            firstName,
            lastName,
            emailDomain.domain,
        );

        if (!generationResult.ok) {
            this.logger.error(`Failed to generate email address: ${generationResult.error.message}`);
            throw generationResult.error;
        }

        const createdEmail: EmailAddress<false> = EmailAddress.createNew({
            address: generationResult.value,
            priority: 0,
            status: EmailAddressStatus.PENDING,
            spshPersonId: spshPersonId,
            oxUserId: undefined,
            markedForCron: undefined,
        });

        await this.emailAddressRepo.save(createdEmail);
        this.logger.info(`Created email address ${createdEmail.address} for person ${spshPersonId}`);
    }
}
