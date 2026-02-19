import { HttpService } from '@nestjs/axios';
import { TestingModule, Test } from '@nestjs/testing';
import { VidisService } from './vidis.service.js';
import { VidisOfferResponse, VidisResponse } from './api/vidis-angebote-api.types.js';
import { Observable, of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ConfigTestModule } from '../../../test/utils/config-test.module.js';
import { VidisAngebot } from './domain/vidis-angebot.js';
import { LoggingTestModule } from '../../../test/utils/logging-test.module.js';
import { createMock, DeepMocked } from '../../../test/utils/createMock.js';

const mockVidisRegionName: string = 'test-region';

const mockVidisAngebotResponses: VidisOfferResponse[] = [
    {
        offerId: 1234567,
        offerVersion: 1,
        offerDescription:
            'Effiziente Organisation Ihrer Hausaufgaben mit der neuen Hausaufgaben Listen App Verlieren Sie nie wieder den Überblick über Ihre Aufgaben und Abgabefristen. Unsere Hausaufgaben Listen App bietet Ihnen eine strukturierte und benutzerfreundliche Lösung, um Ihre schulischen Verpflichtungen optimal zu verwalten. Funktionen der App: Übersichtliche Verwaltung: Behalten Sie alle Hausaufgaben, Projekte und To-Dos an einem zentralen Ort im Blick. Erinnerungsfunktion: Automatische Benachrichtigungen helfen Ihnen, keine Fristen mehr zu verpassen. Einfache Bedienung: Intuitive Benutzeroberfläche, die eine schnelle und unkomplizierte Nutzung ermöglicht. Kollaborationsmöglichkeit: Teilen Sie Aufgaben und Projekte mit Mitschülern, um effizienter zusammenzuarbeiten. Anpassbare Listen: Erstellen Sie individuelle Kategorien und Listen nach Ihren Bedürfnissen. Fortschrittsanzeige: Verfolgen Sie Ihre erledigten Aufgaben und sehen Sie Ihren Fortschritt in Echtzeit. Unsere Hausaufgaben Listen App ist kostenlos verfügbar und bietet Ihnen eine verlässliche Unterstützung bei der Organisation Ihres Schulalltags.',
        offerLink: 'https://vidis-login-example.buergercloud.de/oauth2/authorization/vidis?vidis_idp_hint=vidis-idp',
        offerLogo: 'dummy-string',
        offerTitle: 'Hausaufgaben-Liste',
        offerLongTitle: 'Testangebot Hausaufgaben-Liste',
        educationProviderOrganizationName: 'VIDIS-Testangebot',
        schoolActivations: ['DE-VIDIS-vidis_test_20202', 'DE-VIDIS-vidis_test_40404', 'DE-VIDIS-vidis_test_101010'],
    },
    {
        offerId: 7654321,
        offerVersion: 1,
        offerDescription:
            'divomath ist eine Lernumgebung für Mathematik, die insbesondere dem Prinzip der Verstehensorientierung folgt. Sie bietet Unterrichtseinheiten für die dritte bis sechste Jahrgangsstufe.',
        offerLink: 'https://login-stage.divomath.de/idp-login?idp=vidis&vidis_idp_hint=vidis-idp',
        offerLogo: 'dummy-string',
        offerTitle: 'divomath VIDIS-Testsystem',
        offerLongTitle: 'digital und verstehensorientiert Mathematik lernen (Test)',
        educationProviderOrganizationName: 'divomath VIDIS-Testsystem',
        schoolActivations: ['DE-VIDIS-vidis_test_30303', 'DE-VIDIS-vidis_test_20202', 'DE-VIDIS-vidis_test_101010'],
    },
    {
        offerId: 9876543,
        offerVersion: 4,
        offerDescription: 'webtown test offer',
        offerLink: '?vidis_idp_hint=vidis-idp',
        offerLogo: 'dummy-string',
        offerTitle: 'webtown test offer',
        offerLongTitle: 'webtown test offer',
        educationProviderOrganizationName: 'VIDIS-Testangebot',
        schoolActivations: ['DE-VIDIS-vidis_test_30303', 'DE-VIDIS-vidis_test_20202'],
    },
];

const mockVidisResponse: VidisResponse<VidisOfferResponse> = {
    facets: [
        {
            facetCriteria: '',
            facetValues: [
                {
                    numberOfOccurrences: 0,
                    term: '',
                },
            ],
        },
    ],
    lastPage: 1,
    totalCount: 3,
    pageSize: 20,
    actions: {},
    page: 1,
    items: mockVidisAngebotResponses,
};

const mockVidisAxiosResponse = (): Observable<AxiosResponse> =>
    of({ data: mockVidisResponse } as AxiosResponse<VidisResponse<VidisOfferResponse>>);

describe(`VidisService`, () => {
    let sut: VidisService;
    let httpServiceMock: DeepMocked<HttpService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigTestModule, LoggingTestModule],
            providers: [VidisService, { provide: HttpService, useValue: createMock(HttpService) }],
        }).compile();

        sut = module.get<VidisService>(VidisService);
        httpServiceMock = module.get(HttpService);
    });

    describe(`getActivatedAngeboteByRegion`, () => {
        it(`should get the activated VIDIS Angebote by region from the VIDIS Angebot API if no errors occur`, async () => {
            httpServiceMock.get.mockReturnValueOnce(mockVidisAxiosResponse());
            const expectedVidisOfferResponse: VidisOfferResponse[] = mockVidisAngebotResponses;
            const expectedVidisAngebote: VidisAngebot[] = expectedVidisOfferResponse.map(
                (offer: VidisOfferResponse) => {
                    const vidisAngebot: VidisAngebot = {
                        angebotId: offer.offerId.toString(),
                        angebotVersion: offer.offerVersion,
                        angebotDescription: offer.offerDescription,
                        angebotLink: offer.offerLink,
                        angebotLogo: offer.offerLogo,
                        angebotTitle: offer.offerTitle,
                        angebotLongTitle: offer.offerLongTitle,
                        educationProviderOrganizationName: offer.educationProviderOrganizationName,
                        schoolActivations: offer.schoolActivations,
                    };
                    return vidisAngebot;
                },
            );

            const actualVidisAngebote: VidisAngebot[] = await sut.getActivatedAngeboteByRegion(mockVidisRegionName);

            expect(actualVidisAngebote).toEqual(expectedVidisAngebote);
        });

        it(`should throw an error if getActivatedAngeboteByRegion throws an Error object`, async () => {
            httpServiceMock.get.mockImplementation(() => {
                throw new Error('Error when getting VIDIS Angebote.');
            });

            await expect(sut.getActivatedAngeboteByRegion(mockVidisRegionName)).rejects.toThrow(
                `Error getting all VIDIS Angebote: Error when getting VIDIS Angebote.`,
            );
        });

        it(`should throw an error if getActivatedAngeboteByRegion throws a non-Error object`, async () => {
            httpServiceMock.get.mockImplementation(() => {
                // eslint-disable-next-line @typescript-eslint/only-throw-error
                throw 'This is a non-Error throw';
            });

            await expect(sut.getActivatedAngeboteByRegion(mockVidisRegionName)).rejects.toThrow(
                `Error getting all VIDIS Angebote: Unknown error occurred`,
            );
        });
    });
});
