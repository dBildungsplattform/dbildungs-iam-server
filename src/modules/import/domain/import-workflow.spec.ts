import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { ImportDataRepository } from '../persistence/import-data.repository.js';
import { ImportUploadResultFields, ImportWorkflowAggregate } from './import-workflow.js';
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
import fs, { ReadStream } from 'fs';
import { Organisation } from '../../organisation/domain/organisation.js';
import { ImportTextFileNotFoundError } from './import-text-file-notfound.error.js';
import { ImportTextFileCreationError } from './import-text-file-creation.error.js';
import { RolleNurAnPassendeOrganisationError } from '../../personenkontext/specification/error/rolle-nur-an-passende-organisation.js';

describe('ImportWorkflowAggregate', () => {
    let module: TestingModule;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let organisationRepoMock: DeepMocked<OrganisationRepository>;
    let importDataRepositoryMock: DeepMocked<ImportDataRepository>;
    let personenkontextCreationServiceMock: DeepMocked<PersonenkontextCreationService>;
    let sut: ImportWorkflowAggregate;
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

    describe('initialize', () => {
        it('should initialize the aggregate with the selected Organisation and Rolle', () => {
            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            expect(sut.selectedOrganisationId).toBe(SELECTED_ORGANISATION_ID);
            expect(sut.selectedRolleId).toBe(SELECTED_ROLLE_ID);
        });
    });

    describe('isValid', () => {
        it('should return EntityNotFoundError if the organisation does not exist', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>();
            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            organisationRepoMock.findById.mockResolvedValueOnce(undefined);
            const result: DomainError | ImportUploadResultFields = await sut.isValid(file, personpermissionsMock);
            expect(result).toBeInstanceOf(EntityNotFoundError);
        });

        it('should return EntityNotFoundError if the rolle does not exist', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>();
            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            organisationRepoMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));
            rolleRepoMock.findById.mockResolvedValueOnce(undefined);
            const result: DomainError | ImportUploadResultFields = await sut.isValid(file, personpermissionsMock);
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
            const result: DomainError | ImportUploadResultFields = await sut.isValid(file, personpermissionsMock);
            expect(result).toBeInstanceOf(EntityNotFoundError);
            expect(rolleRepoMock.findById).toHaveBeenCalledWith(SELECTED_ROLLE_ID);
        });

        it('should return RolleNurAnPassendeOrganisationError if the rolle does not pass to organisation', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>();
            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            organisationRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.KLASSE }),
            );
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            rolleMock.rollenart = RollenArt.LEIT;
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);
            const result: DomainError | ImportUploadResultFields = await sut.isValid(file, personpermissionsMock);
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

            const result: DomainError | ImportUploadResultFields = await sut.isValid(file, personpermissionsMock);
            expect(result).toBeInstanceOf(MissingPermissionsError);
        });

        it('should call parser and  importDataRepository', async () => {
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

            const result: DomainError | ImportUploadResultFields = await sut.isValid(file, personpermissionsMock);
            expect(result).not.toBeInstanceOf(DomainError);
            expect(importDataRepositoryMock.save).toHaveBeenCalled();
            expect(personenkontextCreationServiceMock.createPersonWithPersonenkontexte).not.toHaveBeenCalled();
            expect(spyParse).toHaveBeenCalled();
        });
    });

    describe('execute', () => {
        it('should return MissingPermissionsError if the admin does not have permissions to execute the import transaction', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(false);

            const result: Option<DomainError> = await sut.execute(faker.string.uuid(), personpermissionsMock);
            expect(result).toBeInstanceOf(MissingPermissionsError);
        });

        it('should return EntityNotFoundError if the import transaction does not exist', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.KLASSE }),
            ]);
            importDataRepositoryMock.findByImportVorgangId.mockResolvedValueOnce([[], 0]);
            const importvorgangId: string = faker.string.uuid();

            const result: Option<DomainError> = await sut.execute(importvorgangId, personpermissionsMock);
            expect(result).toBeInstanceOf(EntityNotFoundError);
            expect(result?.message).toBe(
                `requested ImportDataItem with the following ID ${importvorgangId} was not found`,
            );
        });

        it('should return EntityNotFoundError if the import transaction does not exist', async () => {
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
                `Klasse=${importDataItem.klasse} for ${importDataItem.vorname} ${importDataItem.familienname} was not found`,
            ]);

            await expect(sut.execute(importvorgangId, personpermissionsMock)).rejects.toThrowError(error);
        });

        it('should return undefined if the import transaction was executed successfully', async () => {
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

            jest.spyOn(fs, 'writeFile').mockReturnValueOnce(undefined);
            jest.spyOn(fs, 'appendFile').mockReturnValueOnce(undefined);

            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            const result: Option<DomainError> = await sut.execute(importvorgangId, personpermissionsMock);
            expect(result).toBeUndefined();
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
            const result: Option<DomainError> = await sut.execute(importvorgangId, personpermissionsMock);
            expect(result).toBeInstanceOf(EntityNotFoundError);
            expect(result?.message).toBe(
                `requested Organisation with the following ID ${SELECTED_ORGANISATION_ID} was not found`,
            );
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
            const result: Option<DomainError> = await sut.execute(importvorgangId, personpermissionsMock);
            expect(result).toBeInstanceOf(EntityNotFoundError);
            expect(result?.message).toBe(`requested Rolle with the following ID ${SELECTED_ROLLE_ID} was not found`);
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
            jest.spyOn(fs.promises, 'writeFile').mockImplementationOnce(() => {
                throw new Error('Error details');
            });

            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            const result: Option<DomainError> = await sut.execute(importvorgangId, personpermissionsMock);

            expect(result).toBeInstanceOf(ImportTextFileCreationError);
            expect(result?.message).toBe('Text File for the import result could not be created');
            expect(result?.details).toContain('Error: Error details');
        });
    });

    describe('getImportResultTextFile', () => {
        it('should return MissingPermissionsError if the admin does not have permissions to execute the import transaction', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(false);

            const result: Result<ReadStream> = await sut.getImportResultTextFile(
                faker.string.uuid(),
                personpermissionsMock,
            );

            expect(result).toEqual({
                ok: false,
                error: new MissingPermissionsError('Unauthorized to import data'),
            });
        });

        it('should return ImportTextFileNotFoundError if the text file can not be read', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            jest.spyOn(fs, 'createReadStream').mockImplementationOnce(() => {
                throw new Error('Error details');
            });

            const result: Result<ReadStream> = await sut.getImportResultTextFile(
                faker.string.uuid(),
                personpermissionsMock,
            );

            expect(result).toEqual({
                ok: false,
                error: new ImportTextFileNotFoundError(['Error details']),
            });
        });

        it('should return File if all conditions pass', async () => {
            personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            const readStream: ReadStream = createMock<ReadStream>();
            jest.spyOn(fs, 'createReadStream').mockReturnValueOnce(readStream);

            const result: Result<ReadStream> = await sut.getImportResultTextFile(
                faker.string.uuid(),
                personpermissionsMock,
            );

            expect(result).toEqual({
                ok: true,
                value: readStream,
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
