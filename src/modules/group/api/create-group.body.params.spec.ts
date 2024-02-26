import { faker } from '@faker-js/faker';
import {
    Bildungsziele,
    Faecherkanon,
    GruppenTyp,
    Gruppenbereich,
    Gruppendifferenzierung,
    Gruppenoption,
    Gruppenrollen,
} from '../domain/gruppe.enums.js';
import { CreateGroupBodyParams } from './create-group.body.params.js';
import { Jahrgangsstufe } from '../../personenkontext/domain/personenkontext.enums.js';
import { plainToInstance } from 'class-transformer';

describe('CreateGroupBodyParams', () => {
    const referenceParams: CreateGroupBodyParams = {
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
        faecher: [Faecherkanon.DE],
        referenzgruppen: [
            {
                id: faker.string.uuid(),
                rollen: [Gruppenrollen.LEHR],
            },
        ],
        laufzeit: {
            von: faker.date.past(),
            vonLernperiode: '2022',
            bis: faker.date.future(),
            bisLernperiode: '2023',
        },
    };
    it('should convert a plain object to a class of createGroupBodyParams', () => {
        const incomingParams: object = {
            referrer: referenceParams.referrer,
            bezeichnung: referenceParams.bezeichnung,
            thema: referenceParams.thema,
            beschreibung: referenceParams.beschreibung,
            typ: referenceParams.typ,
            bereich: referenceParams.bereich,
            optionen: referenceParams.optionen,
            differenzierung: referenceParams.differenzierung,
            bildungsziele: referenceParams.bildungsziele,
            jahrgangsstufen: referenceParams.jahrgangsstufen,
            faecher: referenceParams.faecher,
            referenzgruppen: referenceParams.referenzgruppen,
            laufzeit: referenceParams.laufzeit,
        };
        const mappedParams: CreateGroupBodyParams = plainToInstance(CreateGroupBodyParams, incomingParams, {});
        expect(mappedParams).toBeInstanceOf(CreateGroupBodyParams);
        expect(mappedParams).toEqual(referenceParams);
    });
});
