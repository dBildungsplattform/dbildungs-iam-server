import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { DomainError } from '../../../shared/error/index.js';
import { OxConfig } from '../../../shared/config/ox.config.js';
import { OxService } from './ox.service.js';
import { CreateUserAction, CreateUserParams, CreateUserResponse } from '../actions/create-user.action.js';
import { PersonenkontextCreatedEvent } from '../../../shared/events/personenkontext-created.event.js';

@Injectable()
export class OxEventHandler {
    public ENABLED: boolean;

    private readonly authUser: string;

    private readonly authPassword: string;

    public constructor(
        private readonly logger: ClassLogger,
        private readonly oxService: OxService,
        configService: ConfigService<ServerConfig>,
    ) {
        const oxConfig: OxConfig = configService.getOrThrow<OxConfig>('OX');

        this.ENABLED = oxConfig.ENABLED === 'true';
        this.authUser = oxConfig.USERNAME;
        this.authPassword = oxConfig.PASSWORD;
    }

    @EventHandler(PersonenkontextCreatedEvent)
    public async handlePersonenkontextCreatedEvent(event: PersonenkontextCreatedEvent): Promise<void> {
        this.logger.info(
            `Received PersonenkontextCreatedEvent, personId:${event.personId}, organisationId:${event.organisationId}, rolleId:${event.rolleId}`,
        );

        if (!this.ENABLED) {
            this.logger.info('Not enabled, ignoring event.');
            return;
        }

        const params: CreateUserParams = {
            contextId: '1',
            anniversary: '2016-04-18',
            displayName: 'Tom Petersen',
            email1: 'tom.petersen@test.de',
            firstname: 'Tom',
            givenName: 'Tom',
            mailEnabled: true,
            lastname: 'Petersen',
            primaryEmail: 'tom.petersen@test.de',
            userPassword: 'TestPassword1',
            login: this.authUser,
            password: this.authPassword,
        };

        //maybe check if user already exists in OX?

        const action: CreateUserAction = new CreateUserAction(params);

        const result: Result<CreateUserResponse, DomainError> = await this.oxService.send(action);

        if (!result.ok) {
            return this.logger.error(`Could not create user in OX, error: ${result.error.message}`);
        }

        this.logger.info(`User created in OX`);
    }
}
