import { Controller, Get, Param } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiOAuth2,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { FindEmailAddressByPersonIdParams } from './find-email-address-by-person-id.params.js';
import { EmailAddressResponse } from './email-address.response.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EmailAddress, EmailAddressStatus } from '../../../modules/email/domain/email-address.js';

@ApiTags('email')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'read' })
export class EmailReadController {
    public constructor(private readonly logger: ClassLogger) {}

    @Get(':personId')
    @ApiOperation({ description: 'Get email-addresses by personId.' })
    @ApiOkResponse({
        description: 'The email-addresses for corresponding person were successfully returned.',
        type: [EmailAddressResponse],
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get email-addresses by personId.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to get email-addresses by personId.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting email-addresses by personId.' })
    // eslint-disable-next-line @typescript-eslint/require-await
    public async findEmailAddressesByPersonId(
        @Param() findEmailAddressByPersonIdParams: FindEmailAddressByPersonIdParams,
        //@Permissions() permissions: PersonPermissions,
    ): Promise<EmailAddressResponse[]> {
        //currently just a dummy
        this.logger.info(`PersonId:${findEmailAddressByPersonIdParams.personId}`);
        const emailAddress: EmailAddress<true> = EmailAddress.construct(
            '0',
            new Date(),
            new Date(),
            undefined,
            'test@schule-sh.de',
            EmailAddressStatus.ENABLED,
            undefined,
        );

        const response: EmailAddressResponse = new EmailAddressResponse(emailAddress);
        return [response];
    }
}
