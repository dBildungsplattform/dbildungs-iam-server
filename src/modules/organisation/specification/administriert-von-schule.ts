import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationRepo } from '../persistence/organisation.repo.js';
import { CompositeSpecification } from '../../specification/specifications.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';

export class AdministriertVonSchule extends CompositeSpecification<OrganisationDo<true>> {
    public constructor(private readonly organisationRepo: OrganisationRepo) {
        super();
    }

    public async isSatisfiedBy(t: OrganisationDo<true>): Promise<boolean> {
        if (!t.administriertVon) return false;
        const organisation: Option<OrganisationDo<true>> = await this.organisationRepo.findById(t.administriertVon);
        if (!organisation) return false;
        return organisation.typ === OrganisationsTyp.SCHULE;
    }
}
