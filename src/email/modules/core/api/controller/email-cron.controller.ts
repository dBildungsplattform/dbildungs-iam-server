import { Controller, Delete, UseFilters } from '@nestjs/common';
import { ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../decorator/public.decorator.js';
import { EmailExceptionFilter } from '../../error/email-exception-filter.js';
import { CronDeleteEmailsAddressesService } from '../../domain/cron-delete-email-addresses.service.js';
import { ClassLogger } from '../../../../../core/logging/class-logger.js';

@ApiTags('email')
@Controller({ path: 'cron' })
@UseFilters(new EmailExceptionFilter())
export class EmailCronController {
    public constructor(
        private readonly cronDeleteEmailsAddressesService: CronDeleteEmailsAddressesService,
        private readonly logger: ClassLogger,
    ) {}

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
        this.cronDeleteEmailsAddressesService.deleteEmailAddresses().catch((err: unknown) => {
            this.logger.logUnknownAsError('Unexpected Error during deleteEmailAddresses', err);
        });
    }
}
