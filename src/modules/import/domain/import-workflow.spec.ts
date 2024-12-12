import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { ImportDataRepository } from '../persistence/import-data.repository.js';
import { ImportUploadResultFields, ImportWorkflow } from './import-workflow.js';
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
import { Organisation } from '../../organisation/domain/organisation.js';
import { ImportTextFileCreationError } from './import-text-file-creation.error.js';
import { RolleNurAnPassendeOrganisationError } from '../../personenkontext/specification/error/rolle-nur-an-passende-organisation.js';
import { ImportCSVFileEmptyError } from './import-csv-file-empty.error.js';
import { ImportNurLernAnSchuleUndKlasseError } from './import-nur-lern-an-schule-und-klasse.error.js';
import { ImportCSVFileParsingError } from './import-csv-file-parsing.error.js';
import { ImportCSVFileInvalidHeaderError } from './import-csv-file-invalid-header.error.js';
import { LoggingTestModule } from '../../../../test/utils/logging-test.module.js';
import { ImportDataItem } from './import-data-item.js';
import { ImportVorgangRepository } from '../persistence/import-vorgang.repository.js';
import { ImportVorgang } from './import-vorgang.js';
import { ImportPasswordEncryptor } from './import-password-encryptor.js';
import { ImportDomainError } from './import-domain.error.js';
import { ImportStatus } from './import.enums.js';
import { EventModule } from '../../../core/eventbus/event.module.js';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { ImportCSVFileMaxUsersError } from './import-csv-file-max-users.error.js';
import { ImportCSVFileContainsNoUsersError } from './import-csv-file-contains-no-users.error.js';

