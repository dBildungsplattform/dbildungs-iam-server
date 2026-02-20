import { Controller, Delete, UseFilters } from '@nestjs/common';
import { ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../decorator/public.decorator.js';
import { EmailExceptionFilter } from '../../error/email-exception-filter.js';
import { CronDeleteEmailsAddressesService } from '../../domain/cron-delete-email-adresses.service.js';

@ApiTags('email')
@Controller({ path: 'cron' })
@UseFilters(new EmailExceptionFilter())
export class EmailCronController {
    public constructor(private readonly cronDeleteEmailsAddressesService: CronDeleteEmailsAddressesService) {}

    @Delete('delete')
    @Public()
    @ApiOperation({ description: 'Delete email-addresses for a person.' })
    @ApiOkResponse({
        description: 'All Email Adddresses marked for deletion have been deleted.',
    })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while setting email-address for person.' })
    public deleteEmails(): void {
        void this.cronDeleteEmailsAddressesService.deleteEmailAddresses();
    }
}
