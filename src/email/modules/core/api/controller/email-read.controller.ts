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
import { AddressWithStatusesDescDto } from '../dtos/address-with-statuses/address-with-statuses-desc.dto.js';
import { EmailAddressStatus } from '../../domain/email-address-status.js';
import { EmailAddressRepo } from '../../persistence/email-address.repo.js';
import { OxService } from '../../../ox/domain/ox.service.js';

@ApiTags('email')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'read' })
export class EmailReadController {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly emailAddressRepo: EmailAddressRepo,
        private readonly oxService: OxService,
    ) {}

    @Get(':spshPersonId')
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
                    return new EmailAddressResponse(address.emailAddress, status, this.oxService.contextID);
                }
                return undefined;
            })
            .filter((response: EmailAddressResponse | undefined) => response !== undefined);
    }
}
