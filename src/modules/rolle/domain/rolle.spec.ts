import { DeepMocked, createMock } from '@golevelup/ts-jest';

import { DoFactory } from '../../../../test/utils/index.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { Rolle } from './rolle.js';
import { OrganisationService } from '../../organisation/domain/organisation.service.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';

describe('Rolle Aggregate', () => {
    describe('save', () => {
        const repo: DeepMocked<RolleRepo> = createMock();
        const organisationService: DeepMocked<OrganisationService> = createMock();

        it('should update itself with saved data', async () => {
            const savedRolle: Rolle = DoFactory.createRolle(true);
            repo.save.mockResolvedValueOnce(savedRolle);
            organisationService.findOrganisationById.mockResolvedValueOnce({ ok: true, value: createMock() });

            const rolle: Rolle = DoFactory.createRolle(false);
            await rolle.save(repo, organisationService);

            expect(rolle).toEqual(savedRolle);
        });

        it('should throw error if schulstrukturknoten does not exist', async () => {
            organisationService.findOrganisationById.mockResolvedValueOnce({
                ok: false,
                error: new EntityNotFoundError('Organisation'),
            });

            const rolle: Rolle = DoFactory.createRolle(false);

            await expect(rolle.save(repo, organisationService)).resolves.toBeInstanceOf(SchulConnexError);
        });
    });
});
