import { faker } from '@faker-js/faker';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS, MapperTestModule } from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

import { ImportController } from './import.controller.js';
import { ImportWorkflowFactory } from '../domain/import-workflow.factory.js';
import { ImportWorkflowAggregate } from '../domain/import-workflow.js';
import { ImportvorgangByIdParams } from './importvorgang-by-id..params.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Response } from 'express';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { ImportTextFileNotFoundError } from '../domain/import-text-file-notfound.error.js';
import { HttpException } from '@nestjs/common';
import { ImportTextFileCreationError } from '../domain/import-text-file-creation.error.js';
import { ImportvorgangByIdBodyParams } from './importvorgang-by-id.body.params.js';
import { ReadStream } from 'fs';

describe('Import API with mocked ImportWorkflowAggregate', () => {
    let sut: ImportController;
    let importWorkflowFactoryMock: DeepMocked<ImportWorkflowFactory>;
    let importWorkflowAggregateMock: DeepMocked<ImportWorkflowAggregate>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                {
                    provide: ImportWorkflowFactory,
                    useValue: createMock<ImportWorkflowFactory>(),
                },
                {
                    provide: ImportWorkflowAggregate,
                    useValue: createMock<ImportWorkflowAggregate>(),
                },
                ImportController,
            ],
        }).compile();

        sut = module.get(ImportController);
        importWorkflowAggregateMock = module.get(ImportWorkflowAggregate);
        importWorkflowFactoryMock = module.get(ImportWorkflowFactory);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('/GET download text file with importvorgangId', () => {
        describe('if admin does not have permissions', () => {
            it('should throw an HTTP exception', async () => {
                const params: ImportvorgangByIdParams = {
                    importvorgangId: faker.string.uuid(),
                };

                const responseMock: DeepMocked<Response> = createMock();
                const personpermissionsMock: DeepMocked<PersonPermissions> = createMock();
                personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(false);
                const error: DomainError = new MissingPermissionsError('Unauthorized to import data');
                importWorkflowAggregateMock.getImportResultTextFile.mockResolvedValueOnce({
                    ok: false,
                    error: error,
                });
                importWorkflowFactoryMock.createNew.mockReturnValueOnce(importWorkflowAggregateMock);

                await expect(sut.downloadImportResultFile(params, responseMock, personpermissionsMock)).rejects.toThrow(
                    HttpException,
                );
            });
        });

        describe('if the import result file cannot be found', () => {
            it('should throw an ImportTextFileNotFoundError', async () => {
                const params: ImportvorgangByIdParams = {
                    importvorgangId: faker.string.uuid(),
                };

                const responseMock: DeepMocked<Response> = createMock();
                const personpermissionsMock: DeepMocked<PersonPermissions> = createMock();
                personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);
                const error: DomainError = new ImportTextFileNotFoundError(['Reason']);
                importWorkflowAggregateMock.getImportResultTextFile.mockResolvedValueOnce({
                    ok: false,
                    error: error,
                });
                importWorkflowFactoryMock.createNew.mockReturnValueOnce(importWorkflowAggregateMock);

                await expect(sut.downloadImportResultFile(params, responseMock, personpermissionsMock)).rejects.toThrow(
                    error,
                );
            });
        });

        describe('if the import result file exists', () => {
            it('should return the import result file  as a streamable attachment', async () => {
                const params: ImportvorgangByIdBodyParams = {
                    importvorgangId: faker.string.uuid(),
                    organisationId: faker.string.uuid(),
                    rolleId: faker.string.uuid(),
                };

                const personpermissionsMock: DeepMocked<PersonPermissions> = createMock();
                personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);
                importWorkflowAggregateMock.getImportResultTextFile.mockResolvedValueOnce({
                    ok: true,
                    value: createMock<ReadStream>(),
                });
                importWorkflowFactoryMock.createNew.mockReturnValueOnce(importWorkflowAggregateMock);

                await expect(sut.executeImport(params, personpermissionsMock)).resolves.toBeUndefined();
            });
        });
    });

    describe('/POST execute the import transaction', () => {
        describe('if the import result file cannot be created', () => {
            it('should throw an ImportTextFileCreationError', async () => {
                const params: ImportvorgangByIdBodyParams = {
                    importvorgangId: faker.string.uuid(),
                    organisationId: faker.string.uuid(),
                    rolleId: faker.string.uuid(),
                };

                const personpermissionsMock: DeepMocked<PersonPermissions> = createMock();
                personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);
                const error: DomainError = new ImportTextFileCreationError(['Reason']);
                importWorkflowAggregateMock.execute.mockResolvedValueOnce(error);
                importWorkflowFactoryMock.createNew.mockReturnValueOnce(importWorkflowAggregateMock);

                await expect(sut.executeImport(params, personpermissionsMock)).rejects.toThrow(error);
            });
        });
    });
});
