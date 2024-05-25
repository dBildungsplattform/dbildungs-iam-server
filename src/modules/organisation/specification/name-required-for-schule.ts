import { CompositeSpecification } from '../../specification/specifications.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';

/**
 * `Name` is required, if the organisation-type is `SCHULE`
 */
export class NameRequiredForSchule extends CompositeSpecification<OrganisationDo<boolean>> {
    // eslint-disable-next-line @typescript-eslint/require-await
    public async isSatisfiedBy(t: OrganisationDo<boolean>): Promise<boolean> {
        if (t.typ === OrganisationsTyp.SCHULE) {
            return !!t.name;
        } else {
            return true;
        }
    }
}
