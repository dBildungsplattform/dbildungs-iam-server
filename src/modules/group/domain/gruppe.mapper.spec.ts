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

            expect(result).toEqual(
                expect.objectContaining({
                    mandant: '',
                    organisationId: '',
                    referrer: gruppe.referrer,
                    bezeichnung: gruppe.bezeichnung,
                    thema: gruppe.thema,
                    beschreibung: gruppe.beschreibung,
                    typ: gruppe.typ,
                    bereich: gruppe.bereich,
                    optionen: gruppe.optionen,
                    differenzierung: gruppe.differenzierung,
                    bildungsziele: gruppe.bildungsziele,
                    jahrgangsstufen: gruppe.jahrgangsstufen,
                    faecher: gruppe.faecher,
                    referenzgruppen: gruppe.referenzgruppen,
                    laufzeit: gruppe.laufzeit,
                }),
            );
        });
    });

    describe('mapGruppeEntityToGruppe', () => {
        it('should map GruppeEntity to Gruppe', () => {
            const gruppeEntity: GruppeEntity = new GruppeEntity();
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

            expect(result).toEqual(
                expect.objectContaining({
                    id: undefined,
                    mandant: '',
                    organisationId: '',
                    referrer: gruppeEntity.referrer,
                    bezeichnung: gruppeEntity.bezeichnung,
                    thema: gruppeEntity.thema,
                    beschreibung: gruppeEntity.beschreibung,
                    typ: gruppeEntity.typ,
                    bereich: gruppeEntity.bereich,
                    optionen: gruppeEntity.optionen,
                    differenzierung: gruppeEntity.differenzierung,
                    bildungsziele: gruppeEntity.bildungsziele,
                    jahrgangsstufen: gruppeEntity.jahrgangsstufen,
                    faecher: gruppeEntity.faecher,
                    referenzgruppen: gruppeEntity.referenzgruppen,
                    laufzeit: gruppeEntity.laufzeit,
                    revision: undefined,
                    updatedAt: undefined,
                    createdAt: undefined,
                }),
            );
        });
    });
});
