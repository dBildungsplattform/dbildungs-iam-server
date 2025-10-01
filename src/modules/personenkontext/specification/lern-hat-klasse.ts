import { OrganisationID, RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { CompositeSpecification } from '../../specification/specifications.js';
import { Personenkontext } from '../domain/personenkontext.js';

export class LernHatKlasse extends CompositeSpecification<Array<Personenkontext<boolean>>> {
    public constructor(
        private readonly organisationRepository: OrganisationRepository,
        private readonly rolleRepo: RolleRepo,
    ) {
        super();
    }

    public async isSatisfiedBy(pks: Array<Personenkontext<boolean>>): Promise<boolean> {
        const hasLernRolle: boolean = await this.hasLernRolle(pks);
        if (!hasLernRolle) {
            return true;
        } // spec does not apply, no LERN rolle

        const hasAtLeastOneKlasse: boolean = await this.hasAtLeastOneKlasse(pks);
        return hasAtLeastOneKlasse;
    }

    private async hasLernRolle(pks: Array<Personenkontext<boolean>>): Promise<boolean> {
        const rolleIds: Set<RolleID> = new Set(pks.map((pk: Personenkontext<boolean>) => pk.rolleId));
        const rollen: Map<RolleID, Rolle<true>> = await this.rolleRepo.findByIds(Array.from(rolleIds));
        return Array.from(rollen.values()).some((rolle: Rolle<true>) => rolle.rollenart === RollenArt.LERN);
    }

    private async hasAtLeastOneKlasse(pks: Array<Personenkontext<boolean>>): Promise<boolean> {
        const organisationIds: Set<OrganisationID> = new Set(
            pks.map((pk: Personenkontext<boolean>) => pk.organisationId),
        );
        const organisationen: Map<OrganisationID, Organisation<true>> = await this.organisationRepository.findByIds(
            Array.from(organisationIds),
        );
        // we must have at least one PK at a KLASSE
        for (const organisation of organisationen.values()) {
            if (organisation.typ === OrganisationsTyp.KLASSE) {
                return true;
            }
        }
        return false;
    }
}
