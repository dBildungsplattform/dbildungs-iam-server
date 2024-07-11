import { CompositeSpecification } from '../../specification/specifications.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';

//Refactor this to use Organisation aggregate when ticket SPSH-738 is merged
export class NameRequiredForKlasse extends CompositeSpecification<OrganisationDo<boolean>> {
    // eslint-disable-next-line @typescript-eslint/require-await
    public async isSatisfiedBy(t: OrganisationDo<boolean>): Promise<boolean> {
        if (t.typ === OrganisationsTyp.KLASSE) {
            return !!t.name;
        } else {
            return true;
        }
    }
}
