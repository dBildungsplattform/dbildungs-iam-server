import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderInternalRepo } from '../repo/service-provider.internal.repo.js';
import { CompositeSpecification } from '../../specification/specifications.js';

export class DuplicateNameSpecification extends CompositeSpecification<ServiceProvider<boolean>> {
    public constructor(private readonly serviceProviderInternalRepo: ServiceProviderInternalRepo) {
        super();
    }

    public isSatisfiedBy(serviceProvider: ServiceProvider<boolean>): Promise<boolean> {
        return this.serviceProviderInternalRepo.existsDuplicateNameForOrganisation(
            serviceProvider.name,
            serviceProvider.providedOnSchulstrukturknoten,
            serviceProvider.id,
        );
    }
}
