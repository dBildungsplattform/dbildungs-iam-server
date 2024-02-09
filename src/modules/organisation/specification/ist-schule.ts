import { CompositeSpecification } from '../../specification/composite-specification.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';

export class IstSchule extends CompositeSpecification<OrganisationDo<true>> {
    public async isSatisfiedBy(t: OrganisationDo<true>): Promise<boolean> {
        return Promise.resolve(t.typ == OrganisationsTyp.SCHULE);
    }
}
