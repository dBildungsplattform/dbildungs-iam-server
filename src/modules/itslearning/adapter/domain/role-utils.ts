import { RollenArt } from '../../../rolle/domain/rolle.enums.js';
import { IMSESInstitutionRoleType, IMSESRoleType } from './role.enum.js';

// Determines order of roles.
// example: If person has both a EXTERN and a LEHR role, the LEHR role has priority
const ROLLENART_VALUES: Record<RollenArt, number> = {
    [RollenArt.EXTERN]: 0,
    [RollenArt.LERN]: 1,
    [RollenArt.SORGBER]: 2,
    [RollenArt.SCHB]: 3,
    [RollenArt.NLEHR]: 4,
    [RollenArt.LEHR]: 5,
    [RollenArt.LEIT]: 6,
    [RollenArt.ORGADMIN]: 7,
    [RollenArt.SYSADMIN]: 8,
};

// Maps our roles to itsLearning roles
const ROLLENART_TO_ITSLEARNING_ROLE: Record<RollenArt, IMSESInstitutionRoleType> = {
    [RollenArt.EXTERN]: IMSESInstitutionRoleType.GUEST,
    [RollenArt.LERN]: IMSESInstitutionRoleType.STUDENT,
    [RollenArt.LEHR]: IMSESInstitutionRoleType.STAFF,
    [RollenArt.LEIT]: IMSESInstitutionRoleType.ADMINISTRATOR,
    [RollenArt.ORGADMIN]: IMSESInstitutionRoleType.ADMINISTRATOR,
    [RollenArt.SYSADMIN]: IMSESInstitutionRoleType.SYSTEM_ADMINISTRATOR,
    [RollenArt.SORGBER]: IMSESInstitutionRoleType.STUDENT,
    [RollenArt.SCHB]: IMSESInstitutionRoleType.GUEST,
    [RollenArt.NLEHR]: IMSESInstitutionRoleType.GUEST,
};

// Maps our roles to IMS ES roles (Different from InstitutionRoleType)
const ROLLENART_TO_IMSES_ROLE: Record<RollenArt, IMSESRoleType> = {
    [RollenArt.EXTERN]: IMSESRoleType.MEMBER,
    [RollenArt.LERN]: IMSESRoleType.LEARNER,
    [RollenArt.LEHR]: IMSESRoleType.INSTRUCTOR,
    [RollenArt.LEIT]: IMSESRoleType.ADMINISTRATOR,
    [RollenArt.ORGADMIN]: IMSESRoleType.ADMINISTRATOR,
    [RollenArt.SYSADMIN]: IMSESRoleType.ADMINISTRATOR,
    [RollenArt.SORGBER]: IMSESRoleType.LEARNER,
    [RollenArt.SCHB]: IMSESRoleType.TEACHING_ASSISTANT,
    [RollenArt.NLEHR]: IMSESRoleType.TEACHING_ASSISTANT,
};

export function higherRollenart(a: RollenArt, b: RollenArt): RollenArt {
    return ROLLENART_VALUES[a] > ROLLENART_VALUES[b] ? a : b;
}

export function lowerRollenart(a: RollenArt, b: RollenArt): RollenArt {
    return ROLLENART_VALUES[a] < ROLLENART_VALUES[b] ? a : b;
}

export function determineHighestRollenart(
    rollen: RollenArt[],
    limitRollenart: RollenArt = RollenArt.SYSADMIN,
): RollenArt {
    const highestRolle: RollenArt = rollen.reduce(
        (highestRole: RollenArt, role: RollenArt) => higherRollenart(role, highestRole),
        RollenArt.EXTERN,
    );

    // Limit rollenart
    return lowerRollenart(highestRolle, limitRollenart);
}

export function rollenartToIMSESInstitutionRole(role: RollenArt): IMSESInstitutionRoleType {
    return ROLLENART_TO_ITSLEARNING_ROLE[role];
}

export function rollenartToIMSESRole(role: RollenArt): IMSESRoleType {
    return ROLLENART_TO_IMSES_ROLE[role];
}
