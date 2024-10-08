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
import { PersonenkontextCreationService } from '../../personenkontext/domain/personenkontext-creation.service.js';
import { DbiamCreatePersonenkontextBodyParams } from '../../personenkontext/api/param/dbiam-create-personenkontext.body.params.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';

export type OrganisationByIdAndName = Pick<Organisation<true>, 'id' | 'name'>;

export class ImportWorkflowAggregate {
    public selectedOrganisationId?: string;

    public selectedRolleId?: string;

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

    // Verifies if the selected rolle and organisation can together be assigned to a kontext
    // Check Permissions
    // Parse data and validate every data item
    public async isValid(file: Express.Multer.File, permissions: PersonPermissions): Promise<DomainError | boolean> {
        if (this.selectedOrganisationId && this.selectedRolleId) {
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
            //TODO: 5 bis 10 Datensätze per call
            const importVorgangId: string = faker.string.uuid();
            const promises: Promise<ImportDataItem<true>>[] = parsedData.data.map((value: CSVImportDataItemDTO) =>
                this.importDataRepository.create(
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

            return parsedData.errors.length > 0;
        }

        return false;
    }

    public async execute(
        importvorgangId: string,
        organisationId: string,
        rolleId: string,
        permissions: PersonPermissions,
    ): Promise<Option<DomainError>> {
        const permissionCheckError: Option<DomainError> = await this.checkPermissions(permissions);
        if (permissionCheckError) {
            return permissionCheckError;
        }
        //Klassenlist
        const klassenByIDandName: OrganisationByIdAndName[] = [];
        const klassen: Organisation<true>[] = await this.organisationRepository.findChildOrgasForIds([organisationId]);
        klassen.forEach((value: Organisation<true>) => {
            if (value.typ === OrganisationsTyp.KLASSE) {
                klassenByIDandName.push({
                    id: value.id,
                    name: value.name,
                });
            }
        });
        // Get all import data items with importvorgangId
        const offset: number = 0;
        const limit: number = 30;
        const [importDataItems, totalItems]: Counted<ImportDataItem<true>> =
            await this.importDataRepository.findByImportVorgangId(importvorgangId, offset, limit);
        //create Person With PKs
        const promises = importDataItems.map((importDataItem: ImportDataItem<true>) => {
            const klasse: OrganisationByIdAndName |undefined = klassenByIDandName.find((organisationByIdAndName: OrganisationByIdAndName) => organisationByIdAndName.name?.toLocaleLowerCase() == importDataItem.organisation?.toLocaleLowerCase());
            if (!klasse){
                //TODO return error: something went wrong
                return;
            }

            const createPersonenkontexte: DbiamCreatePersonenkontextBodyParams[] = [{
                organisationId: organisationId,
                rolleId: rolleId
            }, {
                organisationId: klasse.id,
                rolleId: rolleId
            }];

            return this.personenkontextCreationService.createPersonWithPersonenkontexte(
                permissions,
                importDataItem.vorname,
                importDataItem.familienname,
                createPersonenkontexte,
            );
        });

        const savedPersonWithPersonenkontext = await Promise.all(promises);

        //Save Benutzer + Passwort in the Liste
        //Create text file.

        return undefined;
    }

    // Checks if the rolle can be assigned to the target organisation
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

    private async buildPersonenkontexteForSchueler(
        parentOrganisationId: string,
    ): Promise<DbiamCreatePersonenkontextBodyParams> {
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
}
