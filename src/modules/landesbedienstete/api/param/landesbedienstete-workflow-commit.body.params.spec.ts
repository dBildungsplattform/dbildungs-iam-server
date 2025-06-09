import { faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { LandesbediensteteWorkflowCommitBodyParams } from './landesbedienstete-workflow-commit.body.params.js';

describe('LandesbediensteteWorkflowCommitBodyParams', () => {
    it('should parse', async () => {
        const params: LandesbediensteteWorkflowCommitBodyParams = {
            count: faker.number.int(10),
            newPersonenkontexte: [
                {
                    organisationId: faker.string.uuid(),
                    personId: faker.string.uuid(),
                    rolleId: faker.string.uuid(),
                },
            ],
        };

        const instance: LandesbediensteteWorkflowCommitBodyParams = plainToInstance(
            LandesbediensteteWorkflowCommitBodyParams,
            params,
        );

        await expect(validate(instance)).resolves.toEqual([]);
    });
});
