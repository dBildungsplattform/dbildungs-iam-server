import { writeFileSync } from 'fs';

type ActionProperty = {
    [key: string]: string;
};

type Actions = {
    [key: string]: ActionProperty;
};

type VidisApiResponse<T> = {
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

type VidisApiResponseSchoolActivation = {
    date: string;
    regionName: string;
};

type VidisApiResponseAngebotByRegion = {
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

const REGION = 'SH';
const OFFER_COUNT = 30;
const SCHOOL_ACTIVATIONS_PER_OFFER = 800;

function buildResponse(): VidisApiResponse<VidisApiResponseAngebotByRegion> {
    const items: VidisApiResponseAngebotByRegion[] = Array.from({ length: OFFER_COUNT }, (_, offerIndex) => ({
        clientId: `client-${offerIndex + 1}`,
        educationProviderOrganizationName: `Provider ${offerIndex + 1}`,
        offerDescription: `Beschreibung Angebot ${offerIndex + 1}`,
        offerId: offerIndex + 1,
        offerLink: `https://example.org/offers/${offerIndex + 1}`,
        offerLogo: `https://example.org/logos/${offerIndex + 1}.png`,
        offerLongTitle: `Langer Titel Angebot ${offerIndex + 1}`,
        offerTitle: `Angebot ${offerIndex + 1}`,
        offerVersion: 1,
        schoolActivations: Array.from({ length: SCHOOL_ACTIVATIONS_PER_OFFER }, (_, schoolIndex) => ({
            date: '2026-06-22',
            regionName: `SCHULE-${String(schoolIndex + 1).padStart(4, '0')}`,
        })),
    }));

    return {
        facets: [],
        lastPage: 1,
        totalCount: items.length,
        pageSize: items.length,
        actions: {},
        page: 1,
        items,
    };
}

const db = {
    [`offersActivatedByRegion${REGION}`]: buildResponse(),
};

writeFileSync('src/modules/vidis/test-cron-sync/db.json', JSON.stringify(db, null, 2), 'utf-8');
console.log('db.json erstellt');
