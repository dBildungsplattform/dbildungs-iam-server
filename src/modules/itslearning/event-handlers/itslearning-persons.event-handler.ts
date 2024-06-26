import { Injectable } from '@nestjs/common';
import { ItsLearningConfig, ServerConfig } from '../../../shared/config/index.js';
import { ConfigService } from '@nestjs/config';
import { ItsLearningIMSESService } from '../itslearning.service.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { PersonenkontextCreatedEvent } from '../../../shared/events/personenkontext-created.event.js';

@Injectable()
export class ItsLearningPersonsEventHandler {
    public ENABLED: boolean;

    public constructor(
        private readonly logger: ClassLogger,
        private readonly itsLearningService: ItsLearningIMSESService,
        configService: ConfigService<ServerConfig>,
    ) {
        const itsLearningConfig: ItsLearningConfig = configService.getOrThrow<ItsLearningConfig>('ITSLEARNING');

        this.ENABLED = itsLearningConfig.ENABLED === 'true';
    }

    @EventHandler(PersonenkontextCreatedEvent)
    public async createPersonenkontextEventHandler(event: PersonenkontextCreatedEvent): Promise<void> {
        this.logger.info(`Received PersonenkontextCreatedEvent, ${event.personId}`);

        if (!this.ENABLED) {
            this.logger.info('Not enabled, ignoring event.');
            return;
        }
    }
}
