import {
    Body,
    Controller,
    HttpStatus,
    ParseFilePipeBuilder,
    Post,
    UploadedFile,
    UseFilters,
    UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOAuth2, ApiTags } from '@nestjs/swagger';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';
import { PersonExceptionFilter } from '../../person/api/person-exception-filter.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { DbiamPersonenkontextImportBodyParams } from './dbiam-personenkontext-import.body.params.js';
import { ImportConfig } from '../../../shared/config/import.config.js';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '../../../shared/config/server.config.js';

@UseFilters(SchulConnexValidationErrorFilter, new AuthenticationExceptionFilter(), new PersonExceptionFilter())
@ApiTags('import')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'import' })
export class ImportController {
    public readonly IMPORT_FILE_MAXGROESSE_IN_BYTES: number;

    public constructor(config: ConfigService<ServerConfig>) {
        const fileMaxGroesseInMB: number = config.getOrThrow<ImportConfig>('IMPORT').IMPORT_FILE_MAXGROESSE_IN_MB;
        this.IMPORT_FILE_MAXGROESSE_IN_BYTES = fileMaxGroesseInMB * Math.pow(1024, 2);
    }

    @Post('upload')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    public uploadFile(
        @Body() body: DbiamPersonenkontextImportBodyParams,
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({
                    fileType: 'text/csv',
                })
                .addMaxSizeValidator({
                    maxSize: this.IMPORT_FILE_MAXGROESSE_IN_BYTES ?? 1000,
                })
                .build({
                    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                    fileIsRequired: false,
                }),
        )
        file: Express.Multer.File,
    ): void {
        //validate mime-type und max size (done)
        //neue Nutzerdaten mit Fehlern in die Datenbank schreiben
        //validierung ergebnis (anzahl der datensätze zu importieren)
        //daten importieren
        //personen & personenkontexte anlegen (5 Datensätze gleich in di DB speirchern)
        //ergbnis: benutzername + passwort in einem text bereitstellen
        //Download-Link zurückschicken.

        console.log('OrgaId: ' + body.organisationId);
        console.log('RolleId: ' + body.rolleId);
        console.log(file);
    }
}
