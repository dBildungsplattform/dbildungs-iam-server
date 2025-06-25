import { Controller, Get, UseFilters } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOAuth2,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Permissions } from '../../../../authentication/api/permissions.decorator.js';
import { PersonPermissions } from '../../../../authentication/domain/person-permissions.js';
import { ClassLogger } from '../../../../../core/logging/class-logger.js';
import { SchulConnexValidationErrorFilter } from '../../../../../shared/error/schulconnex-validation-error.filter.js';
import { AuthenticationExceptionFilter } from '../../../../authentication/api/authentication-exception-filter.js';
import { PersonInfoService } from './personen-info.service.js';
import { PersonInfoResponseV1 } from '../personinfo/v1/person-info.response.v1.js';

@UseFilters(SchulConnexValidationErrorFilter, new AuthenticationExceptionFilter())
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiTags('personen-info')
@Controller({ path: 'personen-info' })
export class PersonInfoController {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly personInfoService: PersonInfoService,
    ) {
        this.logger.info(`Creating ${PersonInfoController.name}`);
    }

    @Get()
    @ApiOperation({ summary: 'xxxx' })
    @ApiUnauthorizedResponse({ description: 'person is not logged in.' })
    @ApiOkResponse({ description: 'xxxx', type: PersonInfoResponseV1 })
    public infoV1(@Permissions() permissions: PersonPermissions): Promise<PersonInfoResponseV1[]> {
        return this.personInfoService.findPersonsForPersonenInfo(permissions);
    }
}
