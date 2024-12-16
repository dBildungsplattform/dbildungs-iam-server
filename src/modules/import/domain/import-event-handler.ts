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
import { ImportDomainError } from './import-domain.error.js';
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
            return this.logger.error(`No import data itemns found for Importvorgang:${importvorgangId}`);
        }

        /* eslint-disable no-await-in-loop */
        while (importDataItems.length > 0) {
            const dataItemsToImport: ImportDataItem<true>[] = importDataItems.splice(0, 25);
            await this.savePersonWithPersonenkontext(
                importVorgang,
                dataItemsToImport,
                klassenByIDandName,
                event.permissions,
            );
        }

        importVorgang.finish();
        await this.importVorgangRepository.save(importVorgang);
    }

    private async savePersonWithPersonenkontext(
        importVorgang: ImportVorgang<true>,
        dataItems: ImportDataItem<true>[],
        klassenByIDandName: OrganisationByIdAndName[],
        permissions: PersonPermissions,
    ): Promise<void> {
        const importDataItemsWithLoginInfo: ImportDataItem<true>[] = [];
        //We must create every peron individually otherwise it cannot assign the correct username when we have multiple users with the same name
        /* eslint-disable no-await-in-loop */
        for (const importDataItem of dataItems) {
            const klasse: OrganisationByIdAndName | undefined = klassenByIDandName.find(
                (organisationByIdAndName: OrganisationByIdAndName) =>
                    organisationByIdAndName.name === importDataItem.klasse,
            );
            if (!klasse) {
                importVorgang.fail();
                await this.importVorgangRepository.save(importVorgang);

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

            if (!(savedPersonWithPersonenkontext instanceof DomainError)) {
                this.logger.info(
                    `System hat einen neuen Benutzer ${savedPersonWithPersonenkontext.person.referrer} (${savedPersonWithPersonenkontext.person.id}) angelegt.`,
                );
            } else {
                this.logger.error(
                    `System hat versucht einen neuen Benutzer für ${importDataItem.vorname} ${importDataItem.nachname} anzulegen. Fehler: ${savedPersonWithPersonenkontext.message}`,
                );

                throw new ImportDomainError(
                    `The creation of person with personenkontexte for the import transaction:${importVorgang.id} failed`,
                    importVorgang.id,
                );
            }

            if (!savedPersonWithPersonenkontext.person.newPassword) {
                this.logger.error(`Person with ID ${savedPersonWithPersonenkontext.person.id} has no start password!`);

                throw new ImportDomainError(
                    `The creation for a password for the person with ID ${savedPersonWithPersonenkontext.person.id} for the import transaction:${importVorgang.id} has failed`,
                    importVorgang.id,
                );
            }

            importDataItemsWithLoginInfo.push(
                ImportDataItem.construct(
                    importDataItem.id,
                    importDataItem.createdAt,
                    importDataItem.updatedAt,
                    importDataItem.importvorgangId,
                    importDataItem.nachname,
                    importDataItem.vorname,
                    importDataItem.klasse,
                    importDataItem.personalnummer,
                    importDataItem.validationErrors,
                    savedPersonWithPersonenkontext.person.referrer,
                    await this.importPasswordEncryptor.encryptPassword(
                        savedPersonWithPersonenkontext.person.newPassword,
                    ),
                ),
            );
        }
        /* eslint-disable no-await-in-loop */
        await Promise.allSettled(
            importDataItemsWithLoginInfo.map(async (importDataItem: ImportDataItem<true>) =>
                this.importDataRepository.save(importDataItem),
            ),
        );

        importVorgang.updateImportDataItems(dataItems.length);
        await this.importVorgangRepository.save(importVorgang);
    }
}
