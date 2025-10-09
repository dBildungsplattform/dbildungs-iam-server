import { Controller, Get, Param } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiInternalServerErrorResponse,
    ApiOAuth2,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';

import { FindEmailAddressBySpshPersonIdParams } from '../dtos/params/find-email-address-by-spsh-person-id.params.js';
import { EmailAddressResponse } from '../dtos/response/email-address.response.js';
import { ClassLogger } from '../../../../../core/logging/class-logger.js';
import { EmailAddress } from '../../domain/aggregates/email-address.js';
import { Public } from '../../decorator/public.decorator.js';
import { EmailAddressStatus } from '../../domain/aggregates/email-address-status.js';
import { EmailAddressStatusEnum } from '../../persistence/email-address-status.entity.js';

@ApiTags('email')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'read' })
export class EmailReadController {
    public constructor(private readonly logger: ClassLogger) {}

    @Get(':personId')
    @Public()
    @ApiOperation({ description: 'Get email-addresses by personId.' })
    @ApiOkResponse({
        description: 'The email-addresses for corresponding person were successfully returned.',
        type: [EmailAddressResponse],
    })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting email-addresses by personId.' })
    // eslint-disable-next-line @typescript-eslint/require-await
    public async findEmailAddressesByPersonId(
        @Param() findEmailAddressByPersonIdParams: FindEmailAddressBySpshPersonIdParams,
    ): Promise<EmailAddressResponse[]> {
        //currently just a dummy
        this.logger.info(`PersonId:${findEmailAddressByPersonIdParams.spshPersonId}`);
        const emailAddress: EmailAddress<true> = EmailAddress.construct({
            id: '0',
            createdAt: new Date(),
            updatedAt: new Date(),
            address: 'test@schule-sh.de',
            priority: 0,
            spshPersonId: undefined,
            oxUserId: undefined,
            markedForCron: undefined,
        });

        const emailStatus: EmailAddressStatus<true> = EmailAddressStatus.construct({
            id: '0',
            createdAt: new Date(),
            updatedAt: new Date(),
            emailAddressId: emailAddress.id,
            status: EmailAddressStatusEnum.PENDING,
        });

        const response: EmailAddressResponse = new EmailAddressResponse(emailAddress, emailStatus);
        return [response];
    }
}
