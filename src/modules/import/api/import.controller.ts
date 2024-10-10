import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseFilePipeBuilder,
    Post,
    Res,
    StreamableFile,
    UploadedFile,
    UseFilters,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConsumes,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOAuth2,
    ApiOkResponse,
    ApiProduces,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { DbiamPersonenkontextImportBodyParams } from './dbiam-personenkontext-import.body.params.js';
import { ImportConfig } from '../../../shared/config/import.config.js';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { ImportWorkflowFactory } from '../domain/import-workflow.factory.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { ImportUploadResultFields, ImportWorkflowAggregate } from '../domain/import-workflow.js';
import { DbiamImportError } from './dbiam-import.error.js';
import { ImportvorgangByIdBodyParams } from './importvorgang-by-id.body.params.js';
import { Response } from 'express';
import { ReadStream } from 'fs';
import { ImportvorgangByIdParams } from './importvorgang-by-id..params.js';
import { ImportUploadResponse } from './importvorgang-upload.response.js';
import { ImportDomainError } from '../domain/import-domain.error.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { ImportExceptionFilter } from './import-exception-filter.js';

@UseFilters(SchulConnexValidationErrorFilter, new AuthenticationExceptionFilter(), new ImportExceptionFilter())
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
        //Move to an helper
        const fileMaxGroesseInMB: number = config.getOrThrow<ImportConfig>('IMPORT').IMPORT_FILE_MAXGROESSE_IN_MB;
        this.IMPORT_FILE_MAXGROESSE_IN_BYTES = fileMaxGroesseInMB * Math.pow(1024, 2);
    }

    @Post('upload')
    @ApiConsumes('multipart/form-data')
    @ApiOkResponse({ description: 'Returns an import upload response object.', type: ImportUploadResponse })
    @ApiBadRequestResponse({ description: 'The CSV file was not valid.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to import data with a CSV file.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to import data with a CSV file.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while importing data with a CSV file.' })
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
    ): Promise<ImportUploadResponse> {
        const importWorkflow: ImportWorkflowAggregate = this.importWorkflowFactory.createNew();
        importWorkflow.initialize(body.organisationId, body.rolleId);
        const result: DomainError | ImportUploadResultFields = await importWorkflow.isValid(file, permissions);
        if (result instanceof DomainError) {
            if (result instanceof ImportDomainError) {
                throw result;
            }

            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result),
            );
        }

        return new ImportUploadResponse(result.importVorgangId, result.isValid);
    }

    @Post('execute')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ description: 'Import transaction was executed successfully.' })
    @ApiNotFoundResponse({ description: 'The import transaction does not exist.' })
    @ApiBadRequestResponse({
        description: 'Something went wrong with the found import transaction.',
        type: DbiamImportError,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to execute the import transaction.' })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error while executing the import transaction.',
    })
    public async executeImport(
        @Body() body: ImportvorgangByIdBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<void> {
        const importWorkflow: ImportWorkflowAggregate = this.importWorkflowFactory.createNew();
        importWorkflow.initialize(body.organisationId, body.rolleId);
        const result: Option<DomainError> = await importWorkflow.execute(body.importvorgangId, permissions);

        if (result instanceof DomainError) {
            if (result instanceof ImportDomainError) {
                throw result;
            }

            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result),
            );
        }
    }

    @ApiProduces('text/plain')
    @Get(':importvorgangId/download')
    @ApiOkResponse({
        description: 'The text file for the import transaction was successfully downloaded.',
        schema: {
            type: 'string',
            format: 'binary',
        },
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to download the import result file.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to download the import result file.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while downloading the import result file.' })
    public async downloadImportResultFile(
        @Param() params: ImportvorgangByIdParams,
        @Res({ passthrough: true }) res: Response,
        @Permissions() permissions: PersonPermissions,
    ): Promise<StreamableFile> {
        const importWorkflow: ImportWorkflowAggregate = this.importWorkflowFactory.createNew();
        const result: Result<ReadStream> = await importWorkflow.getFile(params.importvorgangId, permissions);
        if (!result.ok) {
            throw result.error;
        } else {
            //TODO: Delete DataItems & File
            const fileName: string = importWorkflow.getFileName(params.importvorgangId);
            const contentDisposition: string = `attachment; filename="${fileName}"`;
            res.set({
                'Content-Type': 'text/plain',
                'Content-Disposition': contentDisposition,
            });
            return new StreamableFile(result.value);
        }
    }
}
