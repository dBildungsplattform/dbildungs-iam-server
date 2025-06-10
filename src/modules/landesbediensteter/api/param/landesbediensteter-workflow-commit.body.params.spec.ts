import { faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { LandesbediensteterWorkflowCommitBodyParams } from './landesbediensteter-workflow-commit.body.params.js';

describe('LandesbediensteterWorkflowCommitBodyParams', () => {
    it('should parse', async () => {
        const params: LandesbediensteterWorkflowCommitBodyParams = {
            count: faker.number.int(10),
            newPersonenkontexte: [
                {
                    organisationId: faker.string.uuid(),
                    personId: faker.string.uuid(),
                    rolleId: faker.string.uuid(),
                },
            ],
        };

        const instance: LandesbediensteterWorkflowCommitBodyParams = plainToInstance(
            LandesbediensteterWorkflowCommitBodyParams,
            params,
        );

        await expect(validate(instance)).resolves.toEqual([]);
    });
});
