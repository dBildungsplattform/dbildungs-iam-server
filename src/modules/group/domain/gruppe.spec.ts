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

                expect(createdGroup).toEqual(
                    expect.objectContaining({
                        id: undefined,
                        createdAt: undefined,
                        updatedAt: undefined,
                        revision: '',
                        mandant: '',
                        organisationId: '',
                        referrer: createGroupBodyParams.referrer,
                        thema: createGroupBodyParams.thema,
                        bereich: createGroupBodyParams.bereich,
                        beschreibung: createGroupBodyParams.beschreibung,
                        bezeichnung: createGroupBodyParams.bezeichnung,
                        typ: createGroupBodyParams.typ,
                        optionen: createGroupBodyParams.optionen,
                        differenzierung: createGroupBodyParams.differenzierung,
                        bildungsziele: createGroupBodyParams.bildungsziele,
                        jahrgangsstufen: createGroupBodyParams.jahrgangsstufen,
                        faecher: createGroupBodyParams.faecher,
                        referenzgruppen: createGroupBodyParams.referenzgruppen,
                        laufzeit: createGroupBodyParams.laufzeit,
                    }),
                );
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

                expect(gruppe).toEqual(
                    expect.objectContaining({
                        id: undefined,
                        createdAt: undefined,
                        updatedAt: undefined,
                        revision: '',
                        mandant: '',
                        organisationId: '',
                        referrer: createGroupBodyParams.referrer,
                        thema: createGroupBodyParams.thema,
                        bereich: createGroupBodyParams.bereich,
                        beschreibung: createGroupBodyParams.beschreibung,
                        bezeichnung: createGroupBodyParams.bezeichnung,
                        typ: createGroupBodyParams.typ,
                        optionen: createGroupBodyParams.optionen,
                        differenzierung: createGroupBodyParams.differenzierung,
                        bildungsziele: createGroupBodyParams.bildungsziele,
                        jahrgangsstufen: createGroupBodyParams.jahrgangsstufen,
                        faecher: createGroupBodyParams.faecher,
                        referenzgruppen: createGroupBodyParams.referenzgruppen,
                        laufzeit: createGroupBodyParams.laufzeit,
                    }),
                );
            });
        });
    });
});
