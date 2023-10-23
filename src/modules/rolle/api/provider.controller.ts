import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { RolleService } from '../domain/rolle.service.js';
import { ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthenticatedUser } from 'nest-keycloak-connect';
import { GetServiceProviderInfoDo } from '../domain/get-service-provider-info.do.js';

@ApiTags('rolle')
@Controller({ path: 'provider' })
export class ProviderController {
    public constructor(private readonly rolleService: RolleService) {}

    @Get()
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available service providers.' })
    public async getServiceProvidersByPersonId(
        @AuthenticatedUser() user: unknown,
    ): Promise<GetServiceProviderInfoDo[]> {
        if (this.rolleService.hasKeycloakUserSub(user)) {
            return this.rolleService.getServiceProviderInfoListByUserSub(user.sub);
        }
        throw new HttpException('Not authorized to get available service providers', HttpStatus.UNAUTHORIZED);
    }
}
