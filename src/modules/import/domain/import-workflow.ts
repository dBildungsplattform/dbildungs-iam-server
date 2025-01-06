import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { RollenArt, RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { RolleNurAnPassendeOrganisationError } from '../../personenkontext/specification/error/rolle-nur-an-passende-organisation.js';
import { OrganisationMatchesRollenart } from '../../personenkontext/specification/organisation-matches-rollenart.js';
import Papa, { ParseResult } from 'papaparse';
import { CSVImportDataItemDTO } from './csv-import-data-item.dto.js';
import { ImportCSVFileParsingError } from './import-csv-file-parsing.error.js';
import { ImportDataRepository } from '../persistence/import-data.repository.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { ImportTextFileCreationError } from './import-text-file-creation.error.js';
import { ImportCSVFileEmptyError } from './import-csv-file-empty.error.js';
import { ImportNurLernAnSchuleUndKlasseError } from './import-nur-lern-an-schule-und-klasse.error.js';
import { ImportDomainErrorI18nTypes } from './import-i18n-errors.js';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ImportCSVFileInvalidHeaderError } from './import-csv-file-invalid-header.error.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ImportDataItem } from './import-data-item.js';
import { ImportVorgang } from './import-vorgang.js';
import { ImportVorgangRepository } from '../persistence/import-vorgang.repository.js';
import { ImportExecutedEvent } from '../../../shared/events/import-executed.event.js';
import { EventService } from '../../../core/eventbus/index.js';
import { ImportStatus } from './import.enums.js';
import { ImportDomainError } from './import-domain.error.js';
import { ImportPasswordEncryptor } from './import-password-encryptor.js';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { ImportConfig } from '../../../shared/config/import.config.js';
import { ImportCSVFileMaxUsersError } from './import-csv-file-max-users.error.js';
import { ImportCSVFileContainsNoUsersError } from './import-csv-file-contains-no-users.error.js';
import { ImportDataItemStatus } from './importDataItem.enum.js';

export type ImportUploadResultFields = {
    importVorgangId: string;
    isValid: boolean;
    totalImportDataItems: number;
    totalInvalidImportDataItems: number;
    invalidImportDataItems: ImportDataItem<false>[];
};
export type OrganisationByIdAndName = Pick<Organisation<true>, 'id' | 'name'>;
export type TextFilePersonFields = {
    klasse: string | undefined;
    vorname: string;
    nachname: string;
    username: string | undefined;
    password: string | undefined;
};

export type RolleAndOrganisationByName = {
    rollenName: string;
    organisationsname: string;
};

export class ImportWorkflow {
    public readonly TEXT_FILENAME_NAME: string = '_spsh_csv_import_ergebnis.txt';

    public readonly CSV_FILE_VALID_HEADERS: string[] = ['nachname', 'vorname', 'klasse'];

    private CSV_MAX_NUMBER_OF_USERS!: number;

    private selectedOrganisationId!: string;

    private selectedRolleId!: string;

