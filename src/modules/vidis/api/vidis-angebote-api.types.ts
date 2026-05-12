type ActionProperty = {
    [key: string]: string;
};

type Actions = {
    [key: string]: ActionProperty;
};

// RESPONSE TYPES FROM VIDIS API

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

type VidisApiResponseAngebotCommon = {
    clientId: string;
    educationProviderOrganizationName: string;
    offerDescription: string;
    offerId: number;
    offerLink: string;
    offerLogo: string;
    offerLongTitle: string;
    offerTitle: string;
    offerVersion: number;
};

export type VidisApiResponseSchoolActivation = {
    date: string,
    regionName: string
}

export type VidisApiResponseAngebotByRegion = VidisApiResponseAngebotCommon & {
    schoolActivations: VidisApiResponseSchoolActivation[];
};

export type VidisApiResponseAngebotBySchool = VidisApiResponseAngebotCommon;


// RESPONSE TYPES FROM OUR API SERVICE (after transformation)

export type VidisServiceResponseAngebot = VidisApiResponseAngebotCommon;

export type VidisServiceResponseSchoolActivation = {
    date: string;
    kennung: string;
}

export type VidisAngebotWithSchoolActivations = {
    angebot: VidisServiceResponseAngebot;
    schoolActivations: VidisServiceResponseSchoolActivation[];
}
