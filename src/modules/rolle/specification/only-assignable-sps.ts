import { sortBy, sortedUniqBy, xorBy } from 'lodash-es';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { CompositeSpecification } from '../../specification/specifications.js';

import { ServiceProviderMerkmal } from '../../service-provider/domain/service-provider.enum.js';
import { Rolle } from '../domain/rolle.js';
export class NurNachtraeglichZuweisbareServiceProvider extends CompositeSpecification<Rolle<boolean>> {
    public constructor(private readonly oldRolle: Rolle<true>) {
        super();
    }

    public async isSatisfiedBy(updatedRolle: Rolle<boolean>): Promise<boolean> {
        return Promise.resolve(this.validateServiceProviderChange(updatedRolle, this.oldRolle));
    }

    private validateServiceProviderChange(oldRolle: Rolle<boolean>, updatedRolle: Rolle<boolean>): boolean {
        return xorBy(
            this.sortAndDepuplicateServiceProviders(oldRolle.serviceProviderData),
            this.sortAndDepuplicateServiceProviders(updatedRolle.serviceProviderData),
        ).every((sp: ServiceProvider<true>) => sp.merkmale.includes(ServiceProviderMerkmal.NACHTRAEGLICH_ZUWEISBAR));
    }

    private sortAndDepuplicateServiceProviders(serviceProviders: ServiceProvider<true>[]): ServiceProvider<true>[] {
        return sortedUniqBy(
            sortBy(serviceProviders, (sp: ServiceProvider<true>) => sp.id),
            (sp: ServiceProvider<true>) => sp.id,
        );
    }
}
