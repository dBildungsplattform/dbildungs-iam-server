import { RollenArt } from '../../rolle/domain/rolle.enums.js';

export enum SchulconnexErreichbarkeitTyp {
    EMAIL = 'E-Mail',
}

export enum SchulconnexGruppeTyp {
    KLASSE = 'Klasse',
}

export enum SchulconnexOrganisationTyp {
    SCHULE = 'Schule',
    SONSTIGE = 'Sonstige',
}

export enum SchulconnexPersonenstatus {
    AKTIV = 'Aktiv',
}

export enum SchulconnexRolle {
    LERN = 'Lern',
    LEHR = 'Lehr',
    SORGBER = 'SorgBer',
    EXTERN = 'Extern',
    ORGADMIN = 'OrgAdmin',
    LEIT = 'Leit',
    SYSADMIN = 'SysAdmin',
    SCHB = 'SchB',
    NLEHR = 'NLehr',
}

export function convertSPSHRollenartToSchulconnexRolleV1(rollenart: RollenArt): SchulconnexRolle {
    switch (rollenart) {
        case RollenArt.LERN:
            return SchulconnexRolle.LERN;
        case RollenArt.LEHR:
            return SchulconnexRolle.LEHR;
        case RollenArt.LEIT:
            return SchulconnexRolle.LEIT;
        case RollenArt.SYSADMIN:
            return SchulconnexRolle.SYSADMIN;
        case RollenArt.ORGADMIN:
            return SchulconnexRolle.ORGADMIN;
        case RollenArt.EXTERN:
            return SchulconnexRolle.EXTERN;
        case RollenArt.SORGBER:
            return SchulconnexRolle.EXTERN;
        case RollenArt.SCHB:
            return SchulconnexRolle.LEHR;
        case RollenArt.NLEHR:
            return SchulconnexRolle.LEHR;
    }
}

export function convertSPSHRollenartToSchulconnexRolleV2(rollenart: RollenArt): SchulconnexRolle {
    switch (rollenart) {
        case RollenArt.LERN:
            return SchulconnexRolle.LERN;
        case RollenArt.LEHR:
            return SchulconnexRolle.LEHR;
        case RollenArt.LEIT:
            return SchulconnexRolle.LEIT;
        case RollenArt.SYSADMIN:
            return SchulconnexRolle.SYSADMIN;
        case RollenArt.ORGADMIN:
            return SchulconnexRolle.ORGADMIN;
        case RollenArt.EXTERN:
            return SchulconnexRolle.EXTERN;
        case RollenArt.SORGBER:
            return SchulconnexRolle.SORGBER;
        case RollenArt.SCHB:
            return SchulconnexRolle.SCHB;
        case RollenArt.NLEHR:
            return SchulconnexRolle.NLEHR;
    }
}
