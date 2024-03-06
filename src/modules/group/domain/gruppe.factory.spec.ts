import { Gruppe } from './gruppe.js';
import { GruppenFactory } from './gruppe.factory.js';
import { CreateGroupBodyParams } from '../api/create-group.body.params.js';
import { faker } from '@faker-js/faker';
import {
    Bildungsziele,
    Faecherkanon,
    GruppenTyp,
    Gruppenbereich,
    Gruppendifferenzierung,
    Gruppenoption,
    Gruppenrollen,
} from './gruppe.enums.js';
import { Referenzgruppen } from './referenzgruppen.js';
import { Jahrgangsstufe } from '../../personenkontext/domain/personenkontext.enums.js';

describe('createGroup', () => {
    let factory: GruppenFactory;
    const createGroupBodyParams: CreateGroupBodyParams = {
        bezeichnung: faker.lorem.word(),
        typ: GruppenTyp.KLASSE,
        bereich: Gruppenbereich.PFLICHT,
        differenzierung: Gruppendifferenzierung.E,
        bildungsziele: [Bildungsziele.GS, Bildungsziele.HS],
        jahrgangsstufen: [Jahrgangsstufe.JAHRGANGSSTUFE_1, Jahrgangsstufe.JAHRGANGSSTUFE_2],
        faecher: [Faecherkanon.DE],
        referenzgruppen: [
            new Referenzgruppen({
                id: faker.string.uuid(),
                rollen: [Gruppenrollen.LEHR],
            }),
        ],
        laufzeit: {
            von: new Date(),
            bis: new Date(),
        },
    };

    const gruppe: Gruppe<true> = Gruppe.construct(
        faker.string.uuid(),
        faker.date.recent(),
        faker.date.recent(),
        faker.lorem.word(),
        faker.string.uuid(),
        faker.lorem.word(),
        GruppenTyp.KURS,
        faker.lorem.word(),
        faker.lorem.word(),
        faker.lorem.word(),
        faker.lorem.word(),
        Gruppenbereich.PFLICHT,
        [Gruppenoption.BILINGUAL],
        Gruppendifferenzierung.E,
        [],
        [],
        [],
        [],
    );

    beforeAll(() => {
        factory = new GruppenFactory();
    });

    describe('when creating a group', () => {
        it('should create a group aggregate', () => {
            jest.spyOn(Gruppe, 'createGroup').mockReturnValue(gruppe as unknown as Gruppe<false>);

            const result: Gruppe<false> = factory.createGroup(createGroupBodyParams);

            expect(result).toEqual(gruppe);
            expect(result.getBeschreibung()).toEqual(gruppe.getBeschreibung());
            expect(result.getBezeichnung()).toEqual(gruppe.getBezeichnung());
            expect(result.getBereich()).toEqual(gruppe.getBereich());
            expect(result.getBildungsziele()).toEqual(gruppe.getBildungsziele());
            expect(result.getDifferenzierung()).toEqual(gruppe.getDifferenzierung());
            expect(result.getFaecher()).toEqual(gruppe.getFaecher());
            expect(result.getTyp()).toEqual(gruppe.getTyp());
            expect(result.getJahrgangsstufen()).toEqual(gruppe.getJahrgangsstufen());
        });
    });
});
