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

describe('Gruppe', () => {
    describe('construct', () => {
        it('should return a new Gruppe instance', () => {
            const gruppe: Gruppe<false> = Gruppe.construct(
                faker.string.uuid(),
                faker.string.uuid(),
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
            expect(gruppe).toBeInstanceOf(Gruppe);
        });
    });
});
