import { Controller, Headers, Get, UseFilters } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOAuth2,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Permissions } from '../../../authentication/api/permissions.decorator.js';
import { PersonPermissions } from '../../../authentication/domain/person-permissions.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { SchulConnexValidationErrorFilter } from '../../../../shared/error/schulconnex-validation-error.filter.js';
import { AuthenticationExceptionFilter } from '../../../authentication/api/authentication-exception-filter.js';
import { PersonInfoResponseV1 } from '../personinfo/v1/person-info.response.v1.js';
import { PersonenInfoService } from '../../domain/personeninfo/personeninfo.service.js';
import { ExceedsLimitError } from '../../../../shared/error/exceeds-limit.error.js';
import { SchulConnexErrorMapper } from '../../../../shared/error/schul-connex-error.mapper.js';
import { ConfigService } from '@nestjs/config';
import { SchulconnexConfig } from '../../../../shared/config/schulconnex.config.js';

@UseFilters(SchulConnexValidationErrorFilter, new AuthenticationExceptionFilter())
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiTags('personen-info')
@Controller({ path: 'personen-info' })
export class PersonenInfoController {
    private readonly maxPersonenInfoLimit: number;

    public constructor(
        private readonly logger: ClassLogger,
        private readonly personInfoService: PersonenInfoService,
        private readonly configService: ConfigService,
    ) {
        this.logger.info(`Creating ${PersonenInfoController.name}`);
        this.maxPersonenInfoLimit = this.configService.getOrThrow<SchulconnexConfig>('SCHULCONNEX').LIMIT_PERSONENINFO;
    }

    @Get()
    @ApiOperation({
        summary: `liefert Personeninformationen basierend auf den Berechtigungen auf Service Provider des aufrufenden Nutzers.`,
        description: `liefert Personeninformationen basierend auf den Berechtigungen auf Service Provider des aufrufenden Nutzers.`,
    })
    @ApiQuery({
        name: 'x-limit',
        required: false,
        description: `Maximale Anzahl der Ergebnisse`,
        schema: { type: 'integer' },
    })
    @ApiQuery({
        name: 'x-offset',
        required: false,
        description: `Offset für die Ergebnisse`,
        schema: { type: 'integer' },
    })
    @ApiUnauthorizedResponse({ description: 'person is not logged in.' })
    @ApiOkResponse({ description: 'Liste von Personeninformationen', type: PersonInfoResponseV1 })
    public infoV1(
        @Permissions() permissions: PersonPermissions,
        @Headers('x-offset') offset: string,
        @Headers('x-limit') limit: string,
    ): Promise<PersonInfoResponseV1[]> {
        const parsedOffset: number = Number.isNaN(parseInt(offset, 10)) ? 0 : parseInt(offset, 10);
        const parsedLimit: number = Number.isNaN(parseInt(limit, 10)) ? this.maxPersonenInfoLimit : parseInt(limit, 10);

        if (parsedLimit > this.maxPersonenInfoLimit) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new ExceedsLimitError(`Limit darf maximal ${this.maxPersonenInfoLimit} sein.`),
                ),
            );
        }

        return this.personInfoService.findPersonsForPersonenInfo(permissions, parsedOffset, parsedLimit);
    }
}
