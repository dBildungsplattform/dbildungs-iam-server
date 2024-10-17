import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { ImportDataRepository } from '../persistence/import-data.repository.js';
import { ImportUploadResultFields, ImportWorkflow } from './import-workflow.js';
import {
    PersonenkontextCreationService,
    PersonPersonenkontext,
} from '../../personenkontext/domain/personenkontext-creation.service.js';
import { ImportWorkflowFactory } from './import-workflow.factory.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { faker } from '@faker-js/faker';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import Papa from 'papaparse';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import internal from 'stream';
import { ImportDataItem } from './import-data-item.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { ImportTextFileCreationError } from './import-text-file-creation.error.js';
import { RolleNurAnPassendeOrganisationError } from '../../personenkontext/specification/error/rolle-nur-an-passende-organisation.js';
import { Person } from '../../person/domain/person.js';
import { ImportCSVFileEmptyError } from './import-csv-file-empty.error.js';
import { ImportNurLernAnSchuleUndKlasseError } from './import-nur-lern-an-schule-und-klasse.error.js';

describe('ImportWorkflow', () => {
    let module: TestingModule;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let organisationRepoMock: DeepMocked<OrganisationRepository>;
    let importDataRepositoryMock: DeepMocked<ImportDataRepository>;
    let personenkontextCreationServiceMock: DeepMocked<PersonenkontextCreationService>;
    let sut: ImportWorkflow;
    let importWorkflowFactory: ImportWorkflowFactory;
    let personpermissionsMock: DeepMocked<PersonPermissions>;

    const SELECTED_ORGANISATION_ID: string = faker.string.uuid();
    const SELECTED_ROLLE_ID: string = faker.string.uuid();

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                ImportWorkflowFactory,
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
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
            ],
        }).compile();
        rolleRepoMock = module.get(RolleRepo);
        organisationRepoMock = module.get(OrganisationRepository);
        importDataRepositoryMock = module.get(ImportDataRepository);
        personenkontextCreationServiceMock = module.get(PersonenkontextCreationService);
        importWorkflowFactory = module.get(ImportWorkflowFactory);
        sut = importWorkflowFactory.createNew();
        personpermissionsMock = module.get(PersonPermissions);
    }, 10000000);

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('initialize', () => {
        it('should initialize the aggregate with the selected Organisation and Rolle', () => {
            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            expect(sut.selectedOrganisationId).toBe(SELECTED_ORGANISATION_ID);
            expect(sut.selectedRolleId).toBe(SELECTED_ROLLE_ID);
        });
    });

    describe('validateImport', () => {
        it('should return EntityNotFoundError if the organisation does not exist', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>();
            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            organisationRepoMock.findById.mockResolvedValueOnce(undefined);
            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                file,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(EntityNotFoundError);
        });

        it('should return EntityNotFoundError if the rolle does not exist', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>();
            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            organisationRepoMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));
            rolleRepoMock.findById.mockResolvedValueOnce(undefined);
            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                file,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(EntityNotFoundError);
            expect(organisationRepoMock.findById).toHaveBeenCalledWith(SELECTED_ORGANISATION_ID);
        });

        it('should return EntityNotFoundError if the rolle can not be assigned to organisation', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>();
            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            organisationRepoMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            rolleMock.rollenart = RollenArt.LERN;
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(false);
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);
            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                file,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(EntityNotFoundError);
            expect(rolleRepoMock.findById).toHaveBeenCalledWith(SELECTED_ROLLE_ID);
        });

        it('should return ImportNurLernAnSchuleUndKlasseError if the rolle is not rollenart LERN', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>();
            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            organisationRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE }),
            );
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            rolleMock.rollenart = RollenArt.LEHR;
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);
            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                file,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(ImportNurLernAnSchuleUndKlasseError);
            expect(organisationRepoMock.findById).toHaveBeenCalledWith(SELECTED_ORGANISATION_ID);
            expect(rolleRepoMock.findById).toHaveBeenCalledWith(SELECTED_ROLLE_ID);
        });

        it('should return RolleNurAnPassendeOrganisationError if the rolle does not pass to organisation', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>();
            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            organisationRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.LAND }),
            );
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            rolleMock.rollenart = RollenArt.LERN;
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);
            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                file,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(RolleNurAnPassendeOrganisationError);
            expect(organisationRepoMock.findById).toHaveBeenCalledWith(SELECTED_ORGANISATION_ID);
            expect(rolleRepoMock.findById).toHaveBeenCalledWith(SELECTED_ROLLE_ID);
        });

        it('should return MissingPermissionsError if the admin does not permissions to import data', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>();
            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            organisationRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE }),
            );
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            rolleMock.rollenart = RollenArt.LERN;
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);

            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(false);

            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                file,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(MissingPermissionsError);
        });

        it('should return ImportCSVFileEmptyError if the csv file is empty', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>();
            file.buffer = Buffer.from('');

            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            rolleMock.rollenart = RollenArt.LERN;
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            organisationRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE }),
            );
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);

            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);

            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                file,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(ImportCSVFileEmptyError);
            expect(importDataRepositoryMock.save).not.toHaveBeenCalled();
        });

        it('should call parser and importDataRepository', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>();
            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            rolleMock.rollenart = RollenArt.LERN;
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            organisationRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE }),
            );
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);

            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            const spyParse: jest.SpyInstance<
                internal.Duplex,
                [stream: typeof Papa.NODE_STREAM_INPUT, config?: Papa.ParseConfig<unknown, undefined> | undefined],
                unknown
            > = jest.spyOn(Papa, 'parse');

            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                file,
                personpermissionsMock,
            );
            expect(result).not.toBeInstanceOf(DomainError);
            expect(importDataRepositoryMock.save).toHaveBeenCalled();
            expect(spyParse).toHaveBeenCalled();
        });

        it('should return an import data item with error=IMPORT_DATA_ITEM_KLASSE_IS_EMPTY if klasse is missing', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>({
                buffer: Buffer.from('vorname;nachname;klasse\nMax;Mustermann;'),
            });
            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            rolleMock.rollenart = RollenArt.LERN;
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            organisationRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE }),
            );
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);

            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            const spyParse: jest.SpyInstance<
                internal.Duplex,
                [stream: typeof Papa.NODE_STREAM_INPUT, config?: Papa.ParseConfig<unknown, undefined> | undefined],
                unknown
            > = jest.spyOn(Papa, 'parse');

            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                file,
                personpermissionsMock,
            );

            if (result instanceof DomainError) {
                throw new Error(result.message);
            }

            expect(result.isValid).toBeFalsy();
            expect(result.invalidImportDataItems).toMatchObject([
                {
                    vorname: 'Max',
                    nachname: 'Mustermann',
                    klasse: '',
                    validationErrors: ['IMPORT_DATA_ITEM_KLASSE_IS_EMPTY'],
                } as ImportDataItem<false>,
            ]);
            expect(result.totalImportDataItems).toBe(1);
            expect(result.totalInvalidImportDataItems).toBe(1);
            expect(importDataRepositoryMock.save).toHaveBeenCalled();
            expect(spyParse).toHaveBeenCalled();
        });

        it('should return an import data item with error=IMPORT_DATA_ITEM_KLASSE_NOT_FOUND if klasse is not found at the schule', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>({
                buffer: Buffer.from('vorname;nachname;klasse\nMax;Mustermann;1A-fake'),
            });
            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            rolleMock.rollenart = RollenArt.LERN;
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            organisationRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE }),
            );
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);

            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            const spyParse: jest.SpyInstance<
                internal.Duplex,
                [stream: typeof Papa.NODE_STREAM_INPUT, config?: Papa.ParseConfig<unknown, undefined> | undefined],
                unknown
            > = jest.spyOn(Papa, 'parse');

            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.KLASSE, name: '1A' }),
            ]);

            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                file,
                personpermissionsMock,
            );

            if (result instanceof DomainError) {
                throw new Error(result.message);
            }

            expect(result.isValid).toBeFalsy();
            expect(result.invalidImportDataItems).toMatchObject([
                {
                    vorname: 'Max',
                    nachname: 'Mustermann',
                    klasse: '1A-fake',
                    validationErrors: ['IMPORT_DATA_ITEM_KLASSE_NOT_FOUND'],
                } as ImportDataItem<false>,
            ]);
            expect(result.totalImportDataItems).toBe(1);
            expect(result.totalInvalidImportDataItems).toBe(1);
            expect(importDataRepositoryMock.save).toHaveBeenCalled();
            expect(spyParse).toHaveBeenCalled();
        });

        it('should return import data items with errors if nachname or vorname is missing', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>({
                buffer: Buffer.from('vorname;nachname;klasse\n;Mustermann;1A\nPhael;;1B'),
            });
            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            rolleMock.rollenart = RollenArt.LERN;
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            organisationRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE }),
            );
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);

            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            const spyParse: jest.SpyInstance<
                internal.Duplex,
                [stream: typeof Papa.NODE_STREAM_INPUT, config?: Papa.ParseConfig<unknown, undefined> | undefined],
                unknown
            > = jest.spyOn(Papa, 'parse');

            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.KLASSE, name: '1A' }),
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.KLASSE, name: '1B' }),
            ]);

            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                file,
                personpermissionsMock,
            );

            if (result instanceof DomainError) {
                throw new Error(result.message);
            }

            expect(result.isValid).toBeFalsy();
            expect(result.invalidImportDataItems).toMatchObject([
                {
                    vorname: '',
                    nachname: 'Mustermann',
                    klasse: '1A',
                    validationErrors: ['IMPORT_DATA_ITEM_VORNAME_IS_EMPTY'],
                },
                {
                    vorname: 'Phael',
                    nachname: '',
                    klasse: '1B',
                    validationErrors: ['IMPORT_DATA_ITEM_NACHNAME_IS_EMPTY'],
                },
            ]);
            expect(result.totalImportDataItems).toBe(2);
            expect(result.totalInvalidImportDataItems).toBe(2);
            expect(importDataRepositoryMock.save).toHaveBeenCalled();
            expect(spyParse).toHaveBeenCalled();
        });
    });

    describe('executeImport', () => {
        it('should return MissingPermissionsError if the admin does not have permissions to execute the import transaction', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(false);

            const result: Result<Buffer> = await sut.executeImport(faker.string.uuid(), personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new MissingPermissionsError('Unauthorized to import data'),
            });
        });

        it('should return EntityNotFoundError if the import transaction does not exist', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.KLASSE }),
            ]);
            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[], 0]);
            const importvorgangId: string = faker.string.uuid();

            const result: Result<Buffer> = await sut.executeImport(importvorgangId, personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new EntityNotFoundError('ImportDataItem', importvorgangId),
            });
        });

        it('should return EntityNotFoundError if a klasse during the import execution was deleted', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.KLASSE, name: '1A' }),
            ]);

            const importvorgangId: string = faker.string.uuid();
            const importDataItem: ImportDataItem<true> = DoFactory.createImportDataItem(true, {
                importvorgangId,
                klasse: '1B',
            });
            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[importDataItem], 1]);

            const error: DomainError = new EntityNotFoundError('Organisation', importDataItem.klasse, [
                `Klasse=${importDataItem.klasse} for ${importDataItem.vorname} ${importDataItem.nachname} was not found`,
            ]);

            await expect(sut.executeImport(importvorgangId, personpermissionsMock)).rejects.toThrowError(error);
            expect(personenkontextCreationServiceMock.createPersonWithPersonenkontexte).not.toHaveBeenCalled();
        });

        it('should return the file buffer if the import transaction was executed successfully', async () => {
            const schule: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
            });
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            const klasse: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.KLASSE,
                name: '1A',
            });
            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([klasse]);

            const importvorgangId: string = faker.string.uuid();
            const importDataItem: ImportDataItem<true> = DoFactory.createImportDataItem(true, {
                importvorgangId,
                klasse: '1A',
            });

            const person: Person<true> = DoFactory.createPerson(true);
            const pks: PersonPersonenkontext = {
                person: person,
                personenkontexte: [
                    DoFactory.createPersonenkontext(true, { organisationId: schule.id }),
                    DoFactory.createPersonenkontext(true, { organisationId: klasse.id }),
                ],
            };
            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[importDataItem], 1]);
            personenkontextCreationServiceMock.createPersonWithPersonenkontexte.mockResolvedValueOnce(pks);
            organisationRepoMock.findById.mockResolvedValueOnce(schule);

            const rolle: Rolle<true> = DoFactory.createRolle(true);
            rolleRepoMock.findById.mockResolvedValueOnce(rolle);

            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            const result: Result<Buffer> = await sut.executeImport(importvorgangId, personpermissionsMock);

            if (!result.ok) {
                throw new Error(result.error.message);
            }
            expect(result.value).toBeInstanceOf(Buffer);

            const resultString: string = result.value.toString('utf8');
            expect(resultString).toContain(schule.name);
            expect(resultString).toContain(rolle.name);
            expect(resultString).toContain(person.vorname);
            expect(resultString).toContain(person.familienname);
            expect(resultString).toContain(klasse.name);
            expect(importDataRepositoryMock.deleteByImportVorgangId).toHaveBeenCalledWith(importvorgangId);
        });

        it('should return EntityNotFoundError if the schule is not found', async () => {
            const schule: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
            });
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            const klasse: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.KLASSE,
                name: '1A',
            });
            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([klasse]);

            const importvorgangId: string = faker.string.uuid();
            const importDataItem: ImportDataItem<true> = DoFactory.createImportDataItem(true, {
                importvorgangId,
                klasse: '1A',
            });
            const pks: PersonPersonenkontext = {
                person: DoFactory.createPerson(true),
                personenkontexte: [
                    DoFactory.createPersonenkontext(true, { organisationId: schule.id }),
                    DoFactory.createPersonenkontext(true, { organisationId: klasse.id }),
                ],
            };
            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[importDataItem], 1]);
            personenkontextCreationServiceMock.createPersonWithPersonenkontexte.mockResolvedValueOnce(pks);
            organisationRepoMock.findById.mockResolvedValueOnce(undefined);

            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            const result: Result<Buffer> = await sut.executeImport(importvorgangId, personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new EntityNotFoundError('Organisation', SELECTED_ORGANISATION_ID),
            });
        });

        it('should return EntityNotFoundError if the rolle is not found', async () => {
            const schule: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
            });
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            const klasse: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.KLASSE,
                name: '1A',
            });
            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([klasse]);

            const importvorgangId: string = faker.string.uuid();
            const importDataItem: ImportDataItem<true> = DoFactory.createImportDataItem(true, {
                importvorgangId,
                klasse: '1A',
            });
            const pks: PersonPersonenkontext = {
                person: DoFactory.createPerson(true),
                personenkontexte: [
                    DoFactory.createPersonenkontext(true, { organisationId: schule.id }),
                    DoFactory.createPersonenkontext(true, { organisationId: klasse.id }),
                ],
            };
            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[importDataItem], 1]);
            personenkontextCreationServiceMock.createPersonWithPersonenkontexte.mockResolvedValueOnce(pks);
            organisationRepoMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));
            rolleRepoMock.findById.mockResolvedValueOnce(undefined);

            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            const result: Result<Buffer> = await sut.executeImport(importvorgangId, personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new EntityNotFoundError('Rolle', SELECTED_ROLLE_ID),
            });
        });

        it('should return ImportTextFileCreationError if the text file cannot be created', async () => {
            const schule: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
            });
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            const klasse: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.KLASSE,
                name: '1A',
            });
            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([klasse]);

            const importvorgangId: string = faker.string.uuid();
            const importDataItem: ImportDataItem<true> = DoFactory.createImportDataItem(true, {
                importvorgangId,
                klasse: '1A',
            });
            const pks: PersonPersonenkontext = {
                person: DoFactory.createPerson(true),
                personenkontexte: [
                    DoFactory.createPersonenkontext(true, { organisationId: schule.id }),
                    DoFactory.createPersonenkontext(true, { organisationId: klasse.id }),
                ],
            };
            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[importDataItem], 1]);
            personenkontextCreationServiceMock.createPersonWithPersonenkontexte.mockResolvedValueOnce(pks);
            organisationRepoMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));
            rolleRepoMock.findById.mockResolvedValueOnce(DoFactory.createRolle(true));
            jest.spyOn(Buffer, 'from').mockImplementationOnce(() => {
                throw new Error('Error details');
            });

            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            const result: Result<Buffer> = await sut.executeImport(importvorgangId, personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new ImportTextFileCreationError([String('Error details')]),
            });
        });
    });

    describe('getFileName', () => {
        it('should return the right file name', () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(false);
            const importvorgangId: string = faker.string.uuid();
            const expectedFielName: string = importvorgangId + sut.TEXT_FILENAME_NAME;

            const result: string = sut.getFileName(importvorgangId);

            expect(result).toBe(expectedFielName);
        });
    });
});
