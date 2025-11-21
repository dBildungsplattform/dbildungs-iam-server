import { Controller, Get, Param, UseFilters } from '@nestjs/common';
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
import { AddressWithStatusesDescDto } from '../dtos/address-with-statuses/address-with-statuses-desc.dto.js';
import { EmailAddressStatus } from '../../domain/email-address-status.js';
import { EmailAddressRepo } from '../../persistence/email-address.repo.js';
import { FindEmailAddressParams } from '../dtos/params/find-email-address.params copy.js';
import { EmailAddressNotFoundError } from '../../error/email-address-not-found.error.js';
import { EmailExceptionFilter } from '../../error/email-exception-filter.js';
import { EmailAddressMissingStatusError } from '../../error/email-address-missing-status.error.js';

@ApiTags('email')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'read' })
@UseFilters(new EmailExceptionFilter())
export class EmailReadController {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly emailAddressRepo: EmailAddressRepo,
    ) {}

    @Get('spshperson/:spshPersonId')
    @Public()
    @ApiOperation({ description: 'Get email-addresses by personId.' })
    @ApiOkResponse({
        description: 'The email-addresses for corresponding person were successfully returned.',
        type: [EmailAddressResponse],
    })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting email-addresses by personId.' })
    public async findEmailAddressesByPersonId(
        @Param() findEmailAddressByPersonIdParams: FindEmailAddressBySpshPersonIdParams,
    ): Promise<EmailAddressResponse[]> {
        this.logger.info(`PersonId:${findEmailAddressByPersonIdParams.spshPersonId}`);

        const addresses: AddressWithStatusesDescDto[] =
            await this.emailAddressRepo.findAllEmailAddressesWithStatusesDescBySpshPersonId(
                findEmailAddressByPersonIdParams.spshPersonId,
            );

        if (addresses.length === 0) {
            return [];
        }

        return addresses
            .filter((address: AddressWithStatusesDescDto) => address.statuses.length > 0)
            .map((address: AddressWithStatusesDescDto) => {
                const status: EmailAddressStatus<true> | undefined = address.statuses.at(0);
                if (status) {
                    return new EmailAddressResponse(address.emailAddress, status);
                }
                return undefined;
            })
            .filter((response: EmailAddressResponse | undefined) => response !== undefined);
    }

    @Get('email/:emailAddress')
    @Public()
    @ApiOperation({ description: 'Get email-address response by email-address.' })
    @ApiOkResponse({
        description: 'The email-address response for corresponding email-address was successfully returned.',
        type: [EmailAddressResponse],
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error while getting email-address response by email-address.',
    })
    public async findEmailAddress(
        @Param() findEmailAddressByPersonIdParams: FindEmailAddressParams,
    ): Promise<Option<EmailAddressResponse>> {
        this.logger.info(`EmailAddress:${findEmailAddressByPersonIdParams.emailAddress}`);

        const emailAddressWithStatusDesc: Option<AddressWithStatusesDescDto> =
            await this.emailAddressRepo.findEmailAddressWithStatusDesc(findEmailAddressByPersonIdParams.emailAddress);
        if (!emailAddressWithStatusDesc) {
            throw new EmailAddressNotFoundError(findEmailAddressByPersonIdParams.emailAddress);
        }
        const latestStatus: EmailAddressStatus<true> | undefined = emailAddressWithStatusDesc.statuses.at(0);
        if (!latestStatus) {
            throw new EmailAddressMissingStatusError(emailAddressWithStatusDesc.emailAddress.address);
        }
        return new EmailAddressResponse(emailAddressWithStatusDesc.emailAddress, latestStatus);
    }
}
