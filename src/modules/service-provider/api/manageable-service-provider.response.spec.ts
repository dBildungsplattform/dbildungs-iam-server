import { DoFactory } from '../../../../test/utils/index.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { ServiceProvider } from '../domain/service-provider';
import { ManageableServiceProviderResponse } from './manageable-service-provider.response.js';

describe('ManageableServiceProviderResponse', () => {
    it('should set administrationsebene.name to empty string if organisation.name is undefined', () => {
        const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true);
        const organisation: Organisation<true> = DoFactory.createOrganisation(true, { name: undefined });
        const rollen: Rolle<true>[] = [DoFactory.createRolle(true)];

        const response: ManageableServiceProviderResponse = new ManageableServiceProviderResponse(
            serviceProvider,
            organisation,
            rollen,
            true,
        );

        expect(response.administrationsebene.name).toBe('');
    });
});
