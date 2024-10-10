import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { RolleNurAnPassendeOrganisationError } from '../../personenkontext/specification/error/rolle-nur-an-passende-organisation.js';
import { OrganisationMatchesRollenart } from '../../personenkontext/specification/organisation-matches-rollenart.js';
import Papa, { ParseResult } from 'papaparse';
import { CSVImportDataItemDTO } from './csv-import-data-item.dto.js';
import { ImportCSVFileParsingError } from './import-csv-file-parsing.error.js';
import { ImportDataRepository } from '../persistence/import-data.repository.js';
import { ImportDataItem } from './import-data-item.js';
import { faker } from '@faker-js/faker';
import {
    PersonenkontextCreationService,
    PersonPersonenkontext,
} from '../../personenkontext/domain/personenkontext-creation.service.js';
import { DbiamCreatePersonenkontextBodyParams } from '../../personenkontext/api/param/dbiam-create-personenkontext.body.params.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { createReadStream, promises as fs, ReadStream } from 'fs';
import { join } from 'path';
import { ImportTextFileCreationError } from './import-text-file-creation.error.js';
import { ImportTextFileNotFoundError } from './import-text-file-notfound.error.js';

export type ImportUploadResultFields = {
    importVorgangId: string;
    isValid: boolean;
};
export type OrganisationByIdAndName = Pick<Organisation<true>, 'id' | 'name'>;
export type TextFilePersonFields = {
    klasse: string | undefined;
    vorname: string;
    familienname: string;
    username: string | undefined;
    password: string | undefined;
};

export class ImportWorkflowAggregate {
    public readonly TEXT_FILENAME_NAME: string = '_spsh_csv_import_ergebnis.txt';

    public selectedOrganisationId!: string;

    public selectedRolleId!: string;

