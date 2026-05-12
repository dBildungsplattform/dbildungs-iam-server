import { vi } from "vitest"
import { HttpService } from "@nestjs/axios"
import { Test, TestingModule } from "@nestjs/testing"
import { AxiosResponse } from "axios"
import { of } from "rxjs"
import { createMock, DeepMocked } from "../../../../test/utils/createMock.js"
import { ConfigTestModule } from "../../../../test/utils/config-test.module.js"
import { ClassLogger } from "../../../core/logging/class-logger.js"
import {
	VidisAngebotWithSchoolActivations,
	VidisApiResponse,
	VidisApiResponseAngebotByRegion,
} from "../api/vidis-angebote-api.types.js"
import { VidisApiService } from "./vidis.api-service.js"

const demoVidisApiResponseAngebotByRegion: VidisApiResponse<VidisApiResponseAngebotByRegion> = {
	"actions": {
	},
	"facets": [
	],
	"items": [
		{
			"clientId": "[\"springboot-demo\"]",
			"educationProviderOrganizationName": "VIDIS-Testangebot",
			"offerDescription": "Effiziente Organisation Ihrer Hausaufgaben mit der neuen Hausaufgaben Listen App Verlieren Sie nie wieder den Überblick über Ihre Aufgaben und Abgabefristen. Unsere Hausaufgaben Listen App bietet Ihnen eine strukturierte und benutzerfreundliche Lösung, um Ihre schulischen Verpflichtungen optimal zu verwalten. Funktionen der App: Übersichtliche Verwaltung: Behalten Sie alle Hausaufgaben, Projekte und To-Dos an einem zentralen Ort im Blick. Erinnerungsfunktion: Automatische Benachrichtigungen helfen Ihnen, keine Fristen mehr zu verpassen. Einfache Bedienung: Intuitive Benutzeroberfläche, die eine schnelle und unkomplizierte Nutzung ermöglicht. Kollaborationsmöglichkeit: Teilen Sie Aufgaben und Projekte mit Mitschülern, um effizienter zusammenzuarbeiten. Anpassbare Listen: Erstellen Sie individuelle Kategorien und Listen nach Ihren Bedürfnissen. Fortschrittsanzeige: Verfolgen Sie Ihre erledigten Aufgaben und sehen Sie Ihren Fortschritt in Echtzeit. Unsere Hausaufgaben Listen App ist kostenlos verfügbar und bietet Ihnen eine verlässliche Unterstützung bei der Organisation Ihres Schulalltags.",
			"offerId": 648374,
			"offerLink": "https://myexampletoolone/oauth2/authorization/vidis?vidis_idp_hint=spsh-o",
			"offerLogo": "abc=",
			"offerLongTitle": "Testangebot Hausaufgaben-Liste v2",
			"offerTitle": "Hausaufgaben-Liste",
			"offerVersion": 2,
			"schoolActivations": [
				{
					"date": "22-04-2026",
					"regionName": "DE-SH-09099997"
				},
				{
					"date": "16-04-2026",
					"regionName": "DE-SH-123456"
				}
			]
		},
		{
			"clientId": "[\"divomath-o\"]",
			"educationProviderOrganizationName": "Animalfriends",
			"offerDescription": "Histomania ist eine Plattform, die es ihren Benutzern emöglicht, historische, aktuelle und fiktive Ereignisse auf anschauliche Weise in Zeitstrahlen darzustellen. Mit einer Fülle von Funktionen, darunter die Möglichkeit, Zeitstrahlen gemeinsam zu erstellen, zu teilen, zu verlinken und miteinander zu vergleichen, ist histomania ein praktisches Werkzeug für Schüler, Studenten und Pädagogen. Übersichtliche Zeitstrahlen für besseres Verständnis Eine der Hauptfunktionen von histomania ist die Erstellung und das Teilen von Zeitstrahlen. Benutzer können auf einfache Weise wichtige Ereignisse, Personen und Entwicklungen in der Geschichte in chronologischer Reihenfolge darstellen. Diese Strukturen bieten einen klaren Überblick über komplexe Zusammenhänge und machen es einfach, die zeitlichen Beziehungen zwischen verschiedenen Ereignissen zu erkennen. Interaktive Verlinkungen und Navigation histomania geht über einfache Textbeschreibungen hinaus, indem es Benutzern ermöglicht, interaktive Verlinkungen zu erstellen. Diese Verlinkungen können nicht nur auf andere Websites verweisen, sondern auch zu anderen Zeitstrahlen und sogar zu Ereignissen innerhalb eines Zeitstrahls führen. Dies schafft eine faszinierende Erfahrung für die Nutzer, die während des Lesens nahtlos durch die Zeit navigieren können, wodurch sie ein tiefes Verständnis für historische Zusammenhänge erhalten. Parallele Zeitstrahlen und Vergleichsfunktionen histomania bietet eine einzigartige Möglichkeit, verschiedene Zeitstränge parallel zu öffnen und miteinander zu vergleichen. Benutzer können so beispielsweise Ereignisse aus unterschiedlichen historischen Epochen oder kulturellen Kontexten nebeneinander stellen und vergleichen. Dadurch werden Zusammenhänge deutlicher sichtbar, und es entsteht ein tieferes Verständnis für die Auswirkungen historischer Entwicklungen auf verschiedene Regionen oder Zeitalter. Messwerkzeug für zeitliche Abstände Die Plattform verfügt über ein praktisches Messwerkzeug, mit dem Benutzer Zeitabschnitte zwischen Ereignissen vermessen können. Dies ist besonders nützlich, um die zeitlichen Abstände zwischen wichtigen historischen Ereignissen zu quantifizieren und das Verhältnis von Zeitspannen besser zu begreifen. \"Was wäre wenn...\" Funktionalität Eine faszinierende und lehrreiche Funktion von histomania ist die \"Was wäre wenn...\"-Funktionalität. Mit dieser Option können Benutzer historische Abläufe in alternative Szenarien umwandeln, um die Auswirkungen hypothetischer Ereignisse zu erkunden. Das ermöglicht beispielsweise, sich vorzustellen, wie es wäre, wenn eine bestimmte historische Persönlichkeit gleichzeitig mit dem Benutzer geboren worden wäre. Solche Vergleiche eröffnen neue Perspektiven und fördern ein tieferes Verständnis für die Komplexität historischer Entwicklungen. Fazit histomania ist der ideale Begleiter für Geschichte, politische Bildung oder auch um Abläufe aus Büchern im Deutschunterricht zu visualisieren. Die Kombination aus übersichtlichen Zeitstrahlen, Text mit interaktiven Verlinkungen, Vergleichsfunktionen und der spannende \"Was wäre wenn...\"-Option macht die Plattform zu einem wertvollen Werkzeug für Schüler, Studenten, Geschichtsinteressierten und Lehrern. Dank histomania können historische Ereignisse auf eine neue Art und Weise entdeckt und verstanden werden, und das Wissen über die Vergangenheit wird auf eine fesselnde und leicht zugängliche Weise vermittelt. Hinweis zur Nutzung: Wenn Sie das Angebot für Ihre Schule aktivieren können Sie histomania bis Ende des Schuljahres 2023/2024 kostenlos nutzen. Ab dem neuen Schuljahr 2024/2025 wird es eine kostenlose Basisversion (mit eingeschränkten Funktionalitäten) geben. Diese kann dann für maximal 4 Wochen (inkl. vollem Funktionsumfang) getestet werden. Nach der Testphase starten Sie nicht automatisch in ein kostenpflichtiges Abomodell. Der Anbieter wird Sie nach Ablauf der Testphase kontaktieren.",
			"offerId": 394844,
			"offerLink": "https://myexampletooltwo/auth/vidis/login?vidis_idp_hint=spsh-o",
			"offerLogo": "abc=",
            "offerLongTitle": "Die Plattform für Geschichte am Zeitstrahl",
			"offerTitle": "Divomath Friends",
			"offerVersion": 3,
			"schoolActivations": [
				{
					"date": "16-04-2026",
					"regionName": "DE-SH-123456"
				}
			]
		}
	],
	"lastPage": 1,
	"page": 1,
	"pageSize": 100000,
	"totalCount": 2
}

