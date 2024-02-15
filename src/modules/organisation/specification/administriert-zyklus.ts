import { CompositeSpecification } from '../../specification/specifications.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationRepo } from '../persistence/organisation.repo.js';

export class AdministriertZyklus extends CompositeSpecification<OrganisationDo<true>> {
    public constructor(
        private readonly organisationRepo: OrganisationRepo,
        private readonly rootOrganisation: string,
    ) {
        super();
    }

    public async isSatisfiedBy(t: OrganisationDo<true>): Promise<boolean> {
        return this.isCircularReference(t, []);
    }

    private async isCircularReference(orga: OrganisationDo<true>, list: OrganisationDo<true>[]): Promise<boolean> {
        for (const item of list) {
            if (item.id === orga.id) {
                if (orga.id === this.rootOrganisation) {
                    if (orga.administriertVon === orga.id) {
                        return false;
                    }
                }
                return true;
            }
        }
        if (orga.administriertVon) {
            const parent: Option<OrganisationDo<true>> = await this.organisationRepo.findById(orga.administriertVon);
            if (parent) {
                list.push(orga);
                return this.isCircularReference(parent, list);
            }
        }
        return false;
    }
}
