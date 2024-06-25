import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { PersonenkontextDeletedEvent } from '../../../shared/events/personenkontext-deleted.event.js';
import { PersonenkontextCreatedEvent } from '../../../shared/events/personenkontext-created.event.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderKategorie } from '../../service-provider/domain/service-provider.enum.js';
import { EmailFactory } from './email.factory.js';
import { Email } from './email.js';
import { EmailRepo } from '../persistence/email.repo.js';
import { PersonDeletedEvent } from '../../../shared/events/person-deleted.event.js';
import { DomainError } from '../../../shared/error/index.js';
import { PersonID } from '../../../shared/types/index.js';

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
            const existingEmail: Option<Email<true, true>> = await this.emailRepo.findByPerson(event.personId);

            if (existingEmail) {
                await this.enableExistingEmail(existingEmail, event.personId);
            } else {
                await this.createNewEmail(event.personId);
            }
        }
    }

    private async enableExistingEmail(existingEmail: Email<true, true>, personId: PersonID): Promise<void> {
        const validEmail: Result<Email<true, true>> = await existingEmail.enable();
        this.logger.info(`Enabling existing email for person:${personId}`);
        if (!validEmail.ok) {
            this.logger.error(`Could not re-enable email, error is ${validEmail.error.message}`);
            return;
        }
        const persistedEmail: Email<true, true> | DomainError = await this.emailRepo.save(validEmail.value);
        if (persistedEmail instanceof Email) {
            this.logger.info(`Successfully re-enabled email with new address:${persistedEmail.currentAddress}`);
        }
    }

    private async createNewEmail(personId: PersonID): Promise<void> {
        const email: Email<false, false> = this.emailFactory.createNew(personId);
        const validEmail: Result<Email<false, true>> = await email.enable();
        if (!validEmail.ok) {
            this.logger.error(`Could not create email, error is ${validEmail.error.message}`);
            return;
        }
        const persistedEmail: Email<true, true> | DomainError = await this.emailRepo.save(validEmail.value);
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
        const email: Option<Email<true, true>> = await this.emailRepo.findByPerson(event.personId);
        if (!email) {
            this.logger.error(`Could not find email for personId:${event.personId}`);
            return;
        }
        const result: boolean = await this.emailRepo.deleteById(email.id);
        if (result) {
            this.logger.info(`Deleted email for personId:${event.personId}`);
        } else {
            this.logger.error(`Deleting email-account(s) for personId:${event.personId} failed`);
        }
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

        return serviceProviders.some((sp: ServiceProvider<true>) => sp.kategorie === ServiceProviderKategorie.EMAIL);
    }
}
