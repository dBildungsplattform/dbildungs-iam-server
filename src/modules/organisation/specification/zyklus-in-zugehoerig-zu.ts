import { CompositeSpecification } from '../../specification/specifications.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationRepo } from '../persistence/organisation.repo.js';

export class ZyklusInZugehoerigZu extends CompositeSpecification<OrganisationDo<true>> {
    public constructor(private readonly organisationRepo: OrganisationRepo) {
        super();
    }

    public async isSatisfiedBy(t: OrganisationDo<true>): Promise<boolean> {
        return this.isCircularReference(t, []);
    }

    private async isCircularReference(orga: OrganisationDo<true>, list: OrganisationDo<true>[]): Promise<boolean> {
        for (const item of list) {
            if (item.id === orga.id) {
                return true;
            }
        }
        if (orga.zugehoerigZu) {
            const parent: Option<OrganisationDo<true>> = await this.organisationRepo.findById(orga.zugehoerigZu);
            if (parent) {
                list.push(orga);
                return this.isCircularReference(parent, list);
            }
        }
        return false;
    }
}
