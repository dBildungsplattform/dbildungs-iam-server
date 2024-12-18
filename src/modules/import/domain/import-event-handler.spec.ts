import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { ImportDataRepository } from '../persistence/import-data.repository.js';
import {
    PersonenkontextCreationService,
    PersonPersonenkontext,
} from '../../personenkontext/domain/personenkontext-creation.service.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { faker } from '@faker-js/faker';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { Person } from '../../person/domain/person.js';
import { LoggingTestModule } from '../../../../test/utils/logging-test.module.js';
import { ImportDataItem } from './import-data-item.js';
import { ImportVorgangRepository } from '../persistence/import-vorgang.repository.js';
import { ImportVorgang } from './import-vorgang.js';
import { ImportEventHandler } from './import-event-handler.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ImportExecutedEvent } from '../../../shared/events/import-executed.event.js';
import { RolleNurAnPassendeOrganisationError } from '../../personenkontext/specification/error/rolle-nur-an-passende-organisation.js';
import { ImportPasswordEncryptor } from './import-password-encryptor.js';
import { ImportDomainError } from './import-domain.error.js';
import { ImportStatus } from './import.enums.js';

describe('ImportEventHandler', () => {
    let module: TestingModule;
    let sut: ImportEventHandler;

    let organisationRepoMock: DeepMocked<OrganisationRepository>;
    let importDataRepositoryMock: DeepMocked<ImportDataRepository>;
    let personenkontextCreationServiceMock: DeepMocked<PersonenkontextCreationService>;
    let importVorgangRepositoryMock: DeepMocked<ImportVorgangRepository>;
    let loggerMock: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule],
            providers: [
                ImportEventHandler,
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
                },
                {
                    provide: ImportDataRepository,
                    useValue: createMock<ImportDataRepository>(),
                },
                {
                    provide: PersonenkontextCreationService,
                    useValue: createMock<PersonenkontextCreationService>(),
                },
                {
                    provide: PersonPermissions,
                    useValue: createMock<PersonPermissions>(),
                },
                {
                    provide: ImportVorgangRepository,
                    useValue: createMock<ImportVorgangRepository>(),
                },
                {
                    provide: ImportPasswordEncryptor,
                    useValue: createMock<ImportPasswordEncryptor>(),
                },
            ],
        }).compile();

        sut = module.get(ImportEventHandler);
        organisationRepoMock = module.get(OrganisationRepository);
        importDataRepositoryMock = module.get(ImportDataRepository);
        personenkontextCreationServiceMock = module.get(PersonenkontextCreationService);
        importVorgangRepositoryMock = module.get(ImportVorgangRepository);
        loggerMock = module.get(ClassLogger);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('handleExecuteImport', () => {
        const importvorgangId: string = faker.string.uuid();
        let event: ImportExecutedEvent;

        beforeEach(() => {
            event = createMock<ImportExecutedEvent>({ importVorgangId: importvorgangId });
        });

        it('should return EntityNotFoundError if a ImportVorgang does not exist', async () => {
            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.KLASSE, name: '1A' }),
            ]);
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(null);
            const error: DomainError = new EntityNotFoundError('ImportVorgang', importvorgangId);

            await expect(sut.handleExecuteImport(event)).rejects.toThrowError(error);

            expect(personenkontextCreationServiceMock.createPersonWithPersonenkontexte).not.toHaveBeenCalled();
        });

        it('should log error if the import transaction does not have any import data items', async () => {
            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.KLASSE }),
            ]);
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(
                DoFactory.createImportVorgang(true, { id: importvorgangId }),
            );
            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[], 0]);

            await sut.handleExecuteImport(event);

            expect(loggerMock.error).toHaveBeenCalledWith(
                `No import data itemns found for Importvorgang:${importvorgangId}`,
            );
            expect(personenkontextCreationServiceMock.createPersonWithPersonenkontexte).not.toHaveBeenCalled();
        });

        it('should return EntityNotFoundError if a klasse during the import execution was deleted', async () => {
            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.KLASSE, name: '1A' }),
            ]);
            const importvorgang: ImportVorgang<true> = DoFactory.createImportVorgang(true);
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(importvorgang);
            const importDataItem: ImportDataItem<true> = DoFactory.createImportDataItem(true, {
                importvorgangId: importvorgang.id,
                klasse: '1B',
            });
            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[importDataItem], 1]);

            const error: DomainError = new EntityNotFoundError('Organisation', importDataItem.klasse, [
                `Klasse=${importDataItem.klasse} for ${importDataItem.vorname} ${importDataItem.nachname} was not found`,
            ]);

            await expect(sut.handleExecuteImport(event)).rejects.toThrowError(error);
            expect(personenkontextCreationServiceMock.createPersonWithPersonenkontexte).not.toHaveBeenCalled();
            expect(importVorgangRepositoryMock.save).toHaveBeenCalledTimes(1);
        });

        it('should log error if the person and PKs were not saved successfully', async () => {
            const schule: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
            });
            const klasse: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.KLASSE,
                name: '1A',
            });
            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([klasse]);

            const importvorgang: ImportVorgang<true> = DoFactory.createImportVorgang(true);
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(importvorgang);
            const importDataItem: ImportDataItem<true> = DoFactory.createImportDataItem(true, {
                importvorgangId: importvorgang.id,
                klasse: '1A',
            });

            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[importDataItem], 1]);

            const error: DomainError = new RolleNurAnPassendeOrganisationError();
            personenkontextCreationServiceMock.createPersonWithPersonenkontexte.mockResolvedValueOnce(error);
            organisationRepoMock.findById.mockResolvedValueOnce(schule);

            const importDomainError: DomainError = new ImportDomainError(
                `The creation of person with personenkontexte for the import transaction:${importvorgang.id} failed`,
                importvorgang.id,
            );

            await expect(sut.handleExecuteImport(event)).rejects.toThrowError(importDomainError);

            expect(loggerMock.error).toHaveBeenCalledWith(
                `System hat versucht einen neuen Benutzer für ${importDataItem.vorname} ${importDataItem.nachname} anzulegen. Fehler: ${error.message}`,
            );
            expect(importDataRepositoryMock.save).not.toHaveBeenCalled();
            expect(importVorgangRepositoryMock.save).toHaveBeenCalledWith({
                ...importvorgang,
                status: ImportStatus.FAILED,
            });
        });

        it('should log error if the person has no start password', async () => {
            const schule: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
            });
            const klasse: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.KLASSE,
                name: '1A',
            });
            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([klasse]);

            const importvorgang: ImportVorgang<true> = DoFactory.createImportVorgang(true);
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(importvorgang);
            const importDataItem: ImportDataItem<true> = DoFactory.createImportDataItem(true, {
                importvorgangId: importvorgang.id,
                klasse: '1A',
            });

            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[importDataItem], 1]);

            const person: Person<true> = DoFactory.createPerson(true);
            const pks: PersonPersonenkontext = {
                person: person,
                personenkontexte: [
                    DoFactory.createPersonenkontext(true, { organisationId: schule.id }),
                    DoFactory.createPersonenkontext(true, { organisationId: klasse.id }),
                ],
            };
            personenkontextCreationServiceMock.createPersonWithPersonenkontexte.mockResolvedValueOnce(pks);
            organisationRepoMock.findById.mockResolvedValueOnce(schule);

            const error: DomainError = new ImportDomainError(
                `The creation for a password for the person with ID ${person.id} for the import transaction:${importvorgang.id} has failed`,
                importvorgang.id,
            );

            await expect(sut.handleExecuteImport(event)).rejects.toThrowError(error);

            expect(person.newPassword).toBeUndefined();
            expect(loggerMock.error).toHaveBeenCalledWith(`Person with ID ${person.id} has no start password!`);
            expect(importDataRepositoryMock.save).not.toHaveBeenCalled();
            expect(importVorgangRepositoryMock.save).toHaveBeenCalledWith({
                ...importvorgang,
                status: ImportStatus.FAILED,
            });
        });

        it('should log info if the person and PKs were saved successfully', async () => {
            const schule: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
            });
            const klasse: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.KLASSE,
                name: '1A',
            });
            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([klasse]);

            const importvorgang: ImportVorgang<true> = DoFactory.createImportVorgang(true);
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(importvorgang);
            const importDataItem: ImportDataItem<true> = DoFactory.createImportDataItem(true, {
                importvorgangId: importvorgang.id,
                klasse: '1A',
            });

            const person: Person<true> = Person.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.person.lastName(),
                faker.person.firstName(),
                '5',
                faker.lorem.word(),
                faker.lorem.word(),
                faker.string.uuid(),
            );
            person.resetPassword();
            const pks: PersonPersonenkontext = {
                person: person,
                personenkontexte: [
                    DoFactory.createPersonenkontext(true, { organisationId: schule.id }),
                    DoFactory.createPersonenkontext(true, { organisationId: klasse.id }),
                ],
            };
            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[importDataItem], 1]);
            personenkontextCreationServiceMock.createPersonWithPersonenkontexte.mockResolvedValueOnce(pks);

            await sut.handleExecuteImport(event);

            expect(loggerMock.info).toHaveBeenCalledWith(
                `System hat einen neuen Benutzer ${person.referrer} (${person.id}) angelegt.`,
            );
            expect(importDataRepositoryMock.replaceAll).toHaveBeenCalled();
            expect(importVorgangRepositoryMock.save).toHaveBeenCalledTimes(2);
        });
    });
});
