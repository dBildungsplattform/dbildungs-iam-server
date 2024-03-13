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
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

describe('createGroup', () => {
    let module: TestingModule;
    let factory: GruppenFactory;
    let mockedGruppe: DeepMocked<typeof Gruppe>;
    const createGroupBodyParams: CreateGroupBodyParams = {
        bezeichnung: faker.lorem.word(),
        typ: GruppenTyp.KLASSE,
        bereich: Gruppenbereich.PFLICHT,
        optionen: [Gruppenoption.BILINGUAL],
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

    const gruppe: Gruppe<false> = Gruppe.construct(
        faker.string.uuid(),
        faker.date.recent(),
        faker.date.recent(),
        createGroupBodyParams.bezeichnung,
        createGroupBodyParams.typ,
        '',
        createGroupBodyParams.referrer,
        createGroupBodyParams.thema,
        createGroupBodyParams.beschreibung,
        createGroupBodyParams.bereich,
        createGroupBodyParams.optionen,
        createGroupBodyParams.differenzierung,
        createGroupBodyParams.bildungsziele,
        createGroupBodyParams.jahrgangsstufen,
        createGroupBodyParams.faecher,
        createGroupBodyParams.referenzgruppen,
        createGroupBodyParams.laufzeit,
    );

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                GruppenFactory,
                {
                    provide: Gruppe,
                    useValue: createMock<Gruppe<false>>(),
                },
            ],
        }).compile();
        factory = module.get(GruppenFactory);
        mockedGruppe = module.get(Gruppe<false>);
    });

    describe('when creating a group', () => {
        it('should create a group aggregate', () => {
            mockedGruppe.createGroup.mockReturnValue(gruppe);

            const result: Gruppe<false> = factory.createGroup(createGroupBodyParams);

            expect(result.beschreibung).toEqual(gruppe.beschreibung);
            expect(result.typ).toEqual(gruppe.typ);
            expect(result.bereich).toEqual(gruppe.bereich);
            expect(result.optionen).toEqual(gruppe.optionen);
            expect(result.differenzierung).toEqual(gruppe.differenzierung);
            expect(result.bildungsziele).toEqual(gruppe.bildungsziele);
            expect(result.jahrgangsstufen).toEqual(gruppe.jahrgangsstufen);
            expect(result.faecher).toEqual(gruppe.faecher);
            expect(result.referenzgruppen).toEqual(gruppe.referenzgruppen);
            expect(result.laufzeit).toEqual(gruppe.laufzeit);
        });
    });
});
