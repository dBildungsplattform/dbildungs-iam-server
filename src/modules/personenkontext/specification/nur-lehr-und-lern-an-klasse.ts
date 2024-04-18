import { CompositeSpecification } from '../../specification/specifications.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';

/**
 * Only needs to be checked when referenced organisation is of type KLASSE.
 */
export class NurLehrUndLernAnKlasse extends CompositeSpecification<Personenkontext<boolean>> {
    public constructor(
        private readonly organisationRepo: OrganisationRepo,
        private readonly rolleRepo: RolleRepo,
    ) {
        super();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async isSatisfiedBy(p: Personenkontext<boolean>): Promise<boolean> {
        const organisation: Option<OrganisationDo<true>> = await this.organisationRepo.findById(p.organisationId);
        if (!organisation) return false;
        if (organisation.typ !== OrganisationsTyp.KLASSE) return true;

        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(p.rolleId);
        if (!rolle) return false;
        return rolle.rollenart === RollenArt.LEHR || rolle.rollenart === RollenArt.LERN;
    }
}
