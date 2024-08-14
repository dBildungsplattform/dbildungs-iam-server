import { RollenSystemRecht } from '../../modules/rolle/domain/rolle.enums.js';
import { OrganisationID, PersonID } from '../types/index.js';
import { IPersonPermissions } from './person-permissions.interface.js';

export class PermissionsOverride implements IPersonPermissions {
    // The set of PersonIDs, for which the permissions should explicitly return true
    private readonly modifyPersonOverride: Set<PersonID> = new Set();

    private readonly organisationSystemrechteOverride: Map<OrganisationID, RollenSystemRecht[]> = new Map();

    public constructor(private readonly underlyingPermissions: IPersonPermissions) {}

    // Overrides

    public grantPersonModifyPermission(personID: PersonID): this {
        this.modifyPersonOverride.add(personID);
        return this;
    }

    public grantSystemrechteAtOrga(orga: OrganisationID, rechte: RollenSystemRecht[]): this {
        const systemrechte: RollenSystemRecht[] | undefined = this.organisationSystemrechteOverride.get(orga);

        if (systemrechte) {
            systemrechte.push(...rechte);
        } else {
            this.organisationSystemrechteOverride.set(orga, rechte.slice());
        }

        return this;
    }

    // Wrappers

    public async canModifyPerson(personId: PersonID): Promise<boolean> {
        if (this.modifyPersonOverride.has(personId)) {
            return true;
        }

        return this.underlyingPermissions.canModifyPerson(personId);
    }

    public async hasSystemrechteAtOrganisation(
        organisationId: OrganisationID,
        systemrechte: RollenSystemRecht[],
    ): Promise<boolean> {
        const overriddenSystemrechte: RollenSystemRecht[] =
            this.organisationSystemrechteOverride.get(organisationId) ?? [];

        // Filter out every systemrecht that is not already overwritten
        const remainingSystemrechte: RollenSystemRecht[] = systemrechte.filter(
            (r: RollenSystemRecht) => !overriddenSystemrechte.includes(r),
        );

        // If length is 0, every Systemrecht is already overwritten
        if (remainingSystemrechte.length === 0) {
            return true;
        }

        // Check remaining Systemrechte using the underlying permissions
        return this.underlyingPermissions.hasSystemrechteAtOrganisation(organisationId, remainingSystemrechte);
    }

    public async hasSystemrechtAtOrganisation(
        organisationId: OrganisationID,
        systemrechte: RollenSystemRecht,
    ): Promise<boolean> {
        const overriddenSystemrechte: RollenSystemRecht[] =
            this.organisationSystemrechteOverride.get(organisationId) ?? [];

        if (overriddenSystemrechte.includes(systemrechte)) {
            return true;
        }

        return this.underlyingPermissions.hasSystemrechtAtOrganisation(organisationId, systemrechte);
    }
}
