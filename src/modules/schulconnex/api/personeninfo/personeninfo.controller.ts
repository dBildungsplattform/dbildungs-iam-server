import { Controller, Get, UseFilters } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOAuth2,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Headers } from '@nestjs/common';
import { Permissions } from '../../../authentication/api/permissions.decorator.js';
import { PersonPermissions } from '../../../authentication/domain/person-permissions.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { SchulConnexValidationErrorFilter } from '../../../../shared/error/schulconnex-validation-error.filter.js';
import { AuthenticationExceptionFilter } from '../../../authentication/api/authentication-exception-filter.js';
import { PersonInfoResponseV1 } from '../personinfo/v1/person-info.response.v1.js';
import { PersonenInfoService } from '../../domain/personeninfo/personeninfo.service.js';
import { ExceedsLimitError } from '../../../../shared/error/exceeds-limit.error.js';
import { SchulConnexErrorMapper } from '../../../../shared/error/schul-connex-error.mapper.js';

const MAX_PERSONENINFO_LIMIT: number = 5000;

@UseFilters(SchulConnexValidationErrorFilter, new AuthenticationExceptionFilter())
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiTags('personen-info')
@Controller({ path: 'personen-info' })
export class PersonenInfoController {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly personInfoService: PersonenInfoService,
    ) {
        this.logger.info(`Creating ${PersonenInfoController.name}`);
    }

    @Get()
    @ApiOperation({
        summary: `liefert Personeninformationen basierend auf den Berechtigungen auf Service Provider des aufrufenden Nutzers. Das Limit (x-limit) darf maximal ${MAX_PERSONENINFO_LIMIT} betragen.`,
        description: `Das Limit (x-limit) darf maximal ${MAX_PERSONENINFO_LIMIT} betragen.`,
    })
    @ApiQuery({
        name: 'x-limit',
        required: false,
        description: `Maximale Anzahl der Ergebnisse (maximal ${MAX_PERSONENINFO_LIMIT})`,
        schema: { type: 'integer', maximum: MAX_PERSONENINFO_LIMIT },
    })
    @ApiQuery({
        name: 'x-offset',
        required: false,
        description: `Offset für die Ergebnisse (maximal ${MAX_PERSONENINFO_LIMIT})`,
        schema: { type: 'integer', maximum: MAX_PERSONENINFO_LIMIT },
    })
    @ApiUnauthorizedResponse({ description: 'person is not logged in.' })
    @ApiOkResponse({ description: 'Liste von Personeninformationen', type: PersonInfoResponseV1 })
    public infoV1(
        @Permissions() permissions: PersonPermissions,
        @Headers('x-offset') offset: string,
        @Headers('x-limit') limit: string,
    ): Promise<PersonInfoResponseV1[]> {
        const parsedOffset: number = Number.isNaN(parseInt(offset, 10)) ? 0 : parseInt(offset, 10);
        const parsedLimit: number = Number.isNaN(parseInt(limit, 10)) ? MAX_PERSONENINFO_LIMIT : parseInt(limit, 10);

        if (parsedLimit > MAX_PERSONENINFO_LIMIT) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new ExceedsLimitError(`Limit darf maximal ${MAX_PERSONENINFO_LIMIT} sein.`),
                ),
            );
        }

        return this.personInfoService.findPersonsForPersonenInfo(permissions, parsedOffset, parsedLimit);
    }
}