    private constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
        private readonly importDataRepository: ImportDataRepository,
        private readonly personenkontextCreationService: PersonenkontextCreationService,
    ) {}

    public static createNew(
        rolleRepo: RolleRepo,
        organisationRepository: OrganisationRepository,
        importDataRepository: ImportDataRepository,
        personenkontextCreationService: PersonenkontextCreationService,
    ): ImportWorkflowAggregate {
        return new ImportWorkflowAggregate(
            rolleRepo,
            organisationRepository,
            importDataRepository,
            personenkontextCreationService,
        );
    }

    // Initialize the aggregate with the selected Organisation and Rolle
    public initialize(organisationId: string, rolleId: string): void {
        this.selectedOrganisationId = organisationId;
        this.selectedRolleId = rolleId;
    }

    // Check References and Permissions
    // Parse data (ToDO => next ticket: validate every data item)
    public async isValid(
        file: Express.Multer.File,
        permissions: PersonPermissions,
    ): Promise<DomainError | ImportUploadResultFields> {
        const referenceCheckError: Option<DomainError> = await this.checkReferences(
            this.selectedOrganisationId,
            this.selectedRolleId,
        );
        if (referenceCheckError) {
            return referenceCheckError;
        }

        const permissionCheckError: Option<DomainError> = await this.checkPermissions(permissions);
        if (permissionCheckError) {
            return permissionCheckError;
        }

        //Parse Data
        const parsedData: ParseResult<CSVImportDataItemDTO> = await this.parseCSVFile(file);
        //Datensätze persistieren
        //TODO: 30 ImportDataItems per call
        const importVorgangId: string = faker.string.uuid();
        const promises: Promise<ImportDataItem<true>>[] = parsedData.data.map((value: CSVImportDataItemDTO) =>
            this.importDataRepository.save(
                ImportDataItem.createNew(
                    importVorgangId,
                    value.nachname,
                    value.vorname,
                    value.klasse,
                    value.personalnummer,
                ),
            ),
        );
        await Promise.all(promises);

        return {
            importVorgangId,
            isValid: parsedData.errors.length === 0,
        };
    }

    public async execute(importvorgangId: string, permissions: PersonPermissions): Promise<Option<DomainError>> {
        const permissionCheckError: Option<DomainError> = await this.checkPermissions(permissions);
        if (permissionCheckError) {
            return permissionCheckError;
        }

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
        // Get all import data items with importvorgangId
        const textFilePersonFieldsList: TextFilePersonFields[] = [];
        //TODO: Process 30 dataItems at time
        // const offset: number = 0;
        // const limit: number = 30;
        const [importDataItems, total]: Counted<ImportDataItem<true>> =
            await this.importDataRepository.findByImportVorgangId(importvorgangId);
        if (total === 0) {
            return new EntityNotFoundError('ImportDataItem', importvorgangId);
        }
        //create Person With PKs
        const promises: Promise<DomainError | PersonPersonenkontext>[] = importDataItems.map(
            (importDataItem: ImportDataItem<true>) => {
                const klasse: OrganisationByIdAndName | undefined = klassenByIDandName.find(
                    (organisationByIdAndName: OrganisationByIdAndName) =>
                        organisationByIdAndName.name?.toLocaleLowerCase() == importDataItem.klasse?.toLocaleLowerCase(),
                );
                if (!klasse) {
                    //(ToDO => next ticket: validate every data item)
                    throw new EntityNotFoundError('Organisation', importDataItem.klasse, [
                        `Klasse=${importDataItem.klasse} for ${importDataItem.vorname} ${importDataItem.familienname} was not found`,
                    ]);
                }

                const createPersonenkontexte: DbiamCreatePersonenkontextBodyParams[] = [
                    {
                        organisationId: this.selectedOrganisationId,
                        rolleId: this.selectedRolleId,
                    },
                    {
                        organisationId: klasse.id,
                        rolleId: this.selectedRolleId,
                    },
                ];

                const savedPersonWithPersonenkontext: Promise<DomainError | PersonPersonenkontext> =
                    this.personenkontextCreationService.createPersonWithPersonenkontexte(
                        permissions,
                        importDataItem.vorname,
                        importDataItem.familienname,
                        createPersonenkontexte,
                    );

                return savedPersonWithPersonenkontext;
            },
        );

        const savedPersonWithPersonenkontext: (DomainError | PersonPersonenkontext)[] = await Promise.all(promises);

        //Save Benutzer + Passwort in the Liste
        savedPersonWithPersonenkontext.map((personPersonenkontext: DomainError | PersonPersonenkontext) => {
            if (!(personPersonenkontext instanceof DomainError)) {
                const klasse: OrganisationByIdAndName | undefined = klassenByIDandName.find(
                    (klasseByIDandName: OrganisationByIdAndName) =>
                        personPersonenkontext.personenkontexte.some(
                            (pk: Personenkontext<true>) => pk.organisationId === klasseByIDandName.id,
                        ),
                );

                textFilePersonFieldsList.push({
                    klasse: klasse?.name,
                    vorname: personPersonenkontext.person.vorname,
                    familienname: personPersonenkontext.person.familienname,
                    username: personPersonenkontext.person.referrer,
                    password: personPersonenkontext.person.newPassword,
                });
            }
        });

        //Create text file.
        const fileCreated: undefined | DomainError = await this.createTextFile(
            importvorgangId,
            textFilePersonFieldsList,
        );

        if (fileCreated instanceof DomainError) {
            return fileCreated;
        }
        return undefined;
    }

    public async getFile(importvorgangId: string, permissions: PersonPermissions): Promise<Result<ReadStream>> {
        const permissionCheckError: Option<DomainError> = await this.checkPermissions(permissions);
        if (permissionCheckError) {
            return {
                ok: false,
                error: permissionCheckError,
            };
        }

        try {
            const fileName: string = this.getSafeFilePath(importvorgangId);
            const file: ReadStream = createReadStream(fileName);
            return {
                ok: true,
                value: file,
            };
        } catch (error) {
            return {
                ok: false,
                error: new ImportTextFileNotFoundError([String(error)]),
            };
        }
    }

    public getFileName(importvorgangId: string): string {
        return importvorgangId + this.TEXT_FILENAME_NAME;
    }

    //TODO: use CheckReferences from PersonenkontextWorkflowAggregate
    private async checkReferences(organisationId: string, rolleId: string): Promise<Option<DomainError>> {
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
        // Can rolle be assigned at target orga
        const canAssignRolle: boolean = await rolle.canBeAssignedToOrga(organisationId);
        if (!canAssignRolle) {
            return new EntityNotFoundError('Rolle', rolleId); // Rolle does not exist for the chosen organisation
        }

        //The aimed organisation needs to match the type of role to be assigned
        const organisationMatchesRollenart: OrganisationMatchesRollenart = new OrganisationMatchesRollenart();
        if (!organisationMatchesRollenart.isSatisfiedBy(orga, rolle)) {
            return new RolleNurAnPassendeOrganisationError();
        }

        return undefined;
    }

    private async checkPermissions(permissions: PersonPermissions): Promise<Option<DomainError>> {
        // Check if logged in person has permission
        const hasPermissionAtOrga: boolean = await permissions.hasSystemrechteAtRootOrganisation([
            RollenSystemRecht.IMPORT_DURCHFUEHREN,
        ]);

        // Missing permission on orga
        if (!hasPermissionAtOrga) {
            return new MissingPermissionsError('Unauthorized to import data');
        }

        return undefined;
    }

    private async parseCSVFile(file: Express.Multer.File): Promise<ParseResult<CSVImportDataItemDTO>> {
        const csvContent: string = file.buffer.toString();
        return new Promise<ParseResult<CSVImportDataItemDTO>>(
            (
                resolve: (
                    value: ParseResult<CSVImportDataItemDTO> | PromiseLike<ParseResult<CSVImportDataItemDTO>>,
                ) => void,
                reject: (reason?: ImportCSVFileParsingError) => void,
            ) => {
                Papa.parse<CSVImportDataItemDTO>(csvContent, {
                    header: true,
                    skipEmptyLines: true,
                    transformHeader: (header: string) => header.toLowerCase().trim(),
                    transform: (value: string): string => {
                        return value.trim();
                    },
                    complete: (results: ParseResult<CSVImportDataItemDTO>) => {
                        return resolve(results);
                    },
                    error: (error: Error) => {
                        return reject(new ImportCSVFileParsingError([error]));
                    },
                });
            },
        );
    }

    private async createTextFile(
        importvorgangId: string,
        textFilePersonFieldsList: TextFilePersonFields[],
    ): Promise<undefined | DomainError> {
        const schule: Option<Organisation<true>> = await this.organisationRepository.findById(
            this.selectedOrganisationId,
        );
        if (!schule) {
            return new EntityNotFoundError('Organisation', this.selectedOrganisationId);
        }

        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(this.selectedRolleId);
        if (!rolle) {
            return new EntityNotFoundError('Rolle', this.selectedRolleId);
        }

        const fileName: string = this.getSafeFilePath(importvorgangId);
        const headerImportInfo: string = `Schule:${schule.name} - Rolle:${rolle.name}`;
        const headerUserInfo: string = '\n\nKlasse - Vorname - Nachname - Benutzername - Passwort';

        try {
            await fs.writeFile(fileName, headerImportInfo, 'utf8');
            await fs.appendFile(fileName, headerUserInfo, 'utf8');
            /* eslint-disable no-await-in-loop */
            for (const textFilePersonFields of textFilePersonFieldsList) {
                const userInfo: string = `\n${textFilePersonFields.klasse} - ${textFilePersonFields.vorname} - ${textFilePersonFields.familienname} - ${textFilePersonFields.username} - ${textFilePersonFields.password}`;
                await fs.appendFile(fileName, userInfo, 'utf8');
            }
            /* eslint-disable no-await-in-loop */
        } catch (error) {
            return new ImportTextFileCreationError([String(error)]);
        }

        return undefined;
    }

    private getSafeFilePath(importvorgangId: string): string {
        return join('/imports', `${importvorgangId + this.TEXT_FILENAME_NAME}`);
    }
}