    private constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
        private readonly importDataRepository: ImportDataRepository,
        private readonly importVorgangRepository: ImportVorgangRepository,
        private readonly importPasswordEncryptor: ImportPasswordEncryptor,
        private readonly eventService: EventService,
        private readonly logger: ClassLogger,
        private readonly config: ConfigService<ServerConfig>,
    ) {
        this.CSV_MAX_NUMBER_OF_USERS = this.config.getOrThrow<ImportConfig>('IMPORT').CSV_MAX_NUMBER_OF_USERS;
    }

    public static createNew(
        rolleRepo: RolleRepo,
        organisationRepository: OrganisationRepository,
        importDataRepository: ImportDataRepository,
        importVorgangRepository: ImportVorgangRepository,
        importPasswordEncryptor: ImportPasswordEncryptor,
        eventService: EventService,
        logger: ClassLogger,
        config: ConfigService<ServerConfig>,
    ): ImportWorkflow {
        return new ImportWorkflow(
            rolleRepo,
            organisationRepository,
            importDataRepository,
            importVorgangRepository,
            importPasswordEncryptor,
            eventService,
            logger,
            config,
        );
    }

    // Initialize the aggregate with the selected Organisation and Rolle
    private initialize(organisationId: string, rolleId: string): void {
        this.selectedOrganisationId = organisationId;
        this.selectedRolleId = rolleId;
    }

    // Check References and Permissions
    public async validateImport(
        file: Express.Multer.File,
        organisationId: string,
        rolleId: string,
        permissions: PersonPermissions,
    ): Promise<DomainError | ImportUploadResultFields> {
        this.initialize(organisationId, rolleId);
        const referenceCheck: DomainError | RolleAndOrganisationByName = await this.checkReferences(
            this.selectedOrganisationId,
            this.selectedRolleId,
        );
        if (referenceCheck instanceof DomainError) {
            return referenceCheck;
        }

        const permissionCheckError: Option<DomainError> = await this.checkPermissions(permissions);
        if (permissionCheckError) {
            return permissionCheckError;
        }

        //Parse Data
        let parsedDataItems: CSVImportDataItemDTO[] = [];
        try {
            const parsedData: DomainError | ParseResult<CSVImportDataItemDTO> = await this.parseCSVFile(file);
            if (parsedData instanceof DomainError) {
                return parsedData;
            }

            if (parsedData.errors.length > 0) {
                return new ImportCSVFileParsingError(parsedData.errors);
            }

            if (parsedData.data.length === 0) {
                return new ImportCSVFileContainsNoUsersError();
            }

            parsedDataItems = plainToInstance(CSVImportDataItemDTO, parsedData.data);
        } catch (error) {
            if (error instanceof ImportCSVFileInvalidHeaderError) {
                return error;
            }
            return new ImportCSVFileParsingError([error]);
        }

        //Optimierung: private methode gibt eine map zurück
        const klassenByIDandName: OrganisationByIdAndName[] = [];
        const klassen: Organisation<true>[] = await this.organisationRepository.findChildOrgasForIds([
            this.selectedOrganisationId,
        ]);
        klassen.forEach((value: Organisation<true>) => {
            if (value.typ === OrganisationsTyp.KLASSE) {
                klassenByIDandName.push({
                    id: value.id,
                    name: value.name,
                });
            }
        });

        const invalidImportDataItems: ImportDataItem<false>[] = [];

        if (permissions.personFields.username === undefined) {
            //log no username found for adminn instead of throwing an error
            return new EntityNotFoundError('Person', permissions.personFields.id);
        }
        //Create ImportVorgang
        const importVorgang: ImportVorgang<false> = ImportVorgang.createNew(
            permissions.personFields.username,
            referenceCheck.rollenName,
            referenceCheck.organisationsname,
            parsedDataItems.length,
            permissions.personFields.id,
            this.selectedRolleId,
            this.selectedOrganisationId,
        );

        const savedImportvorgang: ImportVorgang<true> = await this.importVorgangRepository.save(importVorgang);
        const totalImportDataItems: number = parsedDataItems.length;
        /* eslint-disable no-await-in-loop */
        while (parsedDataItems.length > 0) {
            const dataItems: CSVImportDataItemDTO[] = parsedDataItems.splice(0, 50);

            const importDataItems: ImportDataItem<false>[] = dataItems.map((value: CSVImportDataItemDTO) => {
                const importDataItemErrors: string[] = [];

                // Validate object
                for (const error of validateSync(value, { forbidUnknownValues: true })) {
                    if (error.constraints) {
                        for (const message of Object.values(error.constraints)) {
                            importDataItemErrors.push(message);
                        }
                    }
                }

                if (value.klasse) {
                    const klasse: OrganisationByIdAndName | undefined = klassenByIDandName.find(
                        (organisationByIdAndName: OrganisationByIdAndName) =>
                            organisationByIdAndName.name === value.klasse, //Klassennamen sind case sensitive
                    );

                    //Only check if the Klasse exists
                    //Do not need to check if the Klasse can be assigned to rolle for now, because we only impport RollenArt=LERN
                    if (!klasse) {
                        importDataItemErrors.push(ImportDomainErrorI18nTypes.IMPORT_DATA_ITEM_KLASSE_NOT_FOUND);
                    }
                }

                const importDataItem: ImportDataItem<false> = ImportDataItem.createNew(
                    savedImportvorgang.id,
                    value.nachname,
                    value.vorname,
                    value.klasse,
                    value.personalnummer,
                    importDataItemErrors,
                );

                if (importDataItemErrors.length > 0) {
                    invalidImportDataItems.push(importDataItem);
                }

                return importDataItem;
            });

            await this.importDataRepository.createAll(importDataItems);
        }
        /* eslint-disable no-await-in-loop */

        savedImportvorgang.validate(invalidImportDataItems.length);
        await this.importVorgangRepository.save(savedImportvorgang);

        return {
            importVorgangId: savedImportvorgang.id,
            isValid: invalidImportDataItems.length === 0,
            totalImportDataItems: totalImportDataItems,
            totalInvalidImportDataItems: invalidImportDataItems.length,
            invalidImportDataItems,
        };
    }

    public async executeImport(importvorgangId: string, permissions: PersonPermissions): Promise<Result<void>> {
        const permissionCheckError: Option<DomainError> = await this.checkPermissions(permissions);
        if (permissionCheckError) {
            return {
                ok: false,
                error: permissionCheckError,
            };
        }

        const importVorgang: Option<ImportVorgang<true>> = await this.importVorgangRepository.findById(importvorgangId);
        if (!importVorgang) {
            this.logger.warning(`Importvorgang: ${importvorgangId} not found`);
            return {
                ok: false,
                error: new EntityNotFoundError('ImportVorgang', importvorgangId),
            };
        }
        //Will never happen
        if (!importVorgang.organisationId) {
            this.logger.error(`Importvorgang:${importvorgangId} does not have an organisation id`);
            return {
                ok: false,
                error: new ImportDomainError('ImportVorgang is missing an organisation id', importvorgangId),
            };
        }
        if (!importVorgang.rolleId) {
            this.logger.error(`Importvorgang:${importvorgangId} does not have a rolle id`);
            return {
                ok: false,
                error: new ImportDomainError('ImportVorgang is missing a rolle id', importvorgangId),
            };
        }

        importVorgang.execute();
        await this.importVorgangRepository.save(importVorgang);

        this.eventService.publish(
            new ImportExecutedEvent(importvorgangId, importVorgang.organisationId, importVorgang.rolleId, permissions),
        );

        return {
            ok: true,
            value: undefined,
        };
    }

    public async downloadFile(importvorgangId: string, permissions: PersonPermissions): Promise<Result<Buffer>> {
        const permissionCheckError: Option<DomainError> = await this.checkPermissions(permissions);
        if (permissionCheckError) {
            return {
                ok: false,
                error: permissionCheckError,
            };
        }

        const importVorgang: Option<ImportVorgang<true>> = await this.importVorgangRepository.findById(importvorgangId);
        if (!importVorgang) {
            return {
                ok: false,
                error: new EntityNotFoundError('ImportVorgang', importvorgangId),
            };
        }
        //Will never happen
        if (!importVorgang.organisationId) {
            return {
                ok: false,
                error: new ImportDomainError('ImportVorgang is missing an organisation id', importvorgangId),
            };
        }
        if (!importVorgang.rolleId) {
            return {
                ok: false,
                error: new ImportDomainError('ImportVorgang is missing a rolle id', importvorgangId),
            };
        }

        if (importVorgang.status !== ImportStatus.FINISHED) {
            return {
                ok: false,
                error: new ImportDomainError('ImportVorgang is still in progress', importvorgangId),
            };
        }

        this.initialize(importVorgang.organisationId, importVorgang.rolleId);

        const [importDataItems, total]: Counted<ImportDataItem<true>> =
            await this.importDataRepository.findByImportVorgangId(importvorgangId);

        //TODO: Remove this in the next pagination ticket because we won't be creating the file in the backend anymore so we will just send all data items to the Frontend
        // There we will create the downloadable file with the successful data items and for the failed ones we just show them to the user separately.
        const successfulDataItems: ImportDataItem<true>[] = importDataItems.filter(
            (dataItem: ImportDataItem<true>) => dataItem.status === ImportDataItemStatus.SUCCESS,
        );

        if (total === 0) {
            return {
                ok: false,
                error: new EntityNotFoundError('ImportDataItem', importvorgangId),
            };
        }

        //Create text file.
        const result: Result<Buffer> = await this.createTextFile(successfulDataItems);

        if (result.ok) {
            importVorgang.complete();
            await this.importDataRepository.deleteByImportVorgangId(importvorgangId);
            this.logger.info(
                `Der Importvorgang ${importvorgangId} ist abgeschlossen (status=${importVorgang.status}).`,
            );
        } else {
            importVorgang.fail();
        }

        await this.importVorgangRepository.save(importVorgang);
        return result;
    }

    public getFileName(importvorgangId: string): string {
        return importvorgangId + this.TEXT_FILENAME_NAME;
    }

    public async cancelImport(importvorgangId: string, permissions: PersonPermissions): Promise<Result<void>> {
        const permissionCheckError: Option<DomainError> = await this.checkPermissions(permissions);
        if (permissionCheckError) {
            return {
                ok: false,
                error: permissionCheckError,
            };
        }

        const importVorgang: Option<ImportVorgang<true>> = await this.importVorgangRepository.findById(importvorgangId);
        if (!importVorgang) {
            return {
                ok: false,
                error: new EntityNotFoundError('ImportVorgang', importvorgangId),
            };
        }

        await this.importDataRepository.deleteByImportVorgangId(importvorgangId);

        importVorgang.cancel();
        await this.importVorgangRepository.save(importVorgang);

        return {
            ok: true,
            value: undefined,
        };
    }

    //Optimierung: CheckReferences auslagern?
    private async checkReferences(
        organisationId: string,
        rolleId: string,
    ): Promise<DomainError | RolleAndOrganisationByName> {
        const [orga, rolle]: [Option<Organisation<true>>, Option<Rolle<true>>] = await Promise.all([
            this.organisationRepository.findById(organisationId),
            this.rolleRepo.findById(rolleId),
        ]);

        if (!orga) {
            return new EntityNotFoundError('Organisation', organisationId);
        }

        if (!rolle) {
            return new EntityNotFoundError('Rolle', rolleId);
        }

        //Check if the rolle is rollenart LERN (for now we can only import LERN)
        if (rolle.rollenart !== RollenArt.LERN) {
            return new ImportNurLernAnSchuleUndKlasseError();
        }

        // Can rolle be assigned at target orga
        const canAssignRolle: boolean = await rolle.canBeAssignedToOrga(organisationId);
        if (!canAssignRolle) {
            return new EntityNotFoundError('Rolle', rolleId);
        }

        //The aimed organisation needs to match the type of role to be assigned
        const organisationMatchesRollenart: OrganisationMatchesRollenart = new OrganisationMatchesRollenart();
        if (!organisationMatchesRollenart.isSatisfiedBy(orga, rolle)) {
            return new RolleNurAnPassendeOrganisationError();
        }

        return {
            rollenName: rolle.name,
            organisationsname: orga.name ?? orga.kennung ?? orga.id,
        };
    }

    private async checkPermissions(permissions: PersonPermissions): Promise<Option<DomainError>> {
        const hasPermissionAtOrga: boolean = await permissions.hasSystemrechteAtRootOrganisation([
            RollenSystemRecht.IMPORT_DURCHFUEHREN,
        ]);

        if (!hasPermissionAtOrga) {
            return new MissingPermissionsError('Unauthorized to import data');
        }

        return undefined;
    }

    private async parseCSVFile(file: Express.Multer.File): Promise<DomainError | ParseResult<CSVImportDataItemDTO>> {
        const csvContent: string = file.buffer.toString().replace(/['"]+/g, '');
        if (!csvContent) {
            return new ImportCSVFileEmptyError();
        }

        if ((csvContent.match(/[\r\n]/g) || []).length - 1 > this.CSV_MAX_NUMBER_OF_USERS) {
            return new ImportCSVFileMaxUsersError();
        }

        return new Promise<ParseResult<CSVImportDataItemDTO>>(
            (
                resolve: (
                    value: ParseResult<CSVImportDataItemDTO> | PromiseLike<ParseResult<CSVImportDataItemDTO>>,
                ) => void,
            ) => {
                Papa.parse<CSVImportDataItemDTO>(csvContent, {
                    delimiter: ';',
                    delimitersToGuess: [';'],
                    header: true,
                    skipEmptyLines: true,
                    transformHeader: (header: string) => {
                        const trimmedHeader: string = header.toLowerCase().trim();
                        if (!this.CSV_FILE_VALID_HEADERS.includes(trimmedHeader)) {
                            throw new ImportCSVFileInvalidHeaderError([`Invalid header: ${header}`]);
                        }

                        return trimmedHeader;
                    },
                    transform: (value: string): string => {
                        return value.trim();
                    },
                    complete: (results: ParseResult<CSVImportDataItemDTO>) => {
                        return resolve(results);
                    },
                });
            },
        );
    }

    private async createTextFile(importedDataItems: ImportDataItem<true>[]): Promise<Result<Buffer>> {
        const [orga, rolle]: [Option<Organisation<true>>, Option<Rolle<true>>] = await Promise.all([
            this.organisationRepository.findById(this.selectedOrganisationId),
            this.rolleRepo.findById(this.selectedRolleId),
        ]);

        if (!orga) {
            return {
                ok: false,
                error: new EntityNotFoundError('Organisation', this.selectedOrganisationId),
            };
        }

        if (!rolle) {
            return {
                ok: false,
                error: new EntityNotFoundError('Rolle', this.selectedRolleId),
            };
        }

        let fileContent: string = '';

        const headerImportInfo: string = `Schule:${orga.name} - Rolle:${rolle.name}`;
        const headerUserInfo: string = '\n\nKlasse - Vorname - Nachname - Benutzername - Passwort';
        fileContent += headerImportInfo + headerUserInfo;
        /* eslint-disable no-await-in-loop */
        for (const importedDataItem of importedDataItems) {
            let password: string = ''; //will never happen that the password is empty
            if (importedDataItem.password) {
                password = await this.importPasswordEncryptor.decryptPassword(
                    importedDataItem.password,
                    importedDataItem.importvorgangId,
                );
            }

            const userInfo: string = `\n${importedDataItem.klasse} - ${importedDataItem.vorname} - ${importedDataItem.nachname} - ${importedDataItem.username} - ${password}`;
            fileContent += userInfo;
        }
        /* eslint-disable no-await-in-loop */

        try {
            const buffer: Buffer = Buffer.from(fileContent, 'utf8');
            return {
                ok: true,
                value: buffer,
            };
        } catch (error) {
            return {
                ok: false,
                error: new ImportTextFileCreationError([String(error)]),
            };
        }
    }
}
