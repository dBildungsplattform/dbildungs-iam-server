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
import { Public } from '../../decorator/public.decorator.js';
import { GetEmailAddressForSpshPersonService } from '../../domain/get-email-address-for-spsh-person.service.js';
import { AddressWithStatusesDto } from '../dtos/address-with-statuses/address-with-statuses.dto.js';

@ApiTags('email')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'read' })
export class EmailReadController {
    public constructor(private readonly logger: ClassLogger,
        private readonly getEmailAddressForSpshPersonService: GetEmailAddressForSpshPersonService) {}

    @Get(':spshPersonId')
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
        this.logger.info(`PersonId:${findEmailAddressByPersonIdParams.spshPersonId}`);

        const addresses: AddressWithStatusesDto[] = await this.getEmailAddressForSpshPersonService
            .getEmailAddressWithStatusForSpshPerson(findEmailAddressByPersonIdParams);

        if (addresses.length === 0) {
            return [];
        }

        return addresses
            .filter(address => address.statuses.length > 0 && address.statuses[0] !== undefined)
            .map(address => new EmailAddressResponse(address.emailAddress, address.statuses[0]!));
    }
}
