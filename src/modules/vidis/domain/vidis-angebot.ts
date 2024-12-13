export type VidisAngebotKategorie = {
    category: string[];
    competency: string[];
    gradeLevel: string[];
    schoolType: string[];
};

export type VidisAngebot = {
    angebotId?: number;
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
