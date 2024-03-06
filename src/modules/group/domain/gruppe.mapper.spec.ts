import { faker } from '@faker-js/faker';
import { Jahrgangsstufe } from '../../personenkontext/domain/personenkontext.enums.js';
import { GruppeEntity } from '../persistence/gruppe.entity.js';
import { Laufzeit } from '../persistence/laufzeit.js';
import { Gruppe } from './gruppe.js';
import {
    GruppenTyp,
    Gruppenbereich,
    Gruppenoption,
    Gruppendifferenzierung,
    Bildungsziele,
    Faecherkanon,
    Gruppenrollen,
} from './gruppe.enums.js';
import { GruppeMapper } from './gruppe.mapper.js';
import { Referenzgruppen } from './referenzgruppen.js';
// AI next 107 lines
describe('GruppeMapper', () => {
    let gruppeMapper: GruppeMapper;

    beforeEach(() => {
        gruppeMapper = new GruppeMapper();
    });

    it('should be defined', () => {
        expect(gruppeMapper).toBeDefined();
    });

    describe('mapGruppeToGruppeEntity', () => {
        it('should map Gruppe to GruppeEntity', () => {
            const gruppe: Gruppe<false> = Gruppe.construct(
                faker.string.uuid(),
                faker.date.recent(),
                faker.date.recent(),
                faker.lorem.word(),
                faker.string.uuid(),
                faker.lorem.word(),
                GruppenTyp.KLASSE,
                faker.lorem.word(),
                faker.lorem.word(),
                faker.lorem.word(),
                Gruppenbereich.PFLICHT,
                [Gruppenoption.BILINGUAL, Gruppenoption.HERKUNFTSSPRACHLICH],
                Gruppendifferenzierung.E,
                [Bildungsziele.GS, Bildungsziele.HS],
                [Jahrgangsstufe.JAHRGANGSSTUFE_1, Jahrgangsstufe.JAHRGANGSSTUFE_2],
                [Faecherkanon.DE],
                [
                    new Referenzgruppen({
                        id: faker.string.uuid(),
                        rollen: [Gruppenrollen.LEHR],
                    }),
                ],
                new Laufzeit({ von: new Date(), bis: new Date() }),
            );

            const result: GruppeEntity = gruppeMapper.mapGruppeToGruppeEntity(gruppe);

            expect(result).toBeInstanceOf(GruppeEntity);
            expect(result.mandant).toBeDefined();
            expect(result.organisationId).toBeDefined();
            expect(result.referrer).toBe(gruppe.getReferrer());
            expect(result.bezeichnung).toBe(gruppe.getBezeichnung());
            expect(result.thema).toBe(gruppe.getThema());
            expect(result.beschreibung).toBe(gruppe.getBeschreibung());
            expect(result.typ).toBe(gruppe.getTyp());
            expect(result.bereich).toBe(gruppe.getBereich());
            expect(result.optionen).toBe(gruppe.getOptionen());
            expect(result.differenzierung).toBe(gruppe.getDifferenzierung());
            expect(result.bildungsziele).toBe(gruppe.getBildungsziele());
            expect(result.jahrgangsstufen).toBe(gruppe.getJahrgangsstufen());
            expect(result.faecher).toBe(gruppe.getFaecher());
            expect(result.referenzgruppen).toBe(gruppe.getReferenzgruppen());
            expect(result.laufzeit).toBe(gruppe.getLaufzeit());
        });
    });

    describe('mapGruppeEntityToGruppe', () => {
        it('should map GruppeEntity to Gruppe', () => {
            const gruppeEntity: GruppeEntity = new GruppeEntity();
            gruppeEntity.mandant = 'test-mandant';
            gruppeEntity.organisationId = 'test-orgid';
            gruppeEntity.referrer = faker.lorem.word();
            gruppeEntity.bezeichnung = faker.lorem.word();
            gruppeEntity.thema = faker.lorem.word();
            gruppeEntity.beschreibung = faker.lorem.word();
            gruppeEntity.typ = GruppenTyp.KLASSE;
            gruppeEntity.bereich = Gruppenbereich.PFLICHT;
            gruppeEntity.optionen = [Gruppenoption.BILINGUAL, Gruppenoption.HERKUNFTSSPRACHLICH];
            gruppeEntity.differenzierung = Gruppendifferenzierung.E;
            gruppeEntity.bildungsziele = [Bildungsziele.GS, Bildungsziele.HS];
            gruppeEntity.jahrgangsstufen = [Jahrgangsstufe.JAHRGANGSSTUFE_1, Jahrgangsstufe.JAHRGANGSSTUFE_2];
            gruppeEntity.faecher = [Faecherkanon.DE];
            gruppeEntity.referenzgruppen = [
                {
                    id: faker.string.uuid(),
                    rollen: [Gruppenrollen.LEHR],
                },
            ];
            gruppeEntity.laufzeit = {
                von: faker.date.past(),
                vonLernperiode: '2022',
                bis: faker.date.future(),
                bisLernperiode: '2023',
            };

            const result: Gruppe<true> = gruppeMapper.mapGruppeEntityToGruppe(gruppeEntity);

            expect(result).toBeInstanceOf(Gruppe);
            expect(result.getBezeichnung()).toBe(gruppeEntity.bezeichnung);
            expect(result.getTyp()).toBe(gruppeEntity.typ);
            expect(result.getReferrer()).toBe(gruppeEntity.referrer);
            expect(result.getThema()).toBe(gruppeEntity.thema);
            expect(result.getBeschreibung()).toBe(gruppeEntity.beschreibung);
            expect(result.getBereich()).toBe(gruppeEntity.bereich);
            expect(result.getOptionen()).toBe(gruppeEntity.optionen);
            expect(result.getDifferenzierung()).toBe(gruppeEntity.differenzierung);
            expect(result.getBildungsziele()).toBe(gruppeEntity.bildungsziele);
            expect(result.getJahrgangsstufen()).toBe(gruppeEntity.jahrgangsstufen);
            expect(result.getFaecher()).toBe(gruppeEntity.faecher);
            expect(result.getReferenzgruppen()).toBe(gruppeEntity.referenzgruppen);
            expect(result.getLaufzeit()).toBe(gruppeEntity.laufzeit);
        });
    });
});
