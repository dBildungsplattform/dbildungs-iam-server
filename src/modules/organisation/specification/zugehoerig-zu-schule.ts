import { CompositeSpecification } from '../../specification/composite-specification.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationRepo } from '../persistence/organisation.repo.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';

export class ZugehoerigZuSchule extends CompositeSpecification<OrganisationDo<true>> {
    public constructor(private readonly organisationRepo: OrganisationRepo) {
        super();
    }

    public async isSatisfiedBy(t: OrganisationDo<true>): Promise<boolean> {
        if (!t.zugehoerigZu) return false;
        const organisation: Option<OrganisationDo<true>> = await this.organisationRepo.findById(t.zugehoerigZu);
        if (!organisation) return false;
        return Promise.resolve(organisation.typ == OrganisationsTyp.SCHULE);
    }
}
