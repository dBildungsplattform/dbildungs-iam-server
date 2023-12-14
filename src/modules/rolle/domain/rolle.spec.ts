import { DeepMocked, createMock } from '@golevelup/ts-jest';

import { DoFactory } from '../../../../test/utils/index.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { Rolle } from './rolle.js';

describe('Rolle Aggregate', () => {
    describe('save', () => {
        const repo: DeepMocked<RolleRepo> = createMock();

        it('should update itself with saved data', async () => {
            const savedRolle: Rolle = DoFactory.createRolle(true);
            repo.save.mockResolvedValueOnce(savedRolle);

            const rolle: Rolle = DoFactory.createRolle(false);
            await rolle.save(repo);

            expect(rolle).toEqual(savedRolle);
        });
    });
});
