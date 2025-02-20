import { Body, Controller, Get, HttpException, Put, UseFilters, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiOAuth2,
    ApiOkResponse,
    ApiOperation,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { DomainError, EntityNotFoundError, MissingPermissionsError } from '../../../shared/error/index.js';
import { MeldungResponse } from './meldung.response.js';
import { MeldungRepo } from '../persistence/meldung.repo.js';
import { Meldung } from '../domain/meldung.js';
import { MeldungStatus } from '../persistence/meldung.entity.js';
import { CreateOrUpdateMeldungBodyParams } from './create-or-update-meldung.body.params.js';
import { StepUpGuard } from '../../authentication/api/steup-up.guard.js';

@UseFilters(SchulConnexValidationErrorFilter, new AuthenticationExceptionFilter())
@ApiOAuth2(['openid'])
@ApiBearerAuth()
@Controller({ path: 'portal/meldung' })
export class MeldungController {
    public constructor(private readonly meldungRepo: MeldungRepo) {}

    @Get()
    @ApiOperation({ description: 'Get all meldungen.' })
    @ApiOkResponse({
        description: 'The meldungen were successfully returned.',
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available meldungen.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get meldungen.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all meldungen.' })
    public async getAllMeldungen(@Permissions() permissions: PersonPermissions): Promise<MeldungResponse[]> {
        const requiredSytsmrechte: RollenSystemRecht[] = [
            RollenSystemRecht.SCHULPORTAL_VERWALTEN,
            RollenSystemRecht.HINWEISE_BEARBEITEN,
        ];
        const hasRequiredSystemrechte: boolean =
            await permissions.hasSystemrechteAtRootOrganisation(requiredSytsmrechte);
        if (!hasRequiredSystemrechte) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new MissingPermissionsError(
                        'Schulportal Bearbeiten & Hinweise Bearbeiten Systemrecht Required For This Endpoint',
                    ),
                ),
            );
        }

        const meldungen: Meldung<true>[] = await this.meldungRepo.findAll();
        const meldungenResponses: MeldungResponse[] = meldungen.map(
            (meldung: Meldung<true>) => new MeldungResponse(meldung),
        );
        return meldungenResponses;
    }

    @Get('current')
    @ApiOperation({ description: 'Get current veroeffentlicht meldung.' })
    @ApiOkResponse({
        description: 'The meldung was successfully returned.',
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get current veroeffentlicht meldunge.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get meldungen.' })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error while getting current veroeffentlicht meldung.',
    })
    public async getCurrentMeldunge(): Promise<MeldungResponse | null> {
        const meldungen: Meldung<true>[] = await this.meldungRepo.findAll();
        const currentVeroeffentlichtMeldung: Meldung<true> | undefined = meldungen
            .filter((meldung: Meldung<true>) => meldung.status === MeldungStatus.VEROEFFENTLICHT)
            .sort(
                (a: Meldung<true>, b: Meldung<true>) =>
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
            )
            .at(0);
        if (!currentVeroeffentlichtMeldung) {
            return null;
        }

        return new MeldungResponse(currentVeroeffentlichtMeldung);
    }

    //Kann keine ID in der URL haben, da die Anforderung ist, dass dieser Endpunkt auch Resourcen erstellen kann
    @Put()
    @UseGuards(StepUpGuard)
    @ApiOkResponse({
        description: 'The meldung was successfully edited.',
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to modify the meldung.' })
    @ApiForbiddenResponse({ description: 'Not permitted to modify the meldung.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while modifying the meldung.' })
    public async createOrUpdateMeldung(
        @Body() body: CreateOrUpdateMeldungBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<MeldungResponse> {
        const requiredSytsmrechte: RollenSystemRecht[] = [
            RollenSystemRecht.SCHULPORTAL_VERWALTEN,
            RollenSystemRecht.HINWEISE_BEARBEITEN,
        ];
        const hasRequiredSystemrechte: boolean =
            await permissions.hasSystemrechteAtRootOrganisation(requiredSytsmrechte);
        if (!hasRequiredSystemrechte) {
            throw this.mapError(
                new MissingPermissionsError(
                    'Schulportal Bearbeiten & Hinweise Bearbeiten Systemrecht Required For This Endpoint',
                ),
            );
        }

        if (this.isUpdateRequest(body)) {
            return this.handleUpdateMeldung(body);
        }
        return this.handleCreateMeldung(body);
    }

    //Private Helpers Below

    private async handleCreateMeldung(body: CreateOrUpdateMeldungBodyParams): Promise<MeldungResponse> {
        const newMeldung: Meldung<false> | DomainError = Meldung.createNew(body.inhalt, body.status);
        if (newMeldung instanceof DomainError) {
            throw this.mapError(newMeldung);
        }
        return new MeldungResponse(await this.meldungRepo.save(newMeldung));
    }

    private async handleUpdateMeldung<T extends { id: string }>(
        body: CreateOrUpdateMeldungBodyParams & T,
    ): Promise<MeldungResponse> {
        const existingMeldung: Option<Meldung<true>> = await this.meldungRepo.findById(body.id);
        if (!existingMeldung) {
            throw this.mapError(new EntityNotFoundError('Meldung', body.id));
        }
        const updateResult: void | DomainError = existingMeldung.update(body.revision, body.inhalt, body.status);
        if (updateResult instanceof DomainError) {
            throw this.mapError(updateResult);
        }
        return new MeldungResponse(await this.meldungRepo.save(existingMeldung));
    }

    private mapError(error: DomainError): HttpException {
        return SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
            SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(error),
        );
    }

    private isUpdateRequest(
        body: CreateOrUpdateMeldungBodyParams,
    ): body is CreateOrUpdateMeldungBodyParams & { id: string } {
        return typeof body.id === 'string';
    }
}
