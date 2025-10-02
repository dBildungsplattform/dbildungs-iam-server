import { faker } from '@faker-js/faker';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS, LoggingTestModule } from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

import { ImportController } from './import.controller.js';
import { ImportWorkflowFactory } from '../domain/import-workflow.factory.js';
import { ImportWorkflow } from '../domain/import-workflow.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Response } from 'express';
import { ImportTextFileCreationError } from '../domain/import-text-file-creation.error.js';
import { ImportvorgangByIdBodyParams } from './importvorgang-by-id.body.params.js';
import { HttpException } from '@nestjs/common';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { ImportvorgangByIdParams } from './importvorgang-by-id.params.js';
import { ImportVorgangRepository } from '../persistence/import-vorgang.repository.js';
import { ImportDataRepository } from '../persistence/import-data.repository.js';

describe('Import API with mocked ImportWorkflow', () => {
    let sut: ImportController;
    let importWorkflowFactoryMock: DeepMocked<ImportWorkflowFactory>;
    let ImportWorkflowMock: DeepMocked<ImportWorkflow>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [LoggingTestModule],
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
                    provide: ImportWorkflow,
                    useValue: createMock<ImportWorkflow>(),
                },
                {
                    provide: ImportVorgangRepository,
                    useValue: createMock<ImportVorgangRepository>(),
                },
                {
                    provide: ImportDataRepository,
                    useValue: createMock<ImportDataRepository>(),
                },
                ImportController,
            ],
        }).compile();

        sut = module.get(ImportController);
        ImportWorkflowMock = module.get(ImportWorkflow);
        importWorkflowFactoryMock = module.get(ImportWorkflowFactory);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('/POST download the import result', () => {
        describe('if the import result file cannot be created', () => {
            it('should throw an ImportTextFileCreationError', async () => {
                const params: ImportvorgangByIdBodyParams = {
                    importvorgangId: faker.string.uuid(),
                };
                const responseMock: DeepMocked<Response> = createMock();

                const personpermissionsMock: DeepMocked<PersonPermissions> = createMock();
                personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);

                ImportWorkflowMock.downloadFile.mockResolvedValueOnce({
                    ok: false,
                    error: new ImportTextFileCreationError(['Reason']),
                });
                importWorkflowFactoryMock.createNew.mockReturnValueOnce(ImportWorkflowMock);

                await expect(sut.downloadFile(params, responseMock, personpermissionsMock)).rejects.toThrow(
                    new ImportTextFileCreationError(['Reason']),
                );
            });
        });
    });

    describe('/DELETE cancel the import transaction', () => {
        describe('if the admin does not rights to import', () => {
            it('should throw an HttpExcetion', async () => {
                const params: ImportvorgangByIdParams = {
                    importvorgangId: faker.string.uuid(),
                };

                const personpermissionsMock: DeepMocked<PersonPermissions> = createMock();
                personpermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(false);

                ImportWorkflowMock.cancelOrCompleteImport.mockResolvedValueOnce({
                    ok: false,
                    error: new MissingPermissionsError('Unauthorized to import data'),
                });
                importWorkflowFactoryMock.createNew.mockReturnValueOnce(ImportWorkflowMock);

                await expect(sut.deleteImportTransaction(params, personpermissionsMock)).rejects.toThrow(HttpException);
            });
        });
    });
});
