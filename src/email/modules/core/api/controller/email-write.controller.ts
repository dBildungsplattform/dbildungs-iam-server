import { Body, Controller, Post, UseFilters } from '@nestjs/common';
import { ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { EmailAddressResponse } from '../dtos/response/email-address.response.js';
import { SetEmailAddressForSpshPersonParams } from '../dtos/params/set-email-address-for-spsh-person.params.js';
import { SetEmailAddressForSpshPersonService } from '../../domain/set-email-address-for-spsh-person.service.js';
import { Public } from '../../decorator/public.decorator.js';
import { ClassLogger } from '../../../../../core/logging/class-logger.js';
import { EmailExceptionFilter } from '../../error/email-exception-filter.js';

@ApiTags('email')
@Controller({ path: 'write' })
@UseFilters(new EmailExceptionFilter())
export class EmailWriteController {
    public constructor(
        private readonly setEmailAddressForSpshPersonService: SetEmailAddressForSpshPersonService,
        private readonly logger: ClassLogger,
    ) {}

    @Post('set-email-for-person')
    @Public()
    @ApiOperation({ description: 'Set email-address for a person.' })
    @ApiOkResponse({
        description: 'The email-address for the corresponding person was successfully set.',
        type: [EmailAddressResponse],
    })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while setting email-address for person.' })
    public setEmailForPerson(@Body() params: SetEmailAddressForSpshPersonParams): void {
        // void the promise, we don't care about the result and the endpoint should instantly return
        void this.setEmailAddressForSpshPersonService.setEmailAddressForSpshPerson(params).catch((err: Error) => {
            this.logger.error(`Error in background email processing: ${err.message}`);
        });
    }
}
