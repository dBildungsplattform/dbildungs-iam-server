export type VidisOfferCategoriesResponse = {
    category: string[];
    competency: string[];
    gradeLevel: string[];
    schoolType: string[];
};

export type VidisOfferResponse = {
    offerId: number;
    offerVersion: number;
    offerDescription: string;
    offerLink: string;
    offerLogo: string;
    offerTitle: string;
    offerLongTitle: string;
    offerResourcePk?: number;
    offerStatus?: string;
    offerKategorien?: VidisOfferCategoriesResponse;
    educationProviderOrganizationId?: number;
    educationProviderOrganizationName: string;
    educationProviderUserEmail?: string;
    educationProviderUserId?: number;
    educationProviderUserName?: string;
    schoolActivations: string[];
};

type ActionProperty = {
    [key: string]: string;
};

type Actions = {
    [key: string]: ActionProperty;
};

export type VidisResponse<T> = {
    facets: {
        facetCriteria: string;
        facetValues: {
            numberOfOccurrences: number;
            term: string;
        }[];
    }[];
    lastPage: number;
    totalCount: number;
    pageSize: number;
    actions: Actions;
    page: number;
    items: T[];
};
