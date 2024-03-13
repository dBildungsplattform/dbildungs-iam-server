import { faker } from '@faker-js/faker';
import { Gruppe } from './gruppe.js';
import {
    Bildungsziele,
    Faecherkanon,
    GruppenTyp,
    Gruppenbereich,
    Gruppendifferenzierung,
    Gruppenoption,
    Gruppenrollen,
} from './gruppe.enums.js';
import { CreateGroupBodyParams } from '../api/create-group.body.params.js';
import { Jahrgangsstufe } from '../../personenkontext/domain/personenkontext.enums.js';
import { Laufzeit } from '../persistence/laufzeit.js';

describe('Gruppe', () => {
    describe('construct', () => {
        describe('when constructing a group', () => {
            it('should return a new group instance', () => {
                const createGroupBodyParams: CreateGroupBodyParams = {
                    bezeichnung: faker.lorem.word(),
                    typ: GruppenTyp.KLASSE,
                    optionen: [],
                    differenzierung: Gruppendifferenzierung.E,
                    bildungsziele: [],
                    jahrgangsstufen: [],
                    faecher: [],
                    referenzgruppen: [],
                    laufzeit: {},
                };

                const createdGroup: Gruppe<false> = Gruppe.createGroup(createGroupBodyParams);

                expect(createdGroup.id).toBeUndefined();
                expect(createdGroup.createdAt).toBeUndefined();
                expect(createdGroup.updatedAt).toBeUndefined();
                expect(createdGroup.revision).toBeDefined();
                expect(createdGroup.mandant).toBe('');
                expect(createdGroup.organisationId).toBe('');
                expect(createdGroup.referrer).toEqual(createGroupBodyParams.referrer);
                expect(createdGroup.bezeichnung).toEqual(createGroupBodyParams.bezeichnung);
                expect(createdGroup.thema).toEqual(createGroupBodyParams.thema);
                expect(createdGroup.beschreibung).toEqual(createGroupBodyParams.beschreibung);
                expect(createdGroup.typ).toEqual(createGroupBodyParams.typ);
                expect(createdGroup.bereich).toEqual(createGroupBodyParams.bereich);
                expect(createdGroup.optionen).toEqual(createGroupBodyParams.optionen);
                expect(createdGroup.differenzierung).toEqual(createGroupBodyParams.differenzierung);
                expect(createdGroup.bildungsziele).toEqual(createGroupBodyParams.bildungsziele);
                expect(createdGroup.jahrgangsstufen).toEqual(createGroupBodyParams.jahrgangsstufen);
                expect(createdGroup.faecher).toEqual(createGroupBodyParams.faecher);
                expect(createdGroup.referenzgruppen).toEqual(createGroupBodyParams.referenzgruppen);
                expect(createdGroup.laufzeit).toEqual(createGroupBodyParams.laufzeit);
            });
        });
    });

    describe('createGroup', () => {
        describe('when creating a group', () => {
            it('should return a new group instance', () => {
                const createGroupBodyParams: CreateGroupBodyParams = {
                    referrer: faker.lorem.word(),
                    bezeichnung: faker.lorem.word(),
                    thema: faker.lorem.word(),
                    beschreibung: faker.lorem.word(),
                    typ: GruppenTyp.KLASSE,
                    bereich: Gruppenbereich.PFLICHT,
                    optionen: [Gruppenoption.BILINGUAL, Gruppenoption.HERKUNFTSSPRACHLICH],
                    differenzierung: Gruppendifferenzierung.E,
                    bildungsziele: [Bildungsziele.GS, Bildungsziele.HS],
                    jahrgangsstufen: [Jahrgangsstufe.JAHRGANGSSTUFE_1, Jahrgangsstufe.JAHRGANGSSTUFE_2],
                    faecher: [Faecherkanon.DE, Faecherkanon.MA],
                    referenzgruppen: [
                        {
                            id: faker.lorem.word(),
                            rollen: [Gruppenrollen.LEHR],
                        },
                    ],
                    laufzeit: new Laufzeit({ von: faker.date.recent(), bis: faker.date.recent() }),
                };
                const gruppe: Gruppe<false> = Gruppe.createGroup(createGroupBodyParams);
                expect(gruppe).toBeInstanceOf(Gruppe);
                expect(gruppe.id).toBeUndefined();
                expect(gruppe.createdAt).toBeUndefined();
                expect(gruppe.updatedAt).toBeUndefined();
                expect(gruppe.revision).toBeDefined();
                expect(gruppe.mandant).toBe('');
                expect(gruppe.organisationId).toBe('');
                expect(gruppe.referrer).toEqual(createGroupBodyParams.referrer);
                expect(gruppe.bezeichnung).toEqual(createGroupBodyParams.bezeichnung);
                expect(gruppe.thema).toEqual(createGroupBodyParams.thema);
                expect(gruppe.beschreibung).toEqual(createGroupBodyParams.beschreibung);
                expect(gruppe.typ).toEqual(createGroupBodyParams.typ);
                expect(gruppe.bereich).toEqual(createGroupBodyParams.bereich);
                expect(gruppe.optionen).toEqual(createGroupBodyParams.optionen);
                expect(gruppe.differenzierung).toEqual(createGroupBodyParams.differenzierung);
                expect(gruppe.bildungsziele).toEqual(createGroupBodyParams.bildungsziele);
                expect(gruppe.jahrgangsstufen).toEqual(createGroupBodyParams.jahrgangsstufen);
                expect(gruppe.faecher).toEqual(createGroupBodyParams.faecher);
                expect(gruppe.referenzgruppen).toEqual(createGroupBodyParams.referenzgruppen);
                expect(gruppe.laufzeit).toEqual(createGroupBodyParams.laufzeit);
            });
        });
    });
});
