import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { TestingModule, Test } from '@nestjs/testing';
import { GruppenController } from './gruppe.controller.js';
import { GruppenFactory } from '../domain/gruppe.factory.js';
import { CreateGroupBodyParams } from './create-group.body.params.js';
import { GruppenTyp, Gruppenbereich, Gruppendifferenzierung, Gruppenoption } from '../domain/gruppe.enums.js';
import { Gruppe } from '../domain/gruppe.js';
import { Laufzeit } from '../persistence/laufzeit.js';
import { GruppenRepository } from '../domain/gruppe.repo.js';
import { HttpException } from '@nestjs/common';
import { GruppeMapper } from '../domain/gruppe.mapper.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { faker } from '@faker-js/faker';
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

        const params: CreateGroupBodyParams = {
            bezeichnung: 'test',
            typ: GruppenTyp.KURS,
            differenzierung: Gruppendifferenzierung.E,
            laufzeit: new Laufzeit({ von: new Date(), bis: new Date() }),
        };
        describe('when creating a group is successful', () => {
            it('should return the created group aggeragte', async () => {
                gruppenFactoryMock.createGroup.mockReturnValue(gruppe as unknown as Gruppe<false>);
                repo.save.mockResolvedValue({ ok: true, value: gruppe });

                const result: Gruppe<true> | HttpException = await gruppenController.createGroup(params);

                const returnedGruppe: Gruppe<true> = result as Gruppe<true>;
                expect(returnedGruppe.getTyp()).toBe(gruppe.getTyp());
                expect(returnedGruppe.getDifferenzierung()).toBe(gruppe.getDifferenzierung());
                expect(returnedGruppe.getBezeichnung()).toBe(gruppe.getBezeichnung());
            });
        });

        describe('when creating a group is not successful', () => {
            it('should return an HttpException', async () => {
                gruppenFactoryMock.createGroup.mockReturnValue(gruppe as unknown as Gruppe<false>);
                repo.save.mockResolvedValue({ ok: false, error: new EntityCouldNotBeCreated('Gruppe') });

                const result: Gruppe<true> | HttpException = await gruppenController.createGroup(params);

                expect(result).toBeInstanceOf(HttpException);
            });
        });
    });
});
