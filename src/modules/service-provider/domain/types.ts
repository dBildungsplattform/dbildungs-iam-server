import { Organisation } from '../../organisation/domain/organisation.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { Rollenerweiterung } from '../../rolle/domain/rollenerweiterung.js';
import { ServiceProvider } from './service-provider.js';

export type ManageableServiceProviderWithReferencedObjects = {
    serviceProvider: ServiceProvider<true>;
    organisation: Organisation<true>;
    rollen: Rolle<true>[];
    rollenerweiterungen: Rollenerweiterung<true>[];
    rollenerweiterungenWithName?: RollenerweiterungForManageableServiceProvider[];
};

export type RollenerweiterungForManageableServiceProvider = {
    organisation: Organisation<true>;
    rolle: Rolle<true>;
};
