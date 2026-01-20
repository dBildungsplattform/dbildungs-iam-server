import { DoFactory } from '../../../../test/utils/index.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { Rollenerweiterung } from '../../rolle/domain/rollenerweiterung.js';
import { ServiceProvider } from '../domain/service-provider';
import { ManageableServiceProviderListEntryResponse } from './manageable-service-provider-list-entry.response.js';

describe('ManageableServiceProviderListEntryResponse', () => {
    it('should set administrationsebene.name to empty string if organisation.name is undefined', () => {
        const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true);
        const organisation: Organisation<true> = DoFactory.createOrganisation(true, { name: undefined });
        const rollen: Rolle<true>[] = [DoFactory.createRolle(true)];
        const rollenerweiterungen: Rollenerweiterung<true>[] = [];

        const response: ManageableServiceProviderListEntryResponse = new ManageableServiceProviderListEntryResponse(
            serviceProvider,
            organisation,
            rollen,
            rollenerweiterungen,
        );

        expect(response.administrationsebene.name).toBe('');
    });
});
