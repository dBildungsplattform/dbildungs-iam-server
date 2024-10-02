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

export class DataImportWorkflowAggregate {
    public selectedOrganisationId?: string;

    public selectedRolleId?: string;

    private constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
    ) {}

    public static createNew(
        rolleRepo: RolleRepo,
        organisationRepository: OrganisationRepository,
    ): DataImportWorkflowAggregate {
        return new DataImportWorkflowAggregate(rolleRepo, organisationRepository);
    }

    // Initialize the aggregate with the selected Organisation and Rolle
    public initialize(organisationId?: string, rolleId?: string): void {
        this.selectedOrganisationId = organisationId;
        this.selectedRolleId = rolleId;
    }

    // Verifies if the selected rolle and organisation can together be assigned to a kontext
    // Also verifies again if the organisationId is allowed to be assigned by the admin
    public async validate(file: Express.Multer.File, permissions: PersonPermissions): Promise<DomainError | boolean> {
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

            //
            await this.parseCSVFile(file);
        }

        return true;
    }

    // Checks if the rolle can be assigned to the target organisation
    //TODO: use CheckReferences from PersonenkontextWorkflowAggregate
    public async checkReferences(organisationId: string, rolleId: string): Promise<Option<DomainError>> {
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

    public async checkPermissions(permissions: PersonPermissions): Promise<Option<DomainError>> {
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
}
