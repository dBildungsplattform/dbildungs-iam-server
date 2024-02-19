import { CompositeSpecification } from '../../specification/specifications.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationRepo } from '../persistence/organisation.repo.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';

export class SchuleAdministriertVonTraeger extends CompositeSpecification<OrganisationDo<true>> {
    public constructor(private readonly organisationRepo: OrganisationRepo) {
        super();
    }

    public async isSatisfiedBy(t: OrganisationDo<true>): Promise<boolean> {
        if (t.typ !== OrganisationsTyp.SCHULE) return true;
        if (!t.administriertVon) return false;
        const parent: Option<OrganisationDo<true>> = await this.organisationRepo.findById(t.administriertVon);
        if (!parent) return false;
        return parent.typ === OrganisationsTyp.TRAEGER;
    }
}
