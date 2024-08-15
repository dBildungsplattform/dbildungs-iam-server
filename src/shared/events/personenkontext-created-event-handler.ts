import { PersonID } from '../types/index.js';
import { Personenkontext } from '../../modules/personenkontext/domain/personenkontext.js';
import { Rolle } from '../../modules/rolle/domain/rolle.js';
import { ServiceProvider } from '../../modules/service-provider/domain/service-provider.js';
import { ServiceProviderKategorie } from '../../modules/service-provider/domain/service-provider.enum.js';
import { ClassLogger } from '../../core/logging/class-logger.js';
import { RolleRepo } from '../../modules/rolle/repo/rolle.repo.js';
import { ServiceProviderRepo } from '../../modules/service-provider/repo/service-provider.repo.js';
import { DBiamPersonenkontextRepo } from '../../modules/personenkontext/persistence/dbiam-personenkontext.repo.js';

export abstract class PersonenkontextCreatedEventHandler {
    protected constructor(
        protected readonly logger: ClassLogger,
        protected readonly rolleRepo: RolleRepo,
        protected readonly serviceProviderRepo: ServiceProviderRepo,
        protected readonly dbiamPersonenkontextRepo: DBiamPersonenkontextRepo,
    ) {}

    protected async handlePerson(personId: PersonID): Promise<void> {
        const personenkontexte: Personenkontext<true>[] = await this.dbiamPersonenkontextRepo.findByPerson(personId);
        const rollenIds: string[] = personenkontexte.map((pk: Personenkontext<true>) => pk.rolleId);
        const rollenMap: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(rollenIds);
        const rollen: Rolle<true>[] = Array.from(rollenMap.values(), (value: Rolle<true>) => {
            return value;
        });

        const needsEmail: boolean = await this.anyRolleReferencesEmailServiceProvider(rollen);

        if (needsEmail) {
            this.logger.info(`Person with id:${personId} needs an email, creating or enabling address`);
            await this.onNeedsEmail(personId);
        } else {
            //currently no else for calling disablingEmail is necessary, emails are only disabled, when the person is deleted not by PK-events
            this.logger.info(`Person with id:${personId} does not need an email`);
        }
    }

    protected async anyRolleReferencesEmailServiceProvider(rollen: Rolle<true>[]): Promise<boolean> {
        const pro: Promise<boolean>[] = rollen.map((rolle: Rolle<true>) =>
            this.rolleReferencesEmailServiceProvider(rolle),
        );
        const results: boolean[] = await Promise.all(pro);

        return results.some((r: boolean) => r);
    }

    protected async rolleReferencesEmailServiceProvider(rolle: Rolle<true>): Promise<boolean> {
        const serviceProviderMap: Map<string, ServiceProvider<true>> = await this.serviceProviderRepo.findByIds(
            rolle.serviceProviderIds,
        );
        const serviceProviders: ServiceProvider<true>[] = Array.from(
            serviceProviderMap.values(),
            (value: ServiceProvider<true>) => {
                return value;
            },
        );

        return serviceProviders.some((sp: ServiceProvider<true>) => sp.kategorie === ServiceProviderKategorie.EMAIL);
    }

    protected abstract onNeedsEmail(personId: PersonID): Promise<void>;
}
