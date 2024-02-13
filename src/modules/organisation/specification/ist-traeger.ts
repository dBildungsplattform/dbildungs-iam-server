import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';
import { CompositeSpecification } from '../../specification/specifications.js';

export class IstTraeger extends CompositeSpecification<OrganisationDo<true>> {
    public async isSatisfiedBy(t: OrganisationDo<true>): Promise<boolean> {
        return Promise.resolve(t.typ == OrganisationsTyp.TRAEGER);
    }
}
