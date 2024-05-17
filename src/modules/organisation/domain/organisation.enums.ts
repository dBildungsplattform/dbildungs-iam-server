export const OrganisationsTypName: string = 'OrganisationsTyp';
export const TraegerschaftTypName: string = 'TraegerschaftTyp';

export enum OrganisationsTyp {
    ROOT = 'ROOT',
    LAND = 'LAND',
    TRAEGER = 'TRAEGER',
    SCHULE = 'SCHULE',
    KLASSE = 'KLASSE',
    ANBIETER = 'ANBIETER',
    SONSTIGE = 'SONSTIGE ORGANISATION / EINRICHTUNG',
    UNBEST = 'UNBESTAETIGT',
}

export enum Traegerschaft {
    BUND = '01',
    LAND = '02',
    KOMMUNE = '03',
    PRIVAT = '04',
    KIRCHLICH = '05',
    SONSTIGE = '06',
}
