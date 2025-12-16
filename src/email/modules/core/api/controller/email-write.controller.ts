import { Body, Controller, Delete, Param, Post, UseFilters } from '@nestjs/common';
import { ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SetEmailAddressForSpshPersonBodyParams } from '../dtos/params/set-email-address-for-spsh-person.bodyparams.js';
import { SetEmailAddressForSpshPersonService } from '../../domain/set-email-address-for-spsh-person.service.js';
import { Public } from '../../decorator/public.decorator.js';
import { ClassLogger } from '../../../../../core/logging/class-logger.js';
import { EmailExceptionFilter } from '../../error/email-exception-filter.js';
import { DeleteEmailAddressesForSpshPersonPathParams } from '../dtos/params/delete-email-addresses-for-spsh-person.pathparams.js';
import { DeleteEmailsAddressesForSpshPersonService } from '../../domain/delete-email-adresses-for-spsh-person.service.js';
import { SetEmailAddressForSpshPersonPathParams } from '../dtos/params/set-email-address-for-spsh-person.pathparams.js';
import { SetEmailAddressesSuspendedPathParams } from '../dtos/params/set-email-addresses-suspended.pathparams.js';
import { SetEmailSuspendedService } from '../../domain/set-email-suspended.service.js';

@ApiTags('email')
@Controller({ path: 'write' })
@UseFilters(new EmailExceptionFilter())
export class EmailWriteController {
    public constructor(
        private readonly setEmailAddressForSpshPersonService: SetEmailAddressForSpshPersonService,
        private readonly deleteEmailsAddressesForSpshPersonService: DeleteEmailsAddressesForSpshPersonService,
        private readonly setEmailSuspendedService: SetEmailSuspendedService,
        private readonly logger: ClassLogger,
    ) {}

    @Post(':spshPersonId/set-email')
    @Public()
    @ApiOperation({ description: 'Set email-address for a person.' })
    @ApiOkResponse({
        description: 'The email-address for the corresponding person was successfully set.',
    })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while setting email-address for person.' })
    public setEmailForPerson(
        @Param() pathParams: SetEmailAddressForSpshPersonPathParams,
        @Body() bodyParams: SetEmailAddressForSpshPersonBodyParams,
    ): void {
        // void the promise, we don't care about the result and the endpoint should instantly return
        void this.setEmailAddressForSpshPersonService
            .setEmailAddressForSpshPerson({
                spshPersonId: pathParams.spshPersonId,
                spshUsername: bodyParams.spshUsername,
                kennungen: bodyParams.kennungen,
                firstName: bodyParams.firstName,
                lastName: bodyParams.lastName,
                spshServiceProviderId: bodyParams.spshServiceProviderId,
            })
            .catch((err: Error) => {
                this.logger.error(`Error in background email processing: ${err.message}`);
            });
    }

    @Delete(':spshPersonId/delete-emails')
    @Public()
    @ApiOperation({ description: 'Delete email-addresses for a person.' })
    @ApiOkResponse({
        description: 'All email-addresses for the corresponding person were successfully deleted.',
    })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while setting email-address for person.' })
    public deleteEmailsForPerson(@Param() params: DeleteEmailAddressesForSpshPersonPathParams): void {
        // void the promise, we don't care about the result and the endpoint should instantly return
        void this.deleteEmailsAddressesForSpshPersonService
            .deleteEmailAddressesForSpshPerson({ spshPersonId: params.spshPersonId })
            .catch((err: Error) => {
                this.logger.error(`Error in background email processing: ${err.message}`);
            });
    }

    @Post(':spshPersonId/set-suspended')
    @Public()
    @ApiOperation({ description: 'Set email-address for a person to suspended.' })
    @ApiOkResponse({
        description: 'The email-address for the corresponding person was successfully set to suspended.',
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error while setting email-address for person to suspended.',
    })
    public setEmailsSuspended(@Param() params: SetEmailAddressesSuspendedPathParams): void {
        // void the promise, we don't care about the result and the endpoint should instantly return
        void this.setEmailSuspendedService
            .setEmailsSuspended({ spshPersonId: params.spshPersonId })
            .catch((err: Error) => {
                this.logger.error(`Error in background email processing: ${err.message}`);
            });
    }
}
