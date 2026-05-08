type ActionProperty = {
    [key: string]: string;
};

type Actions = {
    [key: string]: ActionProperty;
};

export type VidisApiResponseSchoolActivation = { 
    date: string,
    regionName: string
}

export type VidisApiResponseAngebot = {
    clientId: string;
    educationProviderOrganizationName: string;
    offerDescription: string;
    offerId: number;
    offerLink: string;
    offerLogo: string;
    offerLongTitle: string;
    offerTitle: string;
    offerVersion: number;
    schoolActivations: VidisApiResponseSchoolActivation[];
};

export type VidisApiResponse<T> = {
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

export type VidisServiceResponseAngebot = Omit<VidisApiResponseAngebot, 'schoolActivations'> & {
    schoolActivations: {
        date: string;
        kennung: string;
    }[];
};
