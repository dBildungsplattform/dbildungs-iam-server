export type LdapPersonEntry = {
    cn: string;
    sn: string;
    personID?: string;
    employeeNumber: string;
    mailPrimaryAddress?: string;
    mailAlternativeAddress?: string;
    objectclass: string[];
    entryUUID?: string;
};

export type LdapOrganisationEntry = {
    ou: string;
    objectclass: string[];
};

export type LdapRoleEntry = {
    cn: string;
    ou: string;
    objectclass: string[];
};

export enum LdapEntityType {
    SCHULE = 'SCHULE',
    LEHRER = 'LEHRER',
}
