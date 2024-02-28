import { faker } from '@faker-js/faker';
import { Jahrgangsstufe } from '../../personenkontext/domain/personenkontext.enums.js';
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
import { Referenzgruppen } from './referenzgruppen.js';
import { CreateGroupBodyParams } from '../api/create-group.body.params.js';

describe('Gruppe', () => {
    describe('construct', () => {
        describe('when constructing a group', () => {
            it('should return a new Gruppe instance', () => {
                const gruppe: Gruppe = Gruppe.construct(
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
                expect(gruppe).toBeInstanceOf(Gruppe);
            });
        });
    });

    describe('createGroup', () => {
        describe('when creating a group', () => {
            it('should return a new Gruppe instance', () => {
                const createGroupBodyParams: CreateGroupBodyParams = {
                    bezeichnung: faker.lorem.word(),
                    typ: GruppenTyp.KLASSE,
                    bereich: Gruppenbereich.PFLICHT,
                    differenzierung: Gruppendifferenzierung.E,
                    bildungsziele: [],
                    jahrgangsstufen: [],
                    faecher: [],
                    referenzgruppen: [],
                    laufzeit: {},
                };
                const gruppe: Gruppe = Gruppe.createGroup(createGroupBodyParams);
                expect(gruppe).toBeInstanceOf(Gruppe);
                expect(gruppe.getReferrer()).toBe('');
                expect(gruppe.getBezeichnung()).toBe(createGroupBodyParams.bezeichnung);
                expect(gruppe.getThema()).toBe('');
                expect(gruppe.getBeschreibung()).toBe('');
                expect(gruppe.getTyp()).toBe(createGroupBodyParams.typ);
                expect(gruppe.getBereich()).toBe(createGroupBodyParams.bereich);
                expect(gruppe.getOptionen()).toEqual([]);
                expect(gruppe.getDifferenzierung()).toBe(createGroupBodyParams.differenzierung);
                expect(gruppe.getBildungsziele()).toEqual([]);
                expect(gruppe.getJahrgangsstufen()).toEqual([]);
                expect(gruppe.getFaecher()).toEqual([]);
                expect(gruppe.getReferenzgruppen()).toEqual([]);
                expect(gruppe.getLaufzeit()).toEqual({});
            });
        });
    });
});
