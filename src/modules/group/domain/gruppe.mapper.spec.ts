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
                GruppenTyp.KLASSE,
                faker.lorem.word(),
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
            expect(result.referrer).toBe(gruppe.referrer);
            expect(result.bezeichnung).toBe(gruppe.bezeichnung);
            expect(result.thema).toBe(gruppe.thema);
            expect(result.beschreibung).toBe(gruppe.beschreibung);
            expect(result.typ).toBe(gruppe.typ);
            expect(result.bereich).toBe(gruppe.bereich);
            expect(result.optionen).toBe(gruppe.optionen);
            expect(result.differenzierung).toBe(gruppe.differenzierung);
            expect(result.bildungsziele).toBe(gruppe.bildungsziele);
            expect(result.jahrgangsstufen).toBe(gruppe.jahrgangsstufen);
            expect(result.faecher).toBe(gruppe.faecher);
            expect(result.referenzgruppen).toBe(gruppe.referenzgruppen);
            expect(result.laufzeit).toBe(gruppe.laufzeit);
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
            expect(result.bezeichnung).toBe(gruppeEntity.bezeichnung);
            expect(result.typ).toBe(gruppeEntity.typ);
            expect(result.revision).toBe(gruppeEntity.revision);
            expect(result.referrer).toBe(gruppeEntity.referrer);
            expect(result.thema).toBe(gruppeEntity.thema);
            expect(result.beschreibung).toBe(gruppeEntity.beschreibung);
            expect(result.bereich).toBe(gruppeEntity.bereich);
            expect(result.optionen).toBe(gruppeEntity.optionen);
            expect(result.differenzierung).toBe(gruppeEntity.differenzierung);
            expect(result.bildungsziele).toBe(gruppeEntity.bildungsziele);
            expect(result.jahrgangsstufen).toBe(gruppeEntity.jahrgangsstufen);
            expect(result.faecher).toBe(gruppeEntity.faecher);
            expect(result.referenzgruppen).toBe(gruppeEntity.referenzgruppen);
            expect(result.laufzeit).toBe(gruppeEntity.laufzeit);
        });
    });
});
