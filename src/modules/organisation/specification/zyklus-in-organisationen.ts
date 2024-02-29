import { CompositeSpecification } from '../../specification/specifications.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationRepo } from '../persistence/organisation.repo.js';

export class ZyklusInOrganisationen extends CompositeSpecification<OrganisationDo<true>> {
    public constructor(private readonly organisationRepo: OrganisationRepo) {
        super();
    }

    public async isSatisfiedBy(t: OrganisationDo<true>): Promise<boolean> {
        return (await this.validateAdministriertVon(t, [])) || (await this.validateZugehoerigZu(t, []));
    }

    private async validateAdministriertVon(orga: OrganisationDo<true>, list: OrganisationDo<true>[]): Promise<boolean> {
        for (const item of list) {
            if (item.id === orga.id) {
                return true;
            }
        }
        if (orga.administriertVon) {
            const parent: Option<OrganisationDo<true>> = await this.organisationRepo.findById(orga.administriertVon);
            if (parent) {
                list.push(orga);
                return this.validateAdministriertVon(parent, list);
            }
        }
        return false;
    }

    private async validateZugehoerigZu(orga: OrganisationDo<true>, list: OrganisationDo<true>[]): Promise<boolean> {
        for (const item of list) {
            if (item.id === orga.id) {
                return true;
            }
        }
        if (orga.zugehoerigZu) {
            const parent: Option<OrganisationDo<true>> = await this.organisationRepo.findById(orga.zugehoerigZu);
            if (parent) {
                list.push(orga);
                return this.validateZugehoerigZu(parent, list);
            }
        }
        return false;
    }
}
