import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { Test, TestingModule } from '@nestjs/testing';

import { DoFactory, LoggingTestModule } from '../../../../test/utils/index.js';
import { LandesbediensteterWorkflowFactory } from '../domain/landesbediensteter-workflow.factory.js';
import { LandesbediensteterWorkflowAggregate } from '../domain/landesbediensteter-workflow.js';
import { LandesbediensteterController } from './landesbediensteter.controller.js';
import { LandesbediensteterWorkflowStepBodyParams } from './param/landesbediensteter-workflow-step.body.params.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { LandesbediensteterWorkflowStepResponse } from './response/landesbediensteter-workflow-step.response.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { faker } from '@faker-js/faker';
import { Rolle } from '../../rolle/domain/rolle.js';
import { LandesbediensteterPersonIdParams } from './param/landesbediensteter-person-id.params.js';
import { LandesbediensteterWorkflowCommitBodyParams } from './param/landesbediensteter-workflow-commit.body.params.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { PersonenkontexteUpdateResponse } from '../../personenkontext/api/response/personenkontexte-update.response.js';
import { PersonenkontexteUpdateError } from '../../personenkontext/domain/error/personenkontexte-update.error.js';

describe('LandesbediensteterController', () => {
    let module: TestingModule;

    let sut: LandesbediensteterController;

    const landesbediensteteWorkflowFactoryMock: DeepMocked<LandesbediensteterWorkflowFactory> = createMock();
    const workflowMock: DeepMocked<LandesbediensteterWorkflowAggregate> = createMock();

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule],
            providers: [
                LandesbediensteterController,
                {
                    provide: LandesbediensteterWorkflowFactory,
                    useValue: landesbediensteteWorkflowFactoryMock,
                },
            ],
        }).compile();

        sut = module.get(LandesbediensteterController);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        vi.resetAllMocks();
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

            const params: LandesbediensteterWorkflowStepBodyParams = {
                organisationName: faker.string.alphanumeric(),
                limit: faker.number.int(50),
            };
            const permissions: DeepMocked<PersonPermissions> = createMock();
            workflowMock.findAllSchulstrukturknoten.mockResolvedValueOnce(orgas);

            const result: LandesbediensteterWorkflowStepResponse = await sut.step(params, permissions);

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

            const params: LandesbediensteterWorkflowStepBodyParams = {
                organisationName: faker.string.alphanumeric(),
                organisationId: faker.string.uuid(),
                limit: faker.number.int(50),
            };
            const permissions: DeepMocked<PersonPermissions> = createMock();
            workflowMock.findAllSchulstrukturknoten.mockResolvedValueOnce(orgas);
            workflowMock.findRollenForOrganisation.mockResolvedValueOnce(rollen);

            const result: LandesbediensteterWorkflowStepResponse = await sut.step(params, permissions);

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

            const params: LandesbediensteterWorkflowStepBodyParams = {
                organisationName: faker.string.alphanumeric(),
                organisationId: faker.string.uuid(),
                rollenIds: [faker.string.uuid()],
                limit: faker.number.int(50),
            };
            const permissions: DeepMocked<PersonPermissions> = createMock();
            workflowMock.findAllSchulstrukturknoten.mockResolvedValueOnce(orgas);
            workflowMock.findRollenForOrganisation.mockResolvedValueOnce(rollen);
            workflowMock.canCommit.mockResolvedValueOnce({ ok: true, value: undefined });

            const result: LandesbediensteterWorkflowStepResponse = await sut.step(params, permissions);

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

            const params: LandesbediensteterPersonIdParams = {
                personId: faker.string.uuid(),
            };
            const body: LandesbediensteterWorkflowCommitBodyParams = {
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

            const params: LandesbediensteterPersonIdParams = {
                personId: faker.string.uuid(),
            };
            const body: LandesbediensteterWorkflowCommitBodyParams = {
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
