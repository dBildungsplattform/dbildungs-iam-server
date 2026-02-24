/* v8 ignore file @preserv */
// types can not be covered by v8, since the code does not exist at runtime

export type VidisAngebotKategorie = {
    category: string[];
    competency: string[];
    gradeLevel: string[];
    schoolType: string[];
};

export type VidisAngebot = {
    angebotId: string;
    angebotVersion: number;
    angebotDescription: string;
    angebotLink: string;
    angebotLogo: string;
    angebotTitle: string;
    angebotLongTitle: string;
    angebotResourcePk?: number;
    angebotStatus?: string;
    angebotKategorien?: VidisAngebotKategorie;
    educationProviderOrganizationId?: number;
    educationProviderOrganizationName: string;
    educationProviderUserEmail?: string;
    educationProviderUserId?: number;
    educationProviderUserName?: string;
    schoolActivations: string[];
};
