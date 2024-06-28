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
import { EmailFactory } from './email.factory.js';
import { Email } from './email.js';
import { EmailRepo } from '../persistence/email.repo.js';
import { PersonDeletedEvent } from '../../../shared/events/person-deleted.event.js';
import { DomainError } from '../../../shared/error/index.js';
import { PersonID } from '../../../shared/types/index.js';
import { EmailAddressEntity } from '../persistence/email-address.entity.js';
import { EmailAddressNotFoundError } from '../error/email-address-not-found.error.js';
import { PersonRenamedEvent } from '../../../shared/events/person-renamed.event.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';

@Injectable()
export class EmailEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly emailFactory: EmailFactory,
        private readonly emailRepo: EmailRepo,
        private readonly rolleRepo: RolleRepo,
        private readonly personRepository: PersonRepository,
        private readonly serviceProviderRepo: ServiceProviderRepo,
    ) {}

    @EventHandler(PersonenkontextCreatedEvent)
    public async asyncPersonenkontextCreatedEventHandler(event: PersonenkontextCreatedEvent): Promise<void> {
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
            const existingEmail: Option<Email<true>> = await this.emailRepo.findByPerson(event.personId);

            if (existingEmail) {
                await this.enableExistingEmail(existingEmail, event.personId);
            } else {
                await this.createNewEmail(event.personId);
            }
        }
    }

    private async enableExistingEmail(existingEmail: Email<true>, personId: PersonID): Promise<void> {
        const validEmail: Result<Email<true>> = await existingEmail.enable();
        this.logger.info(`Enabling existing email for person:${personId}`);
        if (!validEmail.ok) {
            this.logger.error(`Could not re-enable email, error is ${validEmail.error.message}`);
            return;
        }
        const persistedEmail: Email<true> | DomainError = await this.emailRepo.save(validEmail.value);
        if (persistedEmail instanceof Email) {
            this.logger.info(`Successfully re-enabled email with new address:${persistedEmail.currentAddress}`);
        }
    }

    private async createNewEmail(personId: PersonID): Promise<void> {
        const email: Email<false> = this.emailFactory.createNew(personId);
        const validEmail: Result<Email<false>> = await email.enable();
        if (!validEmail.ok) {
            this.logger.error(`Could not create email, error is ${validEmail.error.message}`);
            return;
        }
        const persistedEmail: Email<true> | DomainError = await this.emailRepo.save(validEmail.value);
        if (persistedEmail instanceof Email) {
            this.logger.info(`Successfully persisted email with new address:${persistedEmail.currentAddress}`);
        }
    }

    @EventHandler(PersonenkontextDeletedEvent)
    // eslint-disable-next-line @typescript-eslint/require-await
    public async asyncPersonenkontextDeletedEventHandler(event: PersonenkontextDeletedEvent): Promise<void> {
        this.logger.info(
            `Received PersonenkontextDeletedEvent, personId:${event.personId}, orgaId:${event.organisationId}, rolleId:${event.rolleId}`,
        );
        // currently receiving of this event is not causing a deletion of email and the related addresses for the affected user, this is intentional
    }

    @EventHandler(PersonDeletedEvent)
    public async asyncPersonDeletedEventHandler(event: PersonDeletedEvent): Promise<void> {
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

    @EventHandler(PersonRenamedEvent)
    public async asyncPersonRenamedEventHandler(event: PersonRenamedEvent): Promise<void> {
        this.logger.info(`Received PersonRenamedEvent, personId:${event.personId}`);

        const email: Option<Email<true>> = await this.emailRepo.findByPerson(event.personId);
        if (!email) {
            this.logger.info(
                `No existing email-addresses found for personId:${event.personId}, renaming has no effect`,
            );
            return;
        }

        const person: Option<Person<true>> = await this.personRepository.findById(event.personId);
        if (!person) {
            this.logger.error(`No person found for personId:${event.personId}, renaming email-address not possible`);
            return;
        }

        const changedEmail: Result<Email<true>> = await email.changeAddress({
            vorname: person.vorname,
            familienname: person.familienname,
        });
        if (!changedEmail.ok) {
            this.logger.error(
                `Changing email-address for personId:${event.personId}, with vorname:${person.vorname}, familienname:${person.familienname} failed`,
            );
            return;
        }
        await this.emailRepo.save(changedEmail.value);
        this.logger.info(`Added new address for personId:${event.personId}, renaming executed successfully`);
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