/*
const demoVidisApiResponseAngebotBySchool: VidisApiResponse<VidisApiResponseAngebotBySchool> = {
	"actions": {
	},
	"facets": [
	],
	"items": [
		{
			"clientId": "[\"springboot-demo\"]",
			"educationProviderOrganizationName": "VIDIS-Testangebot",
			"offerDescription": "Effiziente Organisation Ihrer Hausaufgaben mit der neuen Hausaufgaben Listen App Verlieren Sie nie wieder den Überblick über Ihre Aufgaben und Abgabefristen. Unsere Hausaufgaben Listen App bietet Ihnen eine strukturierte und benutzerfreundliche Lösung, um Ihre schulischen Verpflichtungen optimal zu verwalten. Funktionen der App: Übersichtliche Verwaltung: Behalten Sie alle Hausaufgaben, Projekte und To-Dos an einem zentralen Ort im Blick. Erinnerungsfunktion: Automatische Benachrichtigungen helfen Ihnen, keine Fristen mehr zu verpassen. Einfache Bedienung: Intuitive Benutzeroberfläche, die eine schnelle und unkomplizierte Nutzung ermöglicht. Kollaborationsmöglichkeit: Teilen Sie Aufgaben und Projekte mit Mitschülern, um effizienter zusammenzuarbeiten. Anpassbare Listen: Erstellen Sie individuelle Kategorien und Listen nach Ihren Bedürfnissen. Fortschrittsanzeige: Verfolgen Sie Ihre erledigten Aufgaben und sehen Sie Ihren Fortschritt in Echtzeit. Unsere Hausaufgaben Listen App ist kostenlos verfügbar und bietet Ihnen eine verlässliche Unterstützung bei der Organisation Ihres Schulalltags.",
			"offerId": 648374,
			"offerLink": "https://myexampletoolone/oauth2/authorization/vidis?vidis_idp_hint=spsh-o",
			"offerLogo": "abc=",
            "offerLongTitle": "Testangebot Hausaufgaben-Liste v2",
			"offerTitle": "Hausaufgaben-Liste",
			"offerVersion": 2
		}
	],
	"lastPage": 1,
	"page": 1,
	"pageSize": 100000,
	"totalCount": 1
}
    */

