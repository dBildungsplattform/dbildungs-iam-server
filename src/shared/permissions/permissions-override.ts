import { RollenSystemRecht } from '../../modules/rolle/domain/systemrecht.js';
import { OrganisationID, PersonID } from '../types/index.js';
import { IPersonPermissions } from './person-permissions.interface.js';

/**
 * This class can be used to selectively override permissions.
 *
 * @example
 * ```
 * const overriddenPermissions = new PermissionsOverride(originalPermissionObject);
 *
 * overriddenPermissions.grandPersonModifyPermission("person-id-example");
 *
 * // Will return true
 * overriddenPermissions.canModifyPerson("person-id-example");
 *
 * // Will call the original permissions to validate
 * overriddenPermissions.canModifyPerson("some-other-person-id");
 * ```
 */
export class PermissionsOverride implements IPersonPermissions {
    // The set of PersonIDs, for which the permissions should explicitly return true
    private readonly modifyPersonOverride: Set<PersonID> = new Set();

    // Organisations and permissions which have been explicitly granted
    private readonly organisationSystemrechteOverride: Map<OrganisationID, RollenSystemRecht[]> = new Map();

    public constructor(private readonly underlyingPermissions: IPersonPermissions) {}

    /**
     * Grant permissions to modify a person
     */
    public grantPersonModifyPermission(personID: PersonID): this {
        this.modifyPersonOverride.add(personID);
        return this;
    }

    /**
     * Adds specific systemrechte to the permissions
     */
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
