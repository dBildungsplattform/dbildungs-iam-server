import { Rolle } from './rolle.js';

export const RollenArtTypName: string = 'RollenArt';
export const RollenMerkmalTypName: string = 'RollenMerkmal';
export enum RollenArt {
    LERN = 'LERN',
    LEHR = 'LEHR',
    EXTERN = 'EXTERN',
    ORGADMIN = 'ORGADMIN',
    LEIT = 'LEIT',
    SYSADMIN = 'SYSADMIN',
    SORGBER = 'SORGBER',
    SCHB = 'SCHB',
    NLEHR = 'NLEHR',
}

export enum RollenMerkmal {
    BEFRISTUNG_PFLICHT = 'BEFRISTUNG_PFLICHT',
    KOPERS_PFLICHT = 'KOPERS_PFLICHT',
    MPT_ROLLE = 'MPT_ROLLE',
}

export function isMPTRolle(rolle: Rolle<true>): boolean {
    return (
        rolle.rollenart === RollenArt.SORGBER ||
        rolle.rollenart === RollenArt.SCHB ||
        rolle.rollenart === RollenArt.NLEHR
    );
}
