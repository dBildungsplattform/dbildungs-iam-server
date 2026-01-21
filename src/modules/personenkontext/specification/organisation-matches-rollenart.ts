import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';

/**
 * Only needs to be checked when referenced organisation is of type KLASSE.
 * Needs to be refactored into a specification
 */
export class OrganisationMatchesRollenart {
    private static readonly rollenartToOrganisationsTypMap: Map<RollenArt, Array<OrganisationsTyp>> = new Map([
        [RollenArt.SYSADMIN, [ OrganisationsTyp.LAND, OrganisationsTyp.ROOT]],
        [RollenArt.LEIT, [ OrganisationsTyp.SCHULE]],
        [RollenArt.LERN, [ OrganisationsTyp.SCHULE, OrganisationsTyp.KLASSE]],
        [RollenArt.LEHR, [ OrganisationsTyp.SCHULE]],
    ]);

    public isSatisfiedBy(organisation: Organisation<true>, rolle: Rolle<true>): boolean {
        if (!OrganisationMatchesRollenart.rollenartToOrganisationsTypMap.has(rolle.rollenart)) {
            return true;
        };

        if (!organisation.typ) {
            return false;
        }

        return OrganisationMatchesRollenart.rollenartToOrganisationsTypMap.get(rolle.rollenart)!.includes(organisation.typ);
    }

    public static getAllowedRollenartenForOrganisationsTyp(organisationsTyp: OrganisationsTyp): Set<RollenArt> {
        const allowedRollenarten: Set<RollenArt> = new Set();
        for (const [rollenArt, organisationsTypen] of this.rollenartToOrganisationsTypMap) {
            if (organisationsTypen.includes(organisationsTyp)) {
                allowedRollenarten.add(rollenArt);
            }
        }
        return allowedRollenarten;
    }
}
