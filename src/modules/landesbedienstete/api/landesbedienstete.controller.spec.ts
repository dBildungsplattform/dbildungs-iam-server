import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { DoFactory, LoggingTestModule, MapperTestModule } from '../../../../test/utils/index.js';
import { LandesbediensteteWorkflowFactory } from '../domain/landesbedienstete-workflow.factory.js';
import { LandesbediensteteWorkflowAggregate } from '../domain/landesbedienstete-workflow.js';
import { LandesbediensteteController } from './landesbedienstete.controller.js';
import { LandesbediensteteWorkflowStepBodyParams } from './param/landesbedienstete-workflow-step.body.params.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { LandesbediensteteWorkflowStepResponse } from './response/landesbedienstete-workflow-step.response.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { faker } from '@faker-js/faker';
import { Rolle } from '../../rolle/domain/rolle.js';
import { LandesbedienstetePersonIdParams } from './param/landesbedienstete-person-id.params.js';
import { LandesbediensteteWorkflowCommitBodyParams } from './param/landesbedienstete-workflow-commit.body.params.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { PersonenkontexteUpdateResponse } from '../../personenkontext/api/response/personenkontexte-update.response.js';
import { PersonenkontexteUpdateError } from '../../personenkontext/domain/error/personenkontexte-update.error.js';

describe('LandesbediensteteController', () => {
    let module: TestingModule;

    let sut: LandesbediensteteController;

    const landesbediensteteWorkflowFactoryMock: DeepMocked<LandesbediensteteWorkflowFactory> = createMock();
    const workflowMock: DeepMocked<LandesbediensteteWorkflowAggregate> = createMock();

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule, LoggingTestModule],
            providers: [
                LandesbediensteteController,
                {
                    provide: LandesbediensteteWorkflowFactory,
                    useValue: landesbediensteteWorkflowFactoryMock,
                },
            ],
        }).compile();

        sut = module.get(LandesbediensteteController);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
        landesbediensteteWorkflowFactoryMock.createNew.mockReturnValueOnce(workflowMock);
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('/GET step', () => {
        it('should return organisations', async () => {
            const orgas: Organisation<true>[] = [
                DoFactory.createOrganisation(true),
                DoFactory.createOrganisation(true),
                DoFactory.createOrganisation(true),
            ];

            const params: LandesbediensteteWorkflowStepBodyParams = {
                organisationName: faker.string.alphanumeric(),
                limit: faker.number.int(50),
            };
            const permissions: DeepMocked<PersonPermissions> = createMock();
            workflowMock.findAllSchulstrukturknoten.mockResolvedValueOnce(orgas);

            const result: LandesbediensteteWorkflowStepResponse = await sut.step(params, permissions);

            expect(workflowMock.findAllSchulstrukturknoten).toHaveBeenCalledWith(
                permissions,
                params.organisationName,
                undefined,
                params.limit,
            );
            expect(result.organisations).toHaveLength(3);
            expect(result.rollen).toHaveLength(0);
            expect(result.canCommit).toBe(false);
        });

        it('should return organisations and rollen', async () => {
            const orgas: Organisation<true>[] = [
                DoFactory.createOrganisation(true),
                DoFactory.createOrganisation(true),
                DoFactory.createOrganisation(true),
            ];
            const rollen: Rolle<true>[] = [
                DoFactory.createRolle(true),
                DoFactory.createRolle(true),
                DoFactory.createRolle(true),
            ];

            const params: LandesbediensteteWorkflowStepBodyParams = {
                organisationName: faker.string.alphanumeric(),
                organisationId: faker.string.uuid(),
                limit: faker.number.int(50),
            };
            const permissions: DeepMocked<PersonPermissions> = createMock();
            workflowMock.findAllSchulstrukturknoten.mockResolvedValueOnce(orgas);
            workflowMock.findRollenForOrganisation.mockResolvedValueOnce(rollen);

            const result: LandesbediensteteWorkflowStepResponse = await sut.step(params, permissions);

            expect(result.organisations).toHaveLength(3);
            expect(result.rollen).toHaveLength(3);
            expect(result.canCommit).toBe(false);
        });

        it('should return organisations and rollen and canCommit=true', async () => {
            const orgas: Organisation<true>[] = [
                DoFactory.createOrganisation(true),
                DoFactory.createOrganisation(true),
                DoFactory.createOrganisation(true),
            ];
            const rollen: Rolle<true>[] = [
                DoFactory.createRolle(true),
                DoFactory.createRolle(true),
                DoFactory.createRolle(true),
            ];

            const params: LandesbediensteteWorkflowStepBodyParams = {
                organisationName: faker.string.alphanumeric(),
                organisationId: faker.string.uuid(),
                rollenIds: [faker.string.uuid()],
                limit: faker.number.int(50),
            };
            const permissions: DeepMocked<PersonPermissions> = createMock();
            workflowMock.findAllSchulstrukturknoten.mockResolvedValueOnce(orgas);
            workflowMock.findRollenForOrganisation.mockResolvedValueOnce(rollen);
            workflowMock.canCommit.mockResolvedValueOnce({ ok: true, value: undefined });

            const result: LandesbediensteteWorkflowStepResponse = await sut.step(params, permissions);

            expect(result.canCommit).toBe(true);
        });
    });

    describe('/PUT commit', () => {
        it('should use workflow to commit', async () => {
            const pks: Personenkontext<true>[] = [
                DoFactory.createPersonenkontext(true),
                DoFactory.createPersonenkontext(true),
                DoFactory.createPersonenkontext(true),
            ];

            const params: LandesbedienstetePersonIdParams = {
                personId: faker.string.uuid(),
            };
            const body: LandesbediensteteWorkflowCommitBodyParams = {
                count: faker.number.int(20),
                newPersonenkontexte: [],
                lastModified: new Date(),
                personalnummer: faker.string.numeric(7),
            };
            const permissions: DeepMocked<PersonPermissions> = createMock();
            workflowMock.commit.mockResolvedValueOnce({ ok: true, value: pks });

            const result: PersonenkontexteUpdateResponse = await sut.commit(params, body, permissions);

            expect(workflowMock.commit).toHaveBeenCalledWith(
                params.personId,
                body.lastModified,
                body.count,
                body.newPersonenkontexte,
                permissions,
                body.personalnummer,
            );
            expect(result.dBiamPersonenkontextResponses).toHaveLength(pks.length);
        });

        it('should throw error', async () => {
            const error: PersonenkontexteUpdateError = new PersonenkontexteUpdateError('Test Error');

            const params: LandesbedienstetePersonIdParams = {
                personId: faker.string.uuid(),
            };
            const body: LandesbediensteteWorkflowCommitBodyParams = {
                count: faker.number.int(20),
                newPersonenkontexte: [],
                lastModified: new Date(),
                personalnummer: faker.string.numeric(7),
            };
            const permissions: DeepMocked<PersonPermissions> = createMock();
            workflowMock.commit.mockResolvedValueOnce({ ok: false, error });

            const result: Promise<PersonenkontexteUpdateResponse> = sut.commit(params, body, permissions);

            await expect(result).rejects.toThrow(error);
        });
    });
});
