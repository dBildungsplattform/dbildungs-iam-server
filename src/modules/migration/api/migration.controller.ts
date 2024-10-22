import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { ClassLogger } from '../../../core/logging/class-logger.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { Public } from '../../authentication/api/public.decorator.js';
import { KeycloakClientService } from '../../keycloak-administration/domain/keycloak-client.service.js';
import { ClientByIdParams } from './client-by-id.params.js';

@Controller({ path: 'migration' })
@ApiExcludeController()
export class MigrationController {
    public constructor(
        private readonly keycloakClientService: KeycloakClientService,
        private readonly logger: ClassLogger,
    ) {}

    @Put('kc-client/:id')
    @Public()
    public async updateKeycloakClient(
        @Param() params: ClientByIdParams,
        @Body() body: object,
    ): Promise<{ success: boolean; message?: string }> {
        const result: Result<unknown, DomainError> = await this.keycloakClientService.updateClient(params.id, body);

        if (!result.ok) {
            this.logger.error('Could not update keycloak client', result.error);
        }

        return { success: result.ok };
    }
}
