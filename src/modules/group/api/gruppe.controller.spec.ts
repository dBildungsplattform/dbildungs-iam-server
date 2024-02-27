import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { TestingModule, Test } from '@nestjs/testing';
import { GruppenController } from './gruppe.controller.js';
import { GruppenFactory } from '../domain/gruppe.factory.js';
import { CreateGroupBodyParams } from './create-group.body.params.js';
import { GruppenTyp, Gruppendifferenzierung } from '../domain/gruppe.enums.js';
import { Gruppe } from '../domain/gruppe.js';
import { Laufzeit } from '../persistence/laufzeit.js';
import { GruppeEntity } from '../persistence/gruppe.entity.js';
import { GruppenRepository } from '../domain/gruppe.repo.js';
import { GruppenDo } from '../domain/gruppe.do.js';
import { HttpException } from '@nestjs/common';
import { SichtfreigabeType } from '../../personenkontext/domain/personenkontext.enums.js';
import { GruppeMapper } from '../domain/gruppe.mapper.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
describe('GruppeController', () => {
    let module: TestingModule;
    let gruppenController: GruppenController;
    let gruppenFactoryMock: DeepMocked<GruppenFactory>;
    let repo: DeepMocked<GruppenRepository>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                GruppenController,
                GruppeMapper,
                {
                    provide: GruppenFactory,
                    useValue: createMock<GruppenFactory>(),
                },
                {
                    provide: GruppenRepository,
                    useValue: createMock<GruppenRepository>(),
                },
            ],
        }).compile();

        gruppenController = module.get(GruppenController);
        gruppenFactoryMock = module.get(GruppenFactory);
        repo = module.get(GruppenRepository);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeAll(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(gruppenController).toBeDefined();
    });

    describe('createGroup', () => {
        const gruppe: Gruppe = Gruppe.construct('test', GruppenTyp.KURS, Gruppendifferenzierung.E);

        const params: CreateGroupBodyParams = {
            bezeichnung: 'test',
            typ: GruppenTyp.KURS,
            differenzierung: Gruppendifferenzierung.E,
            laufzeit: new Laufzeit({ von: new Date(), bis: new Date() }),
        };
        describe('when creating a group is successful', () => {
            it('should return the created group', async () => {
                const gruppeEntity: GruppeEntity = new GruppeEntity();
                gruppeEntity.bezeichnung = gruppe.getBezeichnung();
                gruppeEntity.typ = gruppe.getTyp();
                gruppeEntity.differenzierung = gruppe.getDifferenzierung();
                gruppeEntity.organisationId = '';
                gruppeEntity.thema = '';
                gruppeEntity.beschreibung = '';
                gruppeEntity.bereich = undefined;
                gruppeEntity.optionen = undefined;
                gruppeEntity.bildungsziele = undefined;
                gruppeEntity.jahrgangsstufen = undefined;
                gruppeEntity.faecher = undefined;
                gruppeEntity.referenzgruppen = undefined;
                gruppeEntity.referrer = '';
                gruppeEntity.laufzeit = new Laufzeit({ von: new Date(), bis: new Date() });
                gruppeEntity.mandant = '';
                gruppeEntity.sichtfreigabe = SichtfreigabeType.NEIN;
                gruppeEntity.revision = '1';

                gruppenFactoryMock.createGroup.mockReturnValue(gruppe);
                repo.createGruppe.mockResolvedValue({ ok: true, value: gruppeEntity });

                const result: GruppenDo<true> | HttpException = await gruppenController.createGroup(params);

                const returnedGruppe: GruppenDo<true> = result as GruppenDo<true>;
                expect(returnedGruppe.typ).toBe(gruppe.getTyp());
                expect(returnedGruppe.differenzierung).toBe(gruppe.getDifferenzierung());
                expect(returnedGruppe.bezeichnung).toBe(gruppe.getBezeichnung());
            });
        });

        describe('when creating a group is not successful', () => {
            it('should return an HttpException', async () => {
                gruppenFactoryMock.createGroup.mockReturnValue(gruppe);
                repo.createGruppe.mockResolvedValue({ ok: false, error: new EntityCouldNotBeCreated('Gruppe') });

                const result: GruppenDo<true> | HttpException = await gruppenController.createGroup(params);

                expect(result).toBeInstanceOf(HttpException);
            });
        });
    });
});
