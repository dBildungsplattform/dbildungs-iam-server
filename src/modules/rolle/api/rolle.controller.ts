import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

import { Rolle } from '../domain/rolle.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { CreateRolleBodyParams } from './create-rolle.body.params.js';
import { RolleResponse } from './rolle.response.js';

@ApiTags('rolle')
@Controller({ path: 'rolle' })
export class RolleController {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    @Post()
    @ApiCreatedResponse({ description: 'Create new rolle', type: RolleResponse })
    public async createRolle(@Body() params: CreateRolleBodyParams): Promise<RolleResponse> {
        const rolle: Rolle = this.mapper.map(params, CreateRolleBodyParams, Rolle);

        await rolle.save(this.rolleRepo);

        return this.mapper.map(rolle, Rolle, RolleResponse);
    }
}
