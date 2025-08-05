import { OXContextID, OXContextName } from '../../../shared/types/ox-ids.types.js';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { OxConfig } from '../../../shared/config/ox.config.js';
import { PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { EmailAddress, EmailAddressStatus } from '../../email/domain/email-address.js';
import { EmailRepo } from '../../email/persistence/email.repo.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';

export abstract class AbstractOxEventHandler {
    public ENABLED: boolean;

    protected readonly authUser: string;

    protected readonly authPassword: string;

    protected readonly contextID: OXContextID;

    protected readonly contextName: OXContextName;

    public constructor(
        protected readonly logger: ClassLogger,
        protected readonly emailRepo: EmailRepo,
        protected readonly eventService: EventRoutingLegacyKafkaService,
        protected configService: ConfigService<ServerConfig>,
    ) {
        const oxConfig: OxConfig = configService.getOrThrow<OxConfig>('OX');
        this.ENABLED = oxConfig.ENABLED;
        this.authUser = oxConfig.USERNAME;
        this.authPassword = oxConfig.PASSWORD;
        this.contextID = oxConfig.CONTEXT_ID;
        this.contextName = oxConfig.CONTEXT_NAME;
    }

    protected async getMostRecentEnabledOrRequestedEmailAddress(
        personId: PersonID,
    ): Promise<Option<EmailAddress<true>>> {
        const enabledEmailAddresses: Option<EmailAddress<true>[]> =
            await this.emailRepo.findByPersonSortedByUpdatedAtDesc(personId, EmailAddressStatus.ENABLED);
        if (!enabledEmailAddresses || !enabledEmailAddresses[0]) {
            this.logger.warning(`No ENABLED email-address found for personId:${personId}`);
        } else {
            return enabledEmailAddresses[0];
        }

        const requestedEmailAddresses: Option<EmailAddress<true>[]> =
            await this.emailRepo.findByPersonSortedByUpdatedAtDesc(personId, EmailAddressStatus.REQUESTED);
        if (!requestedEmailAddresses || !requestedEmailAddresses[0]) {
            this.logger.error(`Neither REQUESTED nor ENABLED email-address found for personId:${personId}`);
            return undefined;
        }
        this.logger.info(
            `Found mostRecentRequested Email-Address:${JSON.stringify(requestedEmailAddresses[0].address)} for personId:${personId}`,
        );

        return requestedEmailAddresses[0];
    }
}
