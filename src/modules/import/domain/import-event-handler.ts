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
        const importDataItemsWithLoginInfo: ImportDataItem<true>[] = [];
        //Optimierung: für das folgeTicket mit z.B. 800 Lehrer , muss der thread so manipuliert werden (sobald ein Resultat da ist, wird der nächste request abgeschickt)
        //Optimierung: Process 10 dataItems at time for createPersonWithPersonenkontexte
        // const offset: number = 0;
        // const limit: number = 10;

        const importvorgangId: string = event.importVorgangId;
        const importVorgang: Option<ImportVorgang<true>> = await this.importVorgangRepository.findById(importvorgangId);
        if (!importVorgang) {
            //TODO: Log and return
            throw new EntityNotFoundError('ImportVorgang', importvorgangId);
        }

        const [importDataItems, total]: Counted<ImportDataItem<true>> =
            await this.importDataRepository.findByImportVorgangId(importvorgangId);
        if (total === 0) {
            //TODO: Log and return
            throw new EntityNotFoundError('ImportDataItem', importvorgangId);
        }

        //create Person With PKs
        //We must create every peron individually otherwise it cannot assign the correct username when we have multiple users with the same name
        const savedPersonenWithPersonenkontext: (DomainError | PersonPersonenkontext)[] = [];
        /* eslint-disable no-await-in-loop */
        for (const importDataItem of importDataItems) {
            const klasse: OrganisationByIdAndName | undefined = klassenByIDandName.find(
                (organisationByIdAndName: OrganisationByIdAndName) =>
                    organisationByIdAndName.name === importDataItem.klasse, //Klassennamen sind case sensitive
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

            // TODO: Refactor this. We want to save the persons in bulk, and not get bogged down with checks.
            // We should not use the CreationService here
            const savedPersonWithPersonenkontext: DomainError | PersonPersonenkontext =
                await this.personenkontextCreationService.createPersonWithPersonenkontexte(
                    event.permissions,
                    importDataItem.vorname,
                    importDataItem.nachname,
                    createPersonenkontexte,
                );

            if (!(savedPersonWithPersonenkontext instanceof DomainError)) {
                this.logger.info(
                    `System hat einen neuen Benutzer ${savedPersonWithPersonenkontext.person.referrer} (${savedPersonWithPersonenkontext.person.id}) angelegt.`,
                );
            } else {
                return this.logger.error(
                    `System hat versucht einen neuen Benutzer für ${importDataItem.vorname} ${importDataItem.nachname} anzulegen. Fehler: ${savedPersonWithPersonenkontext.message}`,
                );
            }

            savedPersonenWithPersonenkontext.push(savedPersonWithPersonenkontext);

            //saved import data items with username and password
            if (!savedPersonWithPersonenkontext.person.newPassword) {
                return this.logger.error(
                    `Person with ID ${savedPersonWithPersonenkontext.person.id} has no start password!`,
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

        importVorgang.finsih();
        await this.importVorgangRepository.save(importVorgang);
    }
}
