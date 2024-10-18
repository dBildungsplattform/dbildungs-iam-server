import { Body, Controller, Put } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { DomainError } from '../../../shared/error/domain.error.js';
import { Public } from '../../authentication/api/public.decorator.js';
import { KeycloakClientService } from '../../keycloak-administration/domain/keycloak-client.service.js';
import { UpdateKeycloakClientParams } from './update-client.params.js';

// TODO: Errors, Swagger, Ingress
@Controller({ path: 'migration' })
@ApiExcludeController()
export class MigrationController {
    public constructor(private readonly keycloakClientService: KeycloakClientService) {}

    @Put('kc-client')
    @Public()
    public async updateKeycloakClient(@Body() body: UpdateKeycloakClientParams): Promise<{ ok: boolean }> {
        const result: Result<unknown, DomainError> = await this.keycloakClientService.updateClient(
            body.id,
            body.payload,
        );

        if (!result.ok) {
            throw result.error;
        }

        return { ok: true };
    }
}
