import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { ImportDataRepository } from '../persistence/import-data.repository.js';
import {
    PersonenkontextCreationService,
    PersonPersonenkontext,
} from '../../personenkontext/domain/personenkontext-creation.service.js';
import { DbiamCreatePersonenkontextBodyParams } from '../../personenkontext/api/param/dbiam-create-personenkontext.body.params.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { ImportDataItem } from './import-data-item.js';
import { ImportVorgang } from './import-vorgang.js';
import { ImportVorgangRepository } from '../persistence/import-vorgang.repository.js';
import { ImportExecutedEvent } from '../../../shared/events/import-executed.event.js';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { OrganisationByIdAndName } from './import-workflow.js';
import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ImportPasswordEncryptor } from './import-password-encryptor.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { ImportDataItemStatus } from './importDataItem.enum.js';
@Injectable()
export class ImportEventHandler {
    public selectedOrganisationId!: string;

    public selectedRolleId!: string;

    public constructor(
        private readonly organisationRepository: OrganisationRepository,
        private readonly importDataRepository: ImportDataRepository,
        private readonly personenkontextCreationService: PersonenkontextCreationService,
        private readonly importVorgangRepository: ImportVorgangRepository,
        private readonly importPasswordEncryptor: ImportPasswordEncryptor,
        private readonly logger: ClassLogger,
    ) {}

    @EventHandler(ImportExecutedEvent)
    public async handleExecuteImport(event: ImportExecutedEvent): Promise<void> {
        this.selectedOrganisationId = event.organisationId;
        this.selectedRolleId = event.rolleId;

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

        const importvorgangId: string = event.importVorgangId;
        const importVorgang: Option<ImportVorgang<true>> = await this.importVorgangRepository.findById(importvorgangId);
        if (!importVorgang) {
            throw new EntityNotFoundError('ImportVorgang', importvorgangId);
        }

        const [importDataItems, total]: Counted<ImportDataItem<true>> =
            await this.importDataRepository.findByImportVorgangId(importvorgangId);

        if (total === 0) {
            return this.logger.error(`No import data items found for Importvorgang:${importvorgangId}`);
        }

        let allItemsFailed: boolean = true;

        for (const dataItem of importDataItems) {
            try {
                // eslint-disable-next-line no-await-in-loop
                await this.savePersonWithPersonenkontext(dataItem, klassenByIDandName, event.permissions);

                if (dataItem.status === ImportDataItemStatus.SUCCESS) {
                    allItemsFailed = false; // if at least one item succeeded then the import process won't fail
                }
            } catch (error) {
                dataItem.status = ImportDataItemStatus.FAILED;
                this.logger.error(`Error processing data item ${dataItem.id}`);
            }

            // eslint-disable-next-line no-await-in-loop
            await this.importDataRepository.save(dataItem); // Update status in the database
            importVorgang.incrementTotalImportDataItems(1); // Increment by 1
            // eslint-disable-next-line no-await-in-loop
            await this.importVorgangRepository.save(importVorgang); // Save updated state
        }

        // Finalize the import process depending on the status on the items. If all items failed to be imported then we mark the whole import as failed. Otherwise it's finished.
        if (allItemsFailed) {
            importVorgang.fail();
        } else {
            importVorgang.finish();
        }
        await this.importVorgangRepository.save(importVorgang);
    }

    private async savePersonWithPersonenkontext(
        importDataItem: ImportDataItem<true>,
        klassenByIDandName: OrganisationByIdAndName[],
        permissions: PersonPermissions,
    ): Promise<void> {
        try {
            const klasse: OrganisationByIdAndName | undefined = klassenByIDandName.find(
                (organisationByIdAndName: OrganisationByIdAndName) =>
                    organisationByIdAndName.name === importDataItem.klasse,
            );

            if (!klasse) {
                this.logger.error(
                    `Klasse=${importDataItem.klasse} for ${importDataItem.vorname} ${importDataItem.nachname} was not found.`,
                );
                importDataItem.status = ImportDataItemStatus.FAILED;
                await this.importDataRepository.save(importDataItem);
                return;
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

            if (savedPersonWithPersonenkontext instanceof DomainError) {
                this.logger.error(
                    `Failed to create user for ${importDataItem.vorname} ${importDataItem.nachname}. Error: ${savedPersonWithPersonenkontext.message}`,
                );
                importDataItem.status = ImportDataItemStatus.FAILED;
                return;
            }

            if (!savedPersonWithPersonenkontext.person.newPassword) {
                this.logger.error(`Person with ID ${savedPersonWithPersonenkontext.person.id} has no start password!`);
                importDataItem.status = ImportDataItemStatus.FAILED;
                return;
            }

            importDataItem.username = savedPersonWithPersonenkontext.person.referrer;
            importDataItem.password = await this.importPasswordEncryptor.encryptPassword(
                savedPersonWithPersonenkontext.person.newPassword,
            );
            importDataItem.status = ImportDataItemStatus.SUCCESS;

            this.logger.info(
                `Created user ${savedPersonWithPersonenkontext.person.referrer} (${savedPersonWithPersonenkontext.person.id}).`,
            );
        } catch (error) {
            this.logger.error(
                `Unexpected error while processing item ${importDataItem.vorname} ${importDataItem.nachname}`,
            );
            importDataItem.status = ImportDataItemStatus.FAILED;
            await this.importDataRepository.save(importDataItem);
        }
    }
}
