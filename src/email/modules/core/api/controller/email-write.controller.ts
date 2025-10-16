import { Body, Controller, Post } from '@nestjs/common';
import { ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { EmailAddressResponse } from '../dtos/response/email-address.response.js';
import { SetEmailAddressForSpshPersonParams } from '../dtos/params/set-email-addess-for-spsh-person.params.js';
import { SetEmailAddressForSpshPersonService } from '../../domain/set-email-address-for-spsh-person.service.js';
import { Public } from '../../decorator/public.decorator.js';

@ApiTags('email')
@Controller({ path: 'write' })
export class EmailWriteController {
    public constructor(private readonly setEmailAddressForSpshPersonService: SetEmailAddressForSpshPersonService) {}

    @Post('set-email-for-person')
    @Public()
    @ApiOperation({ description: 'Set email-address for a person.' })
    @ApiOkResponse({
        description: 'The email-address for the corresponding person was successfully set.',
        type: [EmailAddressResponse],
    })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while setting email-address for person.' })
    public async setEmailForPerson(@Body() params: SetEmailAddressForSpshPersonParams): Promise<void> {
        return this.setEmailAddressForSpshPersonService.setEmailAddressForSpshPerson(params);
    }
}