describe("VidisApiService", () => {
	let module: TestingModule
	let sut: VidisApiService

	let httpServiceMock: DeepMocked<HttpService>
	let loggerMock: DeepMocked<ClassLogger>

	const authToken: string = "test-auth-token"

	const mockHttpResponses = (): void => {
		httpServiceMock.post.mockReturnValueOnce(
			of({
				data: { access_token: authToken },
			} as AxiosResponse<{ access_token: string }>),
		)
		httpServiceMock.get.mockReturnValueOnce(
			of({
				data: demoVidisApiResponseAngebotByRegion,
			} as AxiosResponse<VidisApiResponse<VidisApiResponseAngebotByRegion>>),
		)
	}

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ConfigTestModule],
			providers: [
				VidisApiService,
				{
					provide: HttpService,
					useValue: createMock(HttpService),
				},
				{
					provide: ClassLogger,
					useValue: createMock(ClassLogger),
				},
			],
		}).compile()

		sut = module.get(VidisApiService)
		httpServiceMock = module.get(HttpService)
		loggerMock = module.get(ClassLogger)
	})

	afterAll(async () => {
		await module.close()
	})

	beforeEach(() => {
		vi.clearAllMocks()
		vi.resetAllMocks()
	})

	it("should be defined", () => {
		expect(sut).toBeDefined()
	})

	describe("getActivatedAngeboteByRegion", () => {
		it("should call HttpService.post and HttpService.get", async () => {
			mockHttpResponses()

			await sut.getActivatedAngeboteByRegion()

			expect(httpServiceMock.post).toHaveBeenCalledWith(
				"/o/oauth2/token?pageSize=100000",
				"client_id=&client_secret=&grant_type=client_credentials",
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
				},
			)
			expect(httpServiceMock.get).toHaveBeenCalledWith(
				"/o/vidis-rest/v1.0/offers/activated/by-region/Schleswig-Holstein?pageSize=100000",
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				},
			)
		})

		it("should map schoolActivations to kennung and log fetched Angebote", async () => {
			mockHttpResponses()

			const expectedResult: VidisAngebotWithSchoolActivations[] = demoVidisApiResponseAngebotByRegion.items.map(
				({ schoolActivations, ...angebot }: VidisApiResponseAngebotByRegion) => ({
					angebot,
					schoolActivations: schoolActivations.map(({ date, regionName }) => ({
						date,
						kennung: regionName.replace("DE-SH-", ""),
					})),
				}),
			)

			const result: VidisAngebotWithSchoolActivations[] = await sut.getActivatedAngeboteByRegion()

			expect(result).toMatchObject(expectedResult)
			expect(loggerMock.debug).toHaveBeenNthCalledWith(1, "Received auth token from Vidis API")
			expect(loggerMock.debug).toHaveBeenNthCalledWith(
				2,
				"Fetched 2 activated Angebote for region Schleswig-Holstein from Vidis API",
			)
		})
	})
})