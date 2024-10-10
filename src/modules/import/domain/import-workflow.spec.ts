import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { ImportDataRepository } from '../persistence/import-data.repository.js';
import { ImportUploadResultFields, ImportWorkflowAggregate } from './import-workflow.js';
import { PersonenkontextCreationService } from '../../personenkontext/domain/personenkontext-creation.service.js';
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
        });

        it('should return MissingPermissionsError if the admin does not permissions to import data', async () => {
            const file: Express.Multer.File = createMock<Express.Multer.File>();
            sut.initialize(SELECTED_ORGANISATION_ID, SELECTED_ROLLE_ID);
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            rolleMock.rollenart = RollenArt.LERN;
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            organisationRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE }),
            );
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
});
