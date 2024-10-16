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
import { ImportTextFileCreationError } from './import-text-file-creation.error.js';
import { ImportCSVFileEmptyError } from './import-csv-file-empty.error.js';

export type ImportUploadResultFields = {
    importVorgangId: string;
    isValid: boolean;
};
export type OrganisationByIdAndName = Pick<Organisation<true>, 'id' | 'name'>;
export type TextFilePersonFields = {
    klasse: string | undefined;
    vorname: string;
    nachname: string;
    username: string | undefined;
    password: string | undefined;
};

export class ImportWorkflow {
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
    ): ImportWorkflow {
        return new ImportWorkflow(
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
    public async validateImport(
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
        try {
            //Optimierungsidee: 50 ImportDataItems per call direkt einmail parsen
            const parsedData: DomainError | ParseResult<CSVImportDataItemDTO> = await this.parseCSVFile(file);

            if (parsedData instanceof DomainError) {
                return parsedData;
            }

            //Datensätze persistieren
            //TODO: 50 ImportDataItems per call direkt einmail persistieren
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
        } catch (error) {
            return new ImportCSVFileParsingError([error]);
        }
    }

    public async executeImport(importvorgangId: string, permissions: PersonPermissions): Promise<Result<Buffer>> {
        const permissionCheckError: Option<DomainError> = await this.checkPermissions(permissions);
        if (permissionCheckError) {
            return {
                ok: false,
                error: permissionCheckError,
            };
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
        // Get all import data items with importvorgangId
        const textFilePersonFieldsList: TextFilePersonFields[] = [];
        //Optimierung: für das folgeTicket mit z.B. 800 Lehrer , muss der thread so manipuliert werden (sobald ein Resultat da ist, wird der nächste request abgeschickt)
        //Optimierung: Process 10 dataItems at time for createPersonWithPersonenkontexte
        // const offset: number = 0;
        // const limit: number = 10;
        const [importDataItems, total]: Counted<ImportDataItem<true>> =
            await this.importDataRepository.findByImportVorgangId(importvorgangId);
        if (total === 0) {
            return {
                ok: false,
                error: new EntityNotFoundError('ImportDataItem', importvorgangId),
            };
        }
        //create Person With PKs
        //We must create every peron individually otherwise it cannot assign the correct username when we have multiple users with the same name
        const savedPersonenWithPersonenkontext: (DomainError | PersonPersonenkontext)[] = [];
        /* eslint-disable no-await-in-loop */
        for (const importDataItem of importDataItems) {
            const klasse: OrganisationByIdAndName | undefined = klassenByIDandName.find(
                (organisationByIdAndName: OrganisationByIdAndName) =>
                    organisationByIdAndName.name?.toLowerCase() == importDataItem.klasse?.toLowerCase(),
            );
            if (!klasse) {
                //(ToDO => next ticket: validate every data item and collect all errors even on import execution)
                throw new EntityNotFoundError('Organisation', importDataItem.klasse, [
                    `Klasse=${importDataItem.klasse} for ${importDataItem.vorname} ${importDataItem.nachname} was not found`,
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

            const savedPersonWithPersonenkontext: DomainError | PersonPersonenkontext =
                await this.personenkontextCreationService.createPersonWithPersonenkontexte(
                    permissions,
                    importDataItem.vorname,
                    importDataItem.nachname,
                    createPersonenkontexte,
                );

            savedPersonenWithPersonenkontext.push(savedPersonWithPersonenkontext);
        }
        /* eslint-disable no-await-in-loop */

        //Save Benutzer + Passwort in the Liste
        savedPersonenWithPersonenkontext.forEach((personPersonenkontext: DomainError | PersonPersonenkontext) => {
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
                    nachname: personPersonenkontext.person.familienname,
                    username: personPersonenkontext.person.referrer,
                    password: personPersonenkontext.person.newPassword,
                });
            }
        });

        //Create text file.
        const result: Result<Buffer> = await this.createTextFile(textFilePersonFieldsList);

        if (result.ok) {
            await this.importDataRepository.deleteByImportVorgangId(importvorgangId);
        }

        return result;
    }

    public getFileName(importvorgangId: string): string {
        return importvorgangId + this.TEXT_FILENAME_NAME;
    }

    //Optimierung: CheckReferences auslagern?
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
            return new EntityNotFoundError('Rolle', rolleId);
        }

        //The aimed organisation needs to match the type of role to be assigned
        const organisationMatchesRollenart: OrganisationMatchesRollenart = new OrganisationMatchesRollenart();
        if (!organisationMatchesRollenart.isSatisfiedBy(orga, rolle)) {
            return new RolleNurAnPassendeOrganisationError();
        }

        return undefined;
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
        const csvContent: string = file.buffer.toString();
        if (!csvContent) {
            return new ImportCSVFileEmptyError();
        }

        return new Promise<ParseResult<CSVImportDataItemDTO>>(
            (
                resolve: (
                    value: ParseResult<CSVImportDataItemDTO> | PromiseLike<ParseResult<CSVImportDataItemDTO>>,
                ) => void,
            ) => {
                Papa.parse<CSVImportDataItemDTO>(csvContent, {
                    header: true,
                    skipEmptyLines: false,
                    transformHeader: (header: string) => header.toLowerCase().trim(),
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

    private async createTextFile(textFilePersonFieldsList: TextFilePersonFields[]): Promise<Result<Buffer>> {
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

        for (const textFilePersonFields of textFilePersonFieldsList) {
            const userInfo: string = `\n${textFilePersonFields.klasse} - ${textFilePersonFields.vorname} - ${textFilePersonFields.nachname} - ${textFilePersonFields.username} - ${textFilePersonFields.password}`;
            fileContent += userInfo;
        }

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
