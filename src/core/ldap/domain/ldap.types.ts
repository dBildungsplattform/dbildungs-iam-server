export type LdapPersonEntry = {
    cn: string;
    sn: string;
    mail: string[];
    objectclass: string[];
};

export type LdapOrganisationEntry = {
    ou: string;
    objectclass: string[];
};
