import { xor } from 'lodash-es';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { CompositeSpecification } from '../../specification/specifications.js';

import { ServiceProviderMerkmal } from '../../service-provider/domain/service-provider.enum.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { Rolle } from '../domain/rolle.js';
export class NurNachtraeglichZuweisbareServiceProvider extends CompositeSpecification<Rolle<boolean>> {
    public constructor(
        private readonly serviceProviderRepo: ServiceProviderRepo,
        private readonly oldRolle: Rolle<true>,
    ) {
        super();
    }

    public async isSatisfiedBy(updatedRolle: Rolle<boolean>): Promise<boolean> {
        const changedServiceProviderIds: string[] = xor(
            this.oldRolle.serviceProviderIds,
            updatedRolle.serviceProviderIds,
        );
        const changedServiceProviders: Map<string, ServiceProvider<true>> = await this.serviceProviderRepo.findByIds(
            changedServiceProviderIds,
        );

        for (const changedServiceProvider of changedServiceProviders.values()) {
            if (!changedServiceProvider.merkmale.includes(ServiceProviderMerkmal.NACHTRAEGLICH_ZUWEISBAR)) {
                return false;
            }
        }
        return true;
    }
}
