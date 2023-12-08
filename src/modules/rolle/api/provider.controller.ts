import { Controller, Get, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { RolleService } from '../domain/rolle.service.js';
import { ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthenticatedUser } from 'nest-keycloak-connect';
import { GetServiceProviderInfoDo } from '../domain/get-service-provider-info.do.js';
import { getMapperToken } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { ServiceProviderInfoResponse } from './service-provider-info.response.js';

@ApiTags('provider')
@Controller({ path: 'provider' })
export class ProviderController {
    public constructor(
        private readonly rolleService: RolleService,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    @Get()
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available service providers.' })
    @ApiOkResponse({ type: [ServiceProviderInfoResponse] })
    public async getServiceProvidersByPersonId(
        @AuthenticatedUser() user: unknown,
    ): Promise<ServiceProviderInfoResponse[]> {
        if (this.rolleService.hasKeycloakUserSub(user)) {
            const provider: GetServiceProviderInfoDo[] = await this.rolleService.getServiceProviderInfoListByUserSub(
                user.sub,
            );

            return this.mapper.mapArray(provider, GetServiceProviderInfoDo, ServiceProviderInfoResponse);
        }
        throw new HttpException('Not authorized to get available service providers', HttpStatus.UNAUTHORIZED);
    }
}
