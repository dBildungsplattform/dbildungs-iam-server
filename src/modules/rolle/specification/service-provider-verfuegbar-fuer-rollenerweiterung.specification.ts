import { ServiceProviderMerkmal } from '../../service-provider/domain/service-provider.enum.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { CompositeSpecification } from '../../specification/specifications.js';
import { Rollenerweiterung } from '../domain/rollenerweiterung.js';

export class ServiceProviderVerfuegbarFuerRollenerweiterung extends CompositeSpecification<Rollenerweiterung<boolean>> {
    public constructor() {
        super();
    }

    public async isSatisfiedBy(rollenerweiterung: Rollenerweiterung<boolean>): Promise<boolean> {
        const serviceProvider: Option<ServiceProvider<true>> = await rollenerweiterung.getServiceProvider();
        if (!serviceProvider) {
            return false;
        }
        return serviceProvider.merkmale.includes(ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG);
    }
}
