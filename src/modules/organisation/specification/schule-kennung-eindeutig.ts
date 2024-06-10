import { CompositeSpecification } from '../../specification/specifications.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';
import { OrganisationScope } from '../persistence/organisation.scope.js';
import { OrganisationRepo } from '../persistence/organisation.repo.js';

export class SchuleKennungEindeutig extends CompositeSpecification<OrganisationDo<boolean>> {
    public constructor(private readonly organisationRepo: OrganisationRepo) {
        super();
    }

    public async isSatisfiedBy(organisation: OrganisationDo<boolean>): Promise<boolean> {
        if (organisation.typ !== OrganisationsTyp.SCHULE) return true;
        return this.validateSchuleKennungIsUnique(organisation);
    }

    private async validateSchuleKennungIsUnique(organisation: OrganisationDo<boolean>): Promise<boolean> {
        const orgaScope: OrganisationScope = new OrganisationScope();
        orgaScope.findBy({
            kennung: organisation.kennung,
        });
        const [, total]: Counted<OrganisationDo<true>> = await this.organisationRepo.findBy(orgaScope);
        return total <= 0;
    }
}
