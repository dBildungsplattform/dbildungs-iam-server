import { EventService } from '../../../core/eventbus/services/event.service.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityCouldNotBeUpdated } from '../../../shared/error/entity-could-not-be-updated.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { KlasseUpdatedEvent } from '../../../shared/events/klasse-updated.event.js';
import { OrganisationRepo } from '../persistence/organisation.repo.js';
import { KlassenNameAnSchuleEindeutigError } from '../specification/error/klassen-name-an-schule-eindeutig.error.js';
import { NameRequiredForKlasseError } from '../specification/error/name-required-for-klasse.error.js';
import { OrganisationSpecificationError } from '../specification/error/organisation-specification.error.js';
import { KlassenNameAnSchuleEindeutig } from '../specification/klassen-name-an-schule-eindeutig.js';
import { NameRequiredForKlasse } from '../specification/name-required-for-klasse.js';
import { OrganisationDo } from './organisation.do.js';
import { OrganisationsTyp } from './organisation.enums.js';

export class OrganisationUpdate {
    private constructor(
        private readonly eventService: EventService,
        private readonly organisationRepo: OrganisationRepo,
        public readonly organisationId: string,
    ) {}

    public static createNew(
        eventService: EventService,
        organisationRepo: OrganisationRepo,
        organisationId: string,
    ): OrganisationUpdate {
        return new OrganisationUpdate(eventService, organisationRepo, organisationId);
    }

    public async updateKlassenName(newName: string): Promise<DomainError | void> {
        const organisationFound: Option<OrganisationDo<true>> = await this.organisationRepo.findById(
            this.organisationId,
        );

        if (!organisationFound) {
            return new EntityNotFoundError('Organisation', this.organisationId);
        }

        if (organisationFound.typ == OrganisationsTyp.KLASSE) {
            organisationFound.name = newName;

            const specificationError: undefined | OrganisationSpecificationError = await this.checkKlasseSpecifications(
                this.organisationRepo,
                organisationFound,
            );

            if (specificationError) {
                return specificationError;
            }
        } else {
            return new EntityCouldNotBeUpdated('Organisation', this.organisationId, [
                'Only the name of Klassen can be updated.',
            ]);
        }

        await this.organisationRepo.save(organisationFound);
        this.eventService.publish(new KlasseUpdatedEvent(this.organisationId));
    }

    //Refactor this to use organisationRepository when ticket SPSH-738 is merged
    public async checkKlasseSpecifications(
        organisationRepo: OrganisationRepo,
        organisation: OrganisationDo<boolean>,
    ): Promise<undefined | OrganisationSpecificationError> {
        const nameRequiredForKlasse: NameRequiredForKlasse = new NameRequiredForKlasse();
        if (!(await nameRequiredForKlasse.isSatisfiedBy(organisation))) {
            return new NameRequiredForKlasseError();
        }

        const klassenNameAnSchuleEindeutig: KlassenNameAnSchuleEindeutig = new KlassenNameAnSchuleEindeutig(
            organisationRepo,
        );
        if (!(await klassenNameAnSchuleEindeutig.isSatisfiedBy(organisation))) {
            return new KlassenNameAnSchuleEindeutigError(organisation.id ?? undefined);
        }

        return undefined;
    }
}
