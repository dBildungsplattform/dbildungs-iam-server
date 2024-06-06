import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';

/**
 * Only needs to be checked when referenced organisation is of type KLASSE.
 * Needs to be refactored into a specification
 */
export class OrganisationMatchesRollenart {
    public isSatisfiedBy(organisation: OrganisationDo<true>, rolle: Rolle<true>): boolean {
        if (rolle.rollenart === RollenArt.SYSADMIN)
            return organisation.typ === OrganisationsTyp.LAND || organisation.typ === OrganisationsTyp.ROOT;
        if (rolle.rollenart === RollenArt.LEIT) return organisation.typ === OrganisationsTyp.SCHULE;
        if (rolle.rollenart === RollenArt.LERN)
            return organisation.typ === OrganisationsTyp.SCHULE || organisation.typ === OrganisationsTyp.KLASSE;
        if (rolle.rollenart === RollenArt.LEHR) return organisation.typ === OrganisationsTyp.SCHULE;

        return true;
    }
}
