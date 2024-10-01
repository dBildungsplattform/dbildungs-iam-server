import { Injectable } from '@nestjs/common';
import { uniq } from 'lodash-es';
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
        const rollen: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(rolleIds);
        const serviceProviderIds: Array<string> = uniq(
            Array.from(rollen.values()).flatMap((rolle: Rolle<true>) => rolle.serviceProviderIds),
        );
        const serviceProviders: Map<string, ServiceProvider<true>> = await this.serviceProviderRepo.findByIds(
            serviceProviderIds,
        );

        return Array.from(serviceProviders.values());
    }
}
