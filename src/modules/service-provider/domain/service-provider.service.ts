import { Injectable } from '@nestjs/common';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { ServiceProvider } from './service-provider.js';

@Injectable()
export class ServiceProviderService {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly serviceProviderRepo: ServiceProviderRepo,
    ) {}

    public async getServiceProvidersByRolleIds(rolleIds: string[]): Promise<ServiceProvider<true>[]> {
        const serviceProviders: Map<string, ServiceProvider<true>> = new Map();
        for (const rolleId of rolleIds) {
            const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(rolleId);
            if (rolle) {
                for (const serviceProviderId of rolle.serviceProviderIds) {
                    if (serviceProviders.has(serviceProviderId)) continue;
                    const serviceProvider: Option<ServiceProvider<true>> =
                        await this.serviceProviderRepo.findById(serviceProviderId);
                    if (serviceProvider) {
                        serviceProviders.set(serviceProviderId, serviceProvider);
                    }
                }
            }
        }
        return Array.from(serviceProviders.values());
    }
}
