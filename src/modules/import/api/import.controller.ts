import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    ParseFilePipeBuilder,
    Post,
    UploadedFile,
    UseFilters,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConsumes,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOAuth2,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';
import { PersonExceptionFilter } from '../../person/api/person-exception-filter.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { DbiamPersonenkontextImportBodyParams } from './dbiam-personenkontext-import.body.params.js';
import { ImportConfig } from '../../../shared/config/import.config.js';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { ImportWorkflowFactory } from '../domain/import-workflow.factory.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { ImportWorkflowAggregate } from '../domain/import-workflow.js';
import { ServiceProviderResponse } from '../../service-provider/api/service-provider.response.js';
import { DbiamImportError } from './dbiam-import.error.js';
import { ImportvorgangByIdBodyParams } from './importvorgang-by-id.body.params.js';

@UseFilters(SchulConnexValidationErrorFilter, new AuthenticationExceptionFilter(), new PersonExceptionFilter())
@ApiTags('import')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'import' })
export class ImportController {
    public readonly IMPORT_FILE_MAXGROESSE_IN_BYTES: number;

    public constructor(
        private readonly importWorkflowFactory: ImportWorkflowFactory,
        config: ConfigService<ServerConfig>,
    ) {
        const fileMaxGroesseInMB: number = config.getOrThrow<ImportConfig>('IMPORT').IMPORT_FILE_MAXGROESSE_IN_MB;
        this.IMPORT_FILE_MAXGROESSE_IN_BYTES = fileMaxGroesseInMB * Math.pow(1024, 2);
    }

    @Post('upload')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    public async uploadFile(
        @Body() body: DbiamPersonenkontextImportBodyParams,
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({
                    fileType: 'text/csv',
                })
                .addMaxSizeValidator({
                    maxSize: 1048576,
                })
                .build({
                    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                    fileIsRequired: false,
                }),
        )
        file: Express.Multer.File,
        @Permissions() permissions: PersonPermissions,
    ): Promise<boolean> {
        //validate mime-type und max size (done)
        //neue Nutzerdaten mit Fehlern in die Datenbank schreiben
        //validierung ergebnis (anzahl der datensätze zu importieren)
        //daten importieren
        //personen & personenkontexte anlegen (5 Datensätze gleich in di DB speirchern)
        //ergbnis: benutzername + passwort in einem text bereitstellen
        //Download-Link zurückschicken.
        const importWorkflow: ImportWorkflowAggregate = this.importWorkflowFactory.createNew();
        importWorkflow.initialize(body.organisationId, body.rolleId);
        const result: DomainError | boolean = await importWorkflow.isValid(file, permissions);
        if (result instanceof DomainError) {
            throw result;
        }

        return result;
    }

    @Post('execute')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ description: 'Import transaction was executed successfully.', type: ServiceProviderResponse })
    @ApiNotFoundResponse({ description: 'The import transaction does not exist.' })
    @ApiBadRequestResponse({
        description: 'Something went wrong with the found import transaction.',
        type: DbiamImportError,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to execute the import transaction.' })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error while executing the import transaction.',
    })
    public async executeImport(@Body() body: ImportvorgangByIdBodyParams): Promise<ServiceProviderResponse> {}
}
