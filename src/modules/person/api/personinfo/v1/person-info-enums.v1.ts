import { RollenArt } from "../../../../rolle/domain/rolle.enums";

export enum PersonInfoKontextV1ErreichbarkeitTyp {
    EMAIL = 'E-Mail',
}

export enum PersonInfoKontextV1GruppeTyp {
    KLASSE = 'Klasse'
}

export enum PersonInfoKontextV1OrganisationTyp {
    SCHULE = 'Schule',
    SONSTIGE = 'Sonstige'
}

export enum PersonInfoKontextV1Personenstatus {
    AKTIV = 'Aktiv'
}

export enum PersonInfoKontextV1Rolle {
    LERN = 'Lern',
    LEHR = 'Lehr',
    SORGBER = 'SorgBer',
    EXTERN = 'Extern',
    ORGADMIN = 'OrgAdmin',
    LEIT = 'Leit',
    SYSADMIN = 'SysAdmin',
    SCHB = 'SchB',
    NLEHR = 'NLehr'
}

export function convertRollenartToPersonInfoKontextV1Rolle(rollenart: RollenArt): PersonInfoKontextV1Rolle{
    switch(rollenart){
        case RollenArt.LERN: return PersonInfoKontextV1Rolle.LERN;
        case RollenArt.LEHR: return PersonInfoKontextV1Rolle.LEHR;
        case RollenArt.LEIT: return PersonInfoKontextV1Rolle.LEIT;
        case RollenArt.SYSADMIN: return PersonInfoKontextV1Rolle.SYSADMIN;
        case RollenArt.ORGADMIN: return PersonInfoKontextV1Rolle.ORGADMIN;
        case RollenArt.EXTERN: return PersonInfoKontextV1Rolle.EXTERN;
    }
}