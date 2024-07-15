import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { PersonenkontextDeletedEvent } from '../../../shared/events/personenkontext-deleted.event.js';
import { PersonenkontextCreatedEvent } from '../../../shared/events/personenkontext-created.event.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderTarget } from '../../service-provider/domain/service-provider.enum.js';
import { PersonDeletedEvent } from '../../../shared/events/person-deleted.event.js';
import { DomainError } from '../../../shared/error/index.js';
import { PersonID } from '../../../shared/types/index.js';
import { EmailAddressEntity } from '../persistence/email-address.entity.js';
import { EmailAddressNotFoundError } from '../error/email-address-not-found.error.js';
import { EmailRepo } from '../persistence/email.repo.js';
import { EmailFactory } from './email.factory.js';
import { EmailAddress } from './email-address.js';

@Injectable()
export class EmailEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly emailFactory: EmailFactory,
        private readonly emailRepo: EmailRepo,
        private readonly rolleRepo: RolleRepo,
        private readonly serviceProviderRepo: ServiceProviderRepo,
    ) {}

    @EventHandler(PersonenkontextCreatedEvent)
    public async handlePersonenkontextCreatedEvent(event: PersonenkontextCreatedEvent): Promise<void> {
        this.logger.info(
            `Received PersonenkontextCreatedEvent, personId:${event.personId}, orgaId:${event.organisationId}, rolleId:${event.rolleId}`,
        );
        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(event.rolleId);
        if (!rolle) {
            this.logger.error(`Rolle id:${event.rolleId} does NOT exist`);
            return;
        }
        if (await this.rolleReferencesEmailServiceProvider(rolle)) {
            this.logger.info(`Received event for creation of PK with rolle that references email SP`);
            const existingEmail: Option<EmailAddress<true>> = await this.emailRepo.findByPerson(event.personId);

            if (existingEmail) {
                this.logger.info(`Existing email found for personId:${event.personId}`);
                existingEmail.enable();
                const persistenceResult: EmailAddress<true> | DomainError = await this.emailRepo.save(existingEmail);
                if (persistenceResult instanceof EmailAddress) {
                    this.logger.info(
                        `Successfully persisted email with new address:${persistenceResult.currentAddress}`,
                    );
                } else {
                    this.logger.error(`Could not enable email, error is ${persistenceResult.message}`);
                }
            } else {
                this.logger.info(`No existing email found for personId:${event.personId}, creating a new one`);
                await this.createNewEmail(event.personId);
            }
        }
    }

    private async createNewEmail(personId: PersonID): Promise<void> {
        const email: Result<EmailAddress<false>> = await this.emailFactory.createNew(personId);
        if (!email.ok) {
            this.logger.error(`Could not create email, error is ${email.error.message}`);
            return;
        }
        email.value.enable();
        const persistenceResult: EmailAddress<true> | DomainError = await this.emailRepo.save(email.value);
        if (persistenceResult instanceof EmailAddress) {
            this.logger.info(`Successfully persisted email with new address:${persistenceResult.currentAddress}`);
        } else {
            this.logger.error(`Could not create email, error is ${persistenceResult.message}`);
        }
    }

    @EventHandler(PersonenkontextDeletedEvent)
    // eslint-disable-next-line @typescript-eslint/require-await
    public async handlePersonenkontextDeletedEvent(event: PersonenkontextDeletedEvent): Promise<void> {
        this.logger.info(
            `Received PersonenkontextDeletedEvent, personId:${event.personId}, orgaId:${event.organisationId}, rolleId:${event.rolleId}`,
        );
        // currently receiving of this event is not causing a deletion of email and the related addresses for the affected user, this is intentional
    }

    @EventHandler(PersonDeletedEvent)
    public async handlePersonDeletedEvent(event: PersonDeletedEvent): Promise<void> {
        this.logger.info(`Received PersonDeletedEvent, personId:${event.personId}`);
        //Setting person_id to null in Email table is done via deleteRule, not necessary here

        if (!event.emailAddress) {
            this.logger.info('Cannot deactivate email-address, person did not have an email-address');
            return;
        }
        const deactivationResult: EmailAddressEntity | EmailAddressNotFoundError =
            await this.emailRepo.deactivateEmailAddress(event.emailAddress);
        if (deactivationResult instanceof EmailAddressNotFoundError) {
            this.logger.error(`Deactivation of email-address:${event.emailAddress} failed`);
            return;
        }
        this.logger.info(`Successfully deactivated email-address:${event.emailAddress}`);
    }

    private async rolleReferencesEmailServiceProvider(rolle: Rolle<true>): Promise<boolean> {
        const serviceProviderMap: Map<string, ServiceProvider<true>> = await this.serviceProviderRepo.findByIds(
            rolle.serviceProviderIds,
        );
        const serviceProviders: ServiceProvider<true>[] = Array.from(
            serviceProviderMap.values(),
            (value: ServiceProvider<true>) => {
                return value;
            },
        );

        return serviceProviders.some((sp: ServiceProvider<true>) => sp.target === ServiceProviderTarget.EMAIL);
    }
}
