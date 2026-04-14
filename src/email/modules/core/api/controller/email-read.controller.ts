import { Body, Controller, Get, Param, Post, UseFilters, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiInternalServerErrorResponse,
    ApiOAuth2,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    getSchemaPath,
} from '@nestjs/swagger';

import { FindEmailAddressBySpshPersonIdPathParams } from '../dtos/params/find-email-address-by-spsh-person-id.pathparams.js';
import { EmailAddressResponse } from '../dtos/response/email-address.response.js';
import { ClassLogger } from '../../../../../core/logging/class-logger.js';
import { Public } from '../../decorator/public.decorator.js';
import { EmailAddressRepo } from '../../persistence/email-address.repo.js';
import { OxService } from '../../../ox/domain/ox.service.js';
import { FindEmailAddressPathParams } from '../dtos/params/find-email-address.pathparams.js';
import { EmailAddressNotFoundError } from '../../error/email-address-not-found.error.js';
import { EmailExceptionFilter } from '../../error/email-exception-filter.js';
import { EmailAddressMissingStatusError } from '../../error/email-address-missing-status.error.js';
import { EmailAddress } from '../../domain/email-address.js';
import { EmailAddressStatusEnum } from '../../persistence/email-address-status.entity.js';
import { AuthGuard } from '@nestjs/passport';
import { FindEmailAddressBySpshPersonIdsBodyParams } from '../dtos/params/find-email-addresses-by-spsh-person-ids.bodyparams.js';

@ApiTags('email')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'read' })
@UseFilters(new EmailExceptionFilter())
@UseGuards(AuthGuard('api-key'))
export class EmailReadController {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly emailAddressRepo: EmailAddressRepo,
        private readonly oxService: OxService,
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
        @Param() findEmailAddressByPersonIdParams: FindEmailAddressBySpshPersonIdPathParams,
    ): Promise<EmailAddressResponse[]> {
        this.logger.info(`PersonId:${findEmailAddressByPersonIdParams.spshPersonId}`);

        const addresses: EmailAddress<true>[] = await this.emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(
            findEmailAddressByPersonIdParams.spshPersonId,
        );

        if (addresses.length === 0) {
            return [];
        }

        return addresses
            .map((address: EmailAddress<true>) => {
                const status: EmailAddressStatusEnum | undefined = address.getStatus();
                if (status) {
                    return new EmailAddressResponse(address, status, this.oxService.contextID);
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
        @Param() findEmailAddressByPersonIdParams: FindEmailAddressPathParams,
    ): Promise<Option<EmailAddressResponse>> {
        this.logger.info(`EmailAddress:${findEmailAddressByPersonIdParams.emailAddress}`);

        const emailAddress: Option<EmailAddress<true>> = await this.emailAddressRepo.findEmailAddress(
            findEmailAddressByPersonIdParams.emailAddress,
        );

        if (!emailAddress) {
            throw new EmailAddressNotFoundError(findEmailAddressByPersonIdParams.emailAddress);
        }

        const latestStatus: EmailAddressStatusEnum | undefined = emailAddress.getStatus();
        if (!latestStatus) {
            throw new EmailAddressMissingStatusError(emailAddress.address);
        }

        return new EmailAddressResponse(emailAddress, latestStatus, this.oxService.contextID);
    }

    @Post('spshpersons')
    @Public()
    @ApiOperation({ description: 'Get email-addresses by personIds.' })
    @ApiOkResponse({
        description: 'The email-addresses for corresponding persons were successfully returned.',
        schema: {
            type: 'object',
            additionalProperties: { $ref: getSchemaPath(EmailAddressResponse), nullable: true },
        },
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error while getting email-addresses by personIds.',
    })
    public async findEmailAddressesByPersonIds(
        @Body() findEmailAddressBySpshPersonIdsBodyParams: FindEmailAddressBySpshPersonIdsBodyParams,
    ): Promise<EmailAddressResponse[]> {
        const personIds: string[] = Array.from(new Set(findEmailAddressBySpshPersonIdsBodyParams.spshPersonIds));
        const count: number = personIds.length;
        this.logger.info(
            count === 0
                ? 'Received 0 PersonIds'
                : count === 1
                  ? `Received 1 PersonId: ${personIds[0]}`
                  : `Received ${count} PersonIds: ${personIds[0]} ... ${personIds[count - 1]}`,
        );

        const primaryEmails: EmailAddress<true>[] = await this.emailAddressRepo.findPrimaryBySpshPersonIds(personIds);

        return primaryEmails
            .map((addr: EmailAddress<true>) => {
                const status: EmailAddressStatusEnum | undefined = addr.getStatus();
                return status ? new EmailAddressResponse(addr, status, this.oxService.contextID) : null;
            })
            .filter((e: EmailAddressResponse | null): e is EmailAddressResponse => e !== null);
    }
}
