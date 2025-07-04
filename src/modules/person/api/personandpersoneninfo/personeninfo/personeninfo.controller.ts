import { Controller, Get, UseFilters } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOAuth2,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Headers } from '@nestjs/common';
import { Permissions } from '../../../../authentication/api/permissions.decorator.js';
import { PersonPermissions } from '../../../../authentication/domain/person-permissions.js';
import { ClassLogger } from '../../../../../core/logging/class-logger.js';
import { SchulConnexValidationErrorFilter } from '../../../../../shared/error/schulconnex-validation-error.filter.js';
import { AuthenticationExceptionFilter } from '../../../../authentication/api/authentication-exception-filter.js';
import { PersonInfoResponseV1 } from '../personinfo/v1/person-info.response.v1.js';
import { PersonenInfoService } from './personeninfo.service.js';

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
        summary:
            'liefert Personeninformationen basierend auf den Berechtigungen auf Service Provider des aufrufenden Nutzers',
    })
    @ApiUnauthorizedResponse({ description: 'person is not logged in.' })
    @ApiOkResponse({ description: 'Liste von Personeninformationen', type: PersonInfoResponseV1 })
    public infoV1(
        @Permissions() permissions: PersonPermissions,
        @Headers('x-offset') offset: string,
        @Headers('x-limit') limit: string,
    ): Promise<PersonInfoResponseV1[]> {
        const parsedOffset: number = Number.isNaN(parseInt(offset, 10)) ? 0 : parseInt(offset, 10);
        const parsedLimit: number = Number.isNaN(parseInt(limit, 10)) ? 25 : parseInt(limit, 10);

        return this.personInfoService.findPersonsForPersonenInfo(permissions, parsedOffset, parsedLimit);
    }
}
