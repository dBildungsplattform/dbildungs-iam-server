import { Controller, Delete, UseFilters } from '@nestjs/common';
import { ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../decorator/public.decorator.js';
import { EmailExceptionFilter } from '../../error/email-exception-filter.js';
import { CronDeleteEmailsAddressesService } from '../../domain/cron-delete-email-addresses.service.js';

@ApiTags('email')
@Controller({ path: 'cron' })
@UseFilters(new EmailExceptionFilter())
export class EmailCronController {
    public constructor(private readonly cronDeleteEmailsAddressesService: CronDeleteEmailsAddressesService) {}

    @Delete('delete')
    @Public()
    @ApiOperation({ description: 'Delete all email addresses marked for deletion by cron' })
    @ApiOkResponse({
        description: 'All email addresses marked for deletion by cron have been deleted.',
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error while deleting email addresses marked for cron',
    })
    public deleteEmails(): void {
        void this.cronDeleteEmailsAddressesService.deleteEmailAddresses();
    }
}
