import { CompositeSpecification } from '../../specification/specifications.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { RolleID } from '../../../shared/types/index.js';

export class LandesadminNurVonLandesadminAdministriert extends CompositeSpecification<Personenkontext<boolean>> {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly permissions: PersonPermissions,
    ) {
        super();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async isSatisfiedBy(p: Personenkontext<boolean>): Promise<boolean> {
        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(p.rolleId);
        if (!rolle) return false;

        if (rolle.rollenart != RollenArt.SYSADMIN) return true;

        const currentUserRoleID: RolleID | undefined = await this.permissions.getCurrentUserRoleByOrganisationId(
            p.organisationId,
        );

        if (!currentUserRoleID) return false;

        const currentUserRole: Option<Rolle<true>> = await this.rolleRepo.findById(currentUserRoleID);
        if (!currentUserRole) return false;

        return rolle.rollenart === RollenArt.SYSADMIN && currentUserRole.rollenart === RollenArt.SYSADMIN;
    }
}