describe('ImportWorkflow', () => {
    let module: TestingModule;
    let sut: ImportWorkflow;
    let importWorkflowFactory: ImportWorkflowFactory;

    let rolleRepoMock: DeepMocked<RolleRepo>;
    let organisationRepoMock: DeepMocked<OrganisationRepository>;
    let importDataRepositoryMock: DeepMocked<ImportDataRepository>;
    let importVorgangRepositoryMock: DeepMocked<ImportVorgangRepository>;
    let personpermissionsMock: DeepMocked<PersonPermissions>;
    let importPasswordEncryptorMock: DeepMocked<ImportPasswordEncryptor>;

    const SELECTED_ORGANISATION_ID: string = faker.string.uuid();
    const SELECTED_ROLLE_ID: string = faker.string.uuid();
    const FILE_MOCK: Express.Multer.File = createMock<Express.Multer.File>();

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule, EventModule, ConfigTestModule],
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
                    provide: ImportVorgangRepository,
                    useValue: createMock<ImportVorgangRepository>(),
                },
                {
                    provide: ImportDataRepository,
                    useValue: createMock<ImportDataRepository>(),
                },
                {
                    provide: ImportPasswordEncryptor,
                    useValue: createMock<ImportPasswordEncryptor>(),
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
        importVorgangRepositoryMock = module.get(ImportVorgangRepository);
        importWorkflowFactory = module.get(ImportWorkflowFactory);
        sut = importWorkflowFactory.createNew();
        personpermissionsMock = module.get(PersonPermissions);
        importPasswordEncryptorMock = module.get(ImportPasswordEncryptor);
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

    describe('validateImport', () => {
        it('should return EntityNotFoundError if the organisation does not exist', async () => {
            organisationRepoMock.findById.mockResolvedValueOnce(undefined);
            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                FILE_MOCK,
                SELECTED_ORGANISATION_ID,
                SELECTED_ROLLE_ID,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(EntityNotFoundError);
        });

        it('should return EntityNotFoundError if the rolle does not exist', async () => {
            organisationRepoMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));
            rolleRepoMock.findById.mockResolvedValueOnce(undefined);
            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                FILE_MOCK,
                SELECTED_ORGANISATION_ID,
                SELECTED_ROLLE_ID,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(EntityNotFoundError);
            expect(organisationRepoMock.findById).toHaveBeenCalledWith(SELECTED_ORGANISATION_ID);
        });

        it('should return EntityNotFoundError if the rolle can not be assigned to organisation', async () => {
            organisationRepoMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            rolleMock.rollenart = RollenArt.LERN;
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(false);
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);
            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                FILE_MOCK,
                SELECTED_ORGANISATION_ID,
                SELECTED_ROLLE_ID,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(EntityNotFoundError);
            expect(rolleRepoMock.findById).toHaveBeenCalledWith(SELECTED_ROLLE_ID);
        });

        it('should return ImportNurLernAnSchuleUndKlasseError if the rolle is not rollenart LERN', async () => {
            organisationRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE }),
            );
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            rolleMock.rollenart = RollenArt.LEHR;
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);
            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                FILE_MOCK,
                SELECTED_ORGANISATION_ID,
                SELECTED_ROLLE_ID,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(ImportNurLernAnSchuleUndKlasseError);
            expect(organisationRepoMock.findById).toHaveBeenCalledWith(SELECTED_ORGANISATION_ID);
            expect(rolleRepoMock.findById).toHaveBeenCalledWith(SELECTED_ROLLE_ID);
        });

        it('should return RolleNurAnPassendeOrganisationError if the rolle does not pass to organisation', async () => {
            organisationRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.LAND }),
            );
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            rolleMock.rollenart = RollenArt.LERN;
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);
            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                FILE_MOCK,
                SELECTED_ORGANISATION_ID,
                SELECTED_ROLLE_ID,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(RolleNurAnPassendeOrganisationError);
            expect(organisationRepoMock.findById).toHaveBeenCalledWith(SELECTED_ORGANISATION_ID);
            expect(rolleRepoMock.findById).toHaveBeenCalledWith(SELECTED_ROLLE_ID);
        });

        it('should return MissingPermissionsError if the admin does not permissions to import data', async () => {
            organisationRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE }),
            );
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            rolleMock.rollenart = RollenArt.LERN;
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);

            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(false);

            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                FILE_MOCK,
                SELECTED_ORGANISATION_ID,
                SELECTED_ROLLE_ID,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(MissingPermissionsError);
        });

        it('should return ImportCSVFileEmptyError if the csv file is empty', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>();
            file.buffer = Buffer.from('');

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
                SELECTED_ORGANISATION_ID,
                SELECTED_ROLLE_ID,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(ImportCSVFileEmptyError);
            expect(importDataRepositoryMock.save).not.toHaveBeenCalled();
        });

        it('should return ImportCSVFileMaxUsersError if the csv file exceeds the number of maximum allowed users', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>();
            file.buffer = Buffer.from('Nachname;Vorname;Klasse\r\nTest;Hans;1A\r\nTest;Marie;1B\r\n');

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
                SELECTED_ORGANISATION_ID,
                SELECTED_ROLLE_ID,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(ImportCSVFileMaxUsersError);
            expect(importDataRepositoryMock.save).not.toHaveBeenCalled();
        });

        it('should return ImportCSVFileContainsNoUsersError if the csv file contains no data items', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>();
            file.buffer = Buffer.from('Nachname;Vorname;Klasse');

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
                SELECTED_ORGANISATION_ID,
                SELECTED_ROLLE_ID,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(ImportCSVFileContainsNoUsersError);
            expect(importDataRepositoryMock.save).not.toHaveBeenCalled();
        });

        it('should return ImportCSVFileParsingError if the parser cannot parse', async () => {
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
            spyParse.mockImplementationOnce(() => {
                throw new Error('Error details');
            });

            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                FILE_MOCK,
                SELECTED_ORGANISATION_ID,
                SELECTED_ROLLE_ID,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(ImportCSVFileParsingError);
            expect(spyParse).toHaveBeenCalled();
        });

        it('should return ImportCSVFileInvalidHeaderError if the parser cannot parse headers', async () => {
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
            spyParse.mockImplementationOnce(() => {
                throw new ImportCSVFileInvalidHeaderError([`Invalid header: klaße`]);
            });

            const result: DomainError | ImportUploadResultFields = await sut.validateImport(
                FILE_MOCK,
                SELECTED_ORGANISATION_ID,
                SELECTED_ROLLE_ID,
                personpermissionsMock,
            );
            expect(result).toBeInstanceOf(ImportCSVFileInvalidHeaderError);
            expect(spyParse).toHaveBeenCalled();
        });
    });

    describe('executeImport', () => {
        it('should return MissingPermissionsError if the admin does not have permissions to execute the import transaction', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(false);

            const result: Result<void> = await sut.executeImport(faker.string.uuid(), personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new MissingPermissionsError('Unauthorized to import data'),
            });
        });

        it('should return EntityNotFoundError if a ImportVorgang does not exist', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(null);
            const importvorgangId: string = faker.string.uuid();

            const result: Result<void> = await sut.executeImport(importvorgangId, personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new EntityNotFoundError('ImportVorgang', importvorgangId),
            });
            expect(importVorgangRepositoryMock.save).not.toHaveBeenCalled();
        });

        it('should return ImportDomainError if a ImportVorgang does not have an organisation id', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(
                DoFactory.createImportVorgang(true, { organisationId: undefined }),
            );
            const importvorgangId: string = faker.string.uuid();

            const result: Result<void> = await sut.executeImport(importvorgangId, personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new ImportDomainError('ImportVorgang is missing an organisazion id', importvorgangId),
            });
            expect(importVorgangRepositoryMock.save).not.toHaveBeenCalled();
        });

        it('should return ImportDomainError if a ImportVorgang does not have a rolle id', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(
                DoFactory.createImportVorgang(true, { organisationId: faker.string.uuid(), rolleId: undefined }),
            );
            const importvorgangId: string = faker.string.uuid();

            const result: Result<void> = await sut.executeImport(importvorgangId, personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new ImportDomainError('ImportVorgang is missing a rolle id', importvorgangId),
            });
            expect(importVorgangRepositoryMock.save).not.toHaveBeenCalled();
        });

        it('should publish ImportExecutedEvent and return the undefined', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            const importvorgang: ImportVorgang<true> = DoFactory.createImportVorgang(true);
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(importvorgang);
            const importDataItem: ImportDataItem<true> = DoFactory.createImportDataItem(true, {
                importvorgangId: importvorgang.id,
                klasse: '1A',
            });

            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[importDataItem], 1]);

            const rolle: Rolle<true> = DoFactory.createRolle(true);
            rolleRepoMock.findById.mockResolvedValueOnce(rolle);

            const result: Result<void> = await sut.executeImport(importvorgang.id, personpermissionsMock);

            expect(result).toEqual({ ok: true, value: undefined });
            expect(importVorgangRepositoryMock.save).toHaveBeenCalled();
        });
    });

    describe('downloadFile', () => {
        it('should return MissingPermissionsError if the admin does not have permissions to execute the import transaction', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(false);

            const result: Result<Buffer> = await sut.downloadFile(faker.string.uuid(), personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new MissingPermissionsError('Unauthorized to import data'),
            });
        });

        it('should return EntityNotFoundError if a ImportVorgang does not exist', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(null);
            const importvorgangId: string = faker.string.uuid();

            const result: Result<Buffer> = await sut.downloadFile(importvorgangId, personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new EntityNotFoundError('ImportVorgang', importvorgangId),
            });
            expect(importDataRepositoryMock.deleteByImportVorgangId).not.toHaveBeenCalled();
        });

        it('should return ImportDomainError if a ImportVorgang does not have an organisation id', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(
                DoFactory.createImportVorgang(true, { organisationId: undefined }),
            );
            const importvorgangId: string = faker.string.uuid();

            const result: Result<Buffer> = await sut.downloadFile(importvorgangId, personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new ImportDomainError('ImportVorgang is missing an organisazion id', importvorgangId),
            });
            expect(importVorgangRepositoryMock.save).not.toHaveBeenCalled();
        });

        it('should return ImportDomainError if a ImportVorgang does not have a rolle id', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(
                DoFactory.createImportVorgang(true, { organisationId: faker.string.uuid(), rolleId: undefined }),
            );
            const importvorgangId: string = faker.string.uuid();

            const result: Result<Buffer> = await sut.downloadFile(importvorgangId, personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new ImportDomainError('ImportVorgang is missing a rolle id', importvorgangId),
            });
            expect(importVorgangRepositoryMock.save).not.toHaveBeenCalled();
        });

        it('should return ImportDomainError if the ImportVorgang is not finsihed', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(
                DoFactory.createImportVorgang(true, { status: ImportStatus.INPROGRESS }),
            );
            const importvorgangId: string = faker.string.uuid();

            const result: Result<Buffer> = await sut.downloadFile(importvorgangId, personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new ImportDomainError('ImportVorgang is still in progress', importvorgangId),
            });
            expect(importDataRepositoryMock.deleteByImportVorgangId).not.toHaveBeenCalled();
        });

        it('should return EntityNotFoundError if the ImportVorgang gas import data items', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(
                DoFactory.createImportVorgang(true, { status: ImportStatus.FINISHED }),
            );
            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[], 0]);
            const importvorgangId: string = faker.string.uuid();

            const result: Result<Buffer> = await sut.downloadFile(importvorgangId, personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new EntityNotFoundError('ImportDataItem', importvorgangId),
            });
            expect(importDataRepositoryMock.deleteByImportVorgangId).not.toHaveBeenCalled();
        });

        it('should return the file buffer if the import transaction was executed successfully', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            const importvorgang: ImportVorgang<true> = DoFactory.createImportVorgang(true, {
                status: ImportStatus.FINISHED,
            });
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(importvorgang);
            const importDataItem: ImportDataItem<true> = DoFactory.createImportDataItem(true, {
                importvorgangId: importvorgang.id,
                klasse: '1A',
                nachname: 'Mustermann',
                vorname: 'Max',
                username: 'max.mustermann',
                password: 'encrpytedpassword|iv',
            });
            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[importDataItem], 1]);

            const schule: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
            });
            organisationRepoMock.findById.mockResolvedValueOnce(schule);

            const rolle: Rolle<true> = DoFactory.createRolle(true);
            rolleRepoMock.findById.mockResolvedValueOnce(rolle);
            importPasswordEncryptorMock.decryptPassword.mockResolvedValueOnce('password');

            const result: Result<Buffer> = await sut.downloadFile(importvorgang.id, personpermissionsMock);

            if (!result.ok) {
                throw new Error(result.error.message);
            }
            expect(result.value).toBeInstanceOf(Buffer);

            const resultString: string = result.value.toString('utf8');
            expect(resultString).toContain(schule.name);
            expect(resultString).toContain(rolle.name);
            expect(resultString).toContain(importDataItem.vorname);
            expect(resultString).toContain(importDataItem.nachname);
            expect(resultString).toContain(importDataItem.klasse);
            expect(importDataRepositoryMock.deleteByImportVorgangId).toHaveBeenCalledWith(importvorgang.id);
        });

        it('should return EntityNotFoundError if the schule is not found', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            const importvorgang: ImportVorgang<true> = DoFactory.createImportVorgang(true, {
                status: ImportStatus.FINISHED,
                organisationId: SELECTED_ORGANISATION_ID,
                rolleId: SELECTED_ROLLE_ID,
            });
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(importvorgang);
            const importDataItem: ImportDataItem<true> = DoFactory.createImportDataItem(true, {
                importvorgangId: importvorgang.id,
                klasse: '1A',
                nachname: 'Mustermann',
                vorname: 'Max',
                username: 'max.mustermann',
                password: 'password',
            });
            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[importDataItem], 1]);
            organisationRepoMock.findById.mockResolvedValueOnce(undefined);

            const result: Result<Buffer> = await sut.downloadFile(importvorgang.id, personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new EntityNotFoundError('Organisation', SELECTED_ORGANISATION_ID),
            });
        });

        it('should return EntityNotFoundError if the rolle is not found', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            const importvorgang: ImportVorgang<true> = DoFactory.createImportVorgang(true, {
                status: ImportStatus.FINISHED,
                organisationId: SELECTED_ORGANISATION_ID,
                rolleId: SELECTED_ROLLE_ID,
            });
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(importvorgang);
            const importDataItem: ImportDataItem<true> = DoFactory.createImportDataItem(true, {
                importvorgangId: importvorgang.id,
                klasse: '1A',
                nachname: 'Mustermann',
                vorname: 'Max',
                username: 'max.mustermann',
                password: 'password',
            });
            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[importDataItem], 1]);
            organisationRepoMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));
            rolleRepoMock.findById.mockResolvedValueOnce(undefined);

            const result: Result<Buffer> = await sut.downloadFile(importvorgang.id, personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new EntityNotFoundError('Rolle', SELECTED_ROLLE_ID),
            });
        });

        it('should return ImportTextFileCreationError if the text file cannot be created', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            const importvorgang: ImportVorgang<true> = DoFactory.createImportVorgang(true, {
                status: ImportStatus.FINISHED,
            });
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(importvorgang);
            const importDataItem: ImportDataItem<true> = DoFactory.createImportDataItem(true, {
                importvorgangId: importvorgang.id,
                klasse: '1A',
                nachname: 'Mustermann',
                vorname: 'Max',
                username: 'max.mustermann',
                password: 'password',
            });
            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[importDataItem], 1]);
            organisationRepoMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));
            rolleRepoMock.findById.mockResolvedValueOnce(DoFactory.createRolle(true));
            jest.spyOn(Buffer, 'from').mockImplementationOnce(() => {
                throw new Error('Error details');
            });

            const result: Result<Buffer> = await sut.downloadFile(importvorgang.id, personpermissionsMock);

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

    describe('cancelImport', () => {
        it('should return MissingPermissionsError if the admin does not have permissions to cancel the import transaction', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(false);

            const result: Result<void> = await sut.cancelImport(faker.string.uuid(), personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new MissingPermissionsError('Unauthorized to import data'),
            });
        });

        it('should return EntityNotFoundError if a ImportVorgang does not exist', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(null);
            const importVorgangId: string = faker.string.uuid();

            const result: Result<void> = await sut.cancelImport(importVorgangId, personpermissionsMock);

            expect(result).toEqual({
                ok: false,
                error: new EntityNotFoundError('ImportVorgang', importVorgangId),
            });
            expect(importDataRepositoryMock.deleteByImportVorgangId).not.toHaveBeenCalled();
        });

        it('should call the importDataRepository if the admin has permissions to cancel the import transaction', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);
            const importvorgang: ImportVorgang<true> = DoFactory.createImportVorgang(true);
            importVorgangRepositoryMock.findById.mockResolvedValueOnce(importvorgang);

            const result: Result<void> = await sut.cancelImport(importvorgang.id, personpermissionsMock);

            expect(importDataRepositoryMock.deleteByImportVorgangId).toHaveBeenCalled();
            expect(result).toEqual({ ok: true, value: undefined });
        });
    });
});
