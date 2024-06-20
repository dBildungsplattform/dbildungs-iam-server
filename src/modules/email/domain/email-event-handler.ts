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

@Injectable()
export class EmailEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly emailFactory: EmailFactory,
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
            this.logger.error(`Rolle id:${event.rolleId} does NOT exist!`);
            return;
        }

        if (await this.rolleReferencesEmailServiceProvider(rolle)) {
            this.logger.info(`Received event for creation of PK with rolle that references email SP!`);
            const email: Email<false, false> = this.emailFactory.createNew(event.personId);
            const validEmail: Result<Email<false, true>> = await email.enable();
            if (validEmail.ok) {
                this.logger.info(`Created email with new address`);
            } else {
                this.logger.error(`Could not create email, error is ${validEmail.error.message}`);
            }
        }
    }

    @EventHandler(PersonenkontextDeletedEvent)
    public async asyncPersonenkontextDeletedEventHandler(event: PersonenkontextDeletedEvent): Promise<void> {
        this.logger.info(
            `Received PersonenkontextDeletedEvent, personId:${event.personId}, orgaId:${event.organisationId}, rolleId:${event.rolleId}`,
        );
        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(event.rolleId);
        if (!rolle) {
            this.logger.error(`Rolle id:${event.rolleId} does NOT exist!`);
            return;
        }
        if (await this.rolleReferencesEmailServiceProvider(rolle)) {
            this.logger.info(`Deleted PK with rolle that references email SP!`);
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
