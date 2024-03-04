import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { PersonenkontextAnlage } from './personenkontext-anlage.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { DBiamPersonenkontextRepo } from '../dbiam/dbiam-personenkontext.repo.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { DoFactory } from '../../../../test/utils/index.js';
import { Personenkontext } from './personenkontext.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { createPersonenkontext } from '../dbiam/dbiam-personenkontext.repo.spec.js';
import { faker } from '@faker-js/faker';
import { PersonenkontextAnlageError } from '../../../shared/error/personenkontext-anlage.error.js';
import { EntityNotFoundError } from '../../../shared/error/index.js';

function createRolleOrganisations(
    anlage: PersonenkontextAnlage,
): [Rolle<true>, OrganisationDo<true>, OrganisationDo<true>] {
    const rolle: Rolle<true> = DoFactory.createRolle(true);
    const parentOrganisation: OrganisationDo<true> = DoFactory.createOrganisation(true);
    const childOrganisation: OrganisationDo<true> = DoFactory.createOrganisation(true);
    childOrganisation.administriertVon = parentOrganisation.id;
    anlage.organisationId = childOrganisation.id;
    anlage.rolleId = rolle.id;
    return [rolle, parentOrganisation, childOrganisation];
}
describe('PersonenkontextAnlage', () => {
    let module: TestingModule;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let organisationRepoMock: DeepMocked<OrganisationRepo>;
    let dBiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let anlage: PersonenkontextAnlage;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: OrganisationRepo,
                    useValue: createMock<OrganisationRepo>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
            ],
        }).compile();
        rolleRepoMock = module.get(RolleRepo);
        organisationRepoMock = module.get(OrganisationRepo);
        dBiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        anlage = PersonenkontextAnlage.construct(rolleRepoMock, organisationRepoMock, dBiamPersonenkontextRepoMock);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(anlage).toBeDefined();
    });

    describe('findSchulstrukturknoten', () => {
        it('should return list of schulstrukturknoten when they exist', async () => {
            const rolle: Rolle<true> = DoFactory.createRolle(true);
            const organisation: OrganisationDo<true> = DoFactory.createOrganisation(true);
            const organisationen: OrganisationDo<true>[] = [organisation];
            const personenkontext: Personenkontext<true> = createPersonenkontext(true, {
                rolleId: rolle.id,
                organisationId: organisation.id,
            });
            const personenkontexte: Personenkontext<true>[] = [personenkontext];

            organisationRepoMock.findByNameOrKennung.mockResolvedValue(organisationen);
            dBiamPersonenkontextRepoMock.findByRolle.mockResolvedValue(personenkontexte);

            const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(rolle.id, organisation.name!);
            expect(result).toHaveLength(1);
        });

        it('should return empty list when no personenkontexte could be found', async () => {
            const rolle: Rolle<true> = DoFactory.createRolle(true);
            const organisationen: OrganisationDo<true>[] = [];

            organisationRepoMock.findByNameOrKennung.mockResolvedValue(organisationen);
            dBiamPersonenkontextRepoMock.findByRolle.mockResolvedValue([]);

            const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(rolle.id, 'nonexistent');
            expect(result).toHaveLength(0);
        });

        it('should return empty list when no ssks could be found', async () => {
            const rolle: Rolle<true> = DoFactory.createRolle(true);
            const personenkontext: Personenkontext<true> = createPersonenkontext(true);
            const personenkontexte: Personenkontext<true>[] = [personenkontext];
            organisationRepoMock.findByNameOrKennung.mockResolvedValue([]);
            dBiamPersonenkontextRepoMock.findByRolle.mockResolvedValue(personenkontexte);

            const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(rolle.id, 'nonexistent');
            expect(result).toHaveLength(0);
        });
    });

    describe('findRollen', () => {
        it('should return list of rollen when they exist', async () => {
            const rolle: Rolle<true> = DoFactory.createRolle(true);
            rolleRepoMock.findByName.mockResolvedValue([rolle]);

            const result: Rolle<true>[] = await anlage.findRollen(rolle.name);
            expect(result).toEqual([rolle]);
        });

        it('should return empty list when no rollen exist', async () => {
            rolleRepoMock.findByName.mockResolvedValue(undefined);

            const result: Rolle<true>[] = await anlage.findRollen('nonexistent');
            expect(result).toEqual([]);
        });
    });

    describe('validieren', () => {
        describe('when personenkontext is valid because rolle-SSK-Id is equal organisationId', () => {
            it('should return true', async () => {
                const [rolle, organisation]: [Rolle<true>, OrganisationDo<true>, OrganisationDo<true>] =
                    createRolleOrganisations(anlage);

                rolleRepoMock.findById.mockResolvedValue(rolle);
                organisationRepoMock.findById.mockResolvedValue(organisation); //find organisation from aggregate

                expect(await anlage.validieren()).toEqual({ ok: true, value: true });
            });
        });

        describe('when personenkontext is valid because rolle-SSK-Id is equal to a child of administering SSK', () => {
            it('should return true', async () => {
                const [rolle, parentOrganisation, childOrganisation]: [
                    Rolle<true>,
                    OrganisationDo<true>,
                    OrganisationDo<true>,
                ] = createRolleOrganisations(anlage);

                rolleRepoMock.findById.mockResolvedValue(rolle);
                organisationRepoMock.findById.mockResolvedValueOnce(childOrganisation); //find organisation from aggregate
                organisationRepoMock.findById.mockResolvedValueOnce(parentOrganisation); //find organisation from rolle.administeredBySchulstrukturknoten

                const foundSSKChildren: Counted<OrganisationDo<true>> = [[childOrganisation], 0];
                organisationRepoMock.findBy.mockResolvedValue(foundSSKChildren);

                expect(await anlage.validieren()).toEqual({ ok: true, value: true });
            });
        });

        describe('when personenkontext is invalid because organisation is not a child of administering SSK', () => {
            it('should return true', async () => {
                const [rolle, parentOrganisation, childOrganisation]: [
                    Rolle<true>,
                    OrganisationDo<true>,
                    OrganisationDo<true>,
                ] = createRolleOrganisations(anlage);
                rolleRepoMock.findById.mockResolvedValue(rolle);
                organisationRepoMock.findById.mockResolvedValueOnce(childOrganisation); //find organisation from aggregate
                organisationRepoMock.findById.mockResolvedValueOnce(parentOrganisation); //find organisation from rolle.administeredBySchulstrukturknoten

                const foundSSKChildren: Counted<OrganisationDo<true>> = [[], 0];
                organisationRepoMock.findBy.mockResolvedValue(foundSSKChildren);

                expect(await anlage.validieren()).toEqual({ ok: false, error: new EntityNotFoundError() });
            });
        });

        describe('when personenkontext is invalid by undefined rolleId', () => {
            it('should return error', async () => {
                anlage.rolleId = undefined;
                const error: Result<boolean, PersonenkontextAnlageError> = {
                    ok: false,
                    error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid: rolleId is undefined'),
                };
                expect(await anlage.validieren()).toEqual(error);
            });
        });

        describe('when personenkontext is invalid by undefined organisationId', () => {
            it('should return error', async () => {
                anlage.rolleId = faker.string.uuid();
                anlage.organisationId = undefined;
                const error: Result<boolean, PersonenkontextAnlageError> = {
                    ok: false,
                    error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid: organisationId is undefined'),
                };
                expect(await anlage.validieren()).toEqual(error);
            });
        });

        describe('when rolle cannot be found', () => {
            it('should return error', async () => {
                rolleRepoMock.findById.mockResolvedValue(undefined);
                createRolleOrganisations(anlage);
                const error: Result<boolean, PersonenkontextAnlageError> = {
                    ok: false,
                    error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid: rolle could not be found'),
                };
                expect(await anlage.validieren()).toEqual(error);
            });
        });

        describe('when organisation cannot be found', () => {
            it('should return error', async () => {
                const [rolle]: [Rolle<true>, OrganisationDo<true>, OrganisationDo<true>] =
                    createRolleOrganisations(anlage);
                rolleRepoMock.findById.mockResolvedValue(rolle);
                organisationRepoMock.findById.mockResolvedValue(undefined); //find organisation from aggregate returns undefined

                const error: Result<boolean, PersonenkontextAnlageError> = {
                    ok: false,
                    error: new PersonenkontextAnlageError(
                        'PersonenkontextAnlage invalid: organisation could not be found',
                    ),
                };
                expect(await anlage.validieren()).toEqual(error);
            });
        });

        describe('when organisation from rolle as administering SSK cannot be found', () => {
            it('should return error', async () => {
                const [rolle, organisation]: [Rolle<true>, OrganisationDo<true>, OrganisationDo<true>] =
                    createRolleOrganisations(anlage);
                rolleRepoMock.findById.mockResolvedValue(rolle);
                organisationRepoMock.findById.mockResolvedValueOnce(organisation); //find organisation from aggregate
                organisationRepoMock.findById.mockResolvedValueOnce(undefined); //find organisation from rolle.administeredBySchulstrukturknoten

                const error: Result<boolean, PersonenkontextAnlageError> = {
                    ok: false,
                    error: new PersonenkontextAnlageError(
                        'PersonenkontextAnlage invalid: organisation administering rolle could not be found',
                    ),
                };
                expect(await anlage.validieren()).toEqual(error);
            });
        });
    });

    describe('zuweisen', () => {
        it('should create and save a Personenkontext', async () => {
            const personId: string = faker.string.uuid();
            const [rolle, organisation]: [Rolle<true>, OrganisationDo<true>, OrganisationDo<true>] =
                createRolleOrganisations(anlage);
            const personenkontext: Personenkontext<true> = createPersonenkontext(true, {
                personId: personId,
                rolleId: rolle.id,
                organisationId: organisation.id,
            });

            rolleRepoMock.findById.mockResolvedValue(rolle);
            organisationRepoMock.findById.mockResolvedValue(organisation); //find organisation from aggregate
            organisationRepoMock.findById.mockResolvedValue(organisation); //find organisation from rolle.administeredBySchulstrukturknoten
            dBiamPersonenkontextRepoMock.save.mockResolvedValue(personenkontext);

            const result: Result<Personenkontext<true>, PersonenkontextAnlageError> = await anlage.zuweisen(personId);
            expect(result).toEqual({
                ok: true,
                value: personenkontext,
            });
            expect(dBiamPersonenkontextRepoMock.save).toHaveBeenCalledTimes(1);
        });

        it('should return error when rolleId is undefined', async () => {
            const personId: string = faker.string.alpha();
            const personenkontext: Personenkontext<true> = createPersonenkontext(true);

            dBiamPersonenkontextRepoMock.save.mockResolvedValue(personenkontext);
            anlage.rolleId = undefined;
            const error: Result<boolean, PersonenkontextAnlageError> = {
                ok: false,
                error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid: rolleId is undefined'),
            };
            expect(await anlage.zuweisen(personId)).toEqual(error);
        });

        it('should return error when organisationId is undefined', async () => {
            const personId: string = faker.string.alpha();
            const personenkontext: Personenkontext<true> = createPersonenkontext(true);

            dBiamPersonenkontextRepoMock.save.mockResolvedValue(personenkontext);
            anlage.rolleId = faker.string.uuid();
            anlage.organisationId = undefined;
            const error: Result<boolean, PersonenkontextAnlageError> = {
                ok: false,
                error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid: organisationId is undefined'),
            };
            expect(await anlage.zuweisen(personId)).toEqual(error);
        });

        it('should return error when personkontext is invalid', async () => {
            const personId: string = faker.string.uuid();
            createRolleOrganisations(anlage);
            rolleRepoMock.findById.mockResolvedValue(undefined);

            const result: Result<Personenkontext<true>, PersonenkontextAnlageError> = await anlage.zuweisen(personId);
            expect(result).toEqual(
                expect.objectContaining({
                    ok: false,
                }),
            );
            expect(dBiamPersonenkontextRepoMock.save).toHaveBeenCalledTimes(0);
        });
    });
});
