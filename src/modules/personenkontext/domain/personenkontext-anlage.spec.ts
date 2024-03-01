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

            organisationRepoMock.findByName.mockResolvedValue(organisationen);
            dBiamPersonenkontextRepoMock.findByRolle.mockResolvedValue(personenkontexte);

            const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(rolle.id, organisation.name!);
            expect(result).toHaveLength(1);
        });

        it('should return empty list when no personenkontexte could be found', async () => {
            const rolle: Rolle<true> = DoFactory.createRolle(true);
            const organisationen: OrganisationDo<true>[] = [];

            organisationRepoMock.findByName.mockResolvedValue(organisationen);
            dBiamPersonenkontextRepoMock.findByRolle.mockResolvedValue([]);

            const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(rolle.id, 'nonexistent');
            expect(result).toHaveLength(0);
        });

        it('should return empty list when no ssks could be found', async () => {
            const rolle: Rolle<true> = DoFactory.createRolle(true);
            const personenkontext: Personenkontext<true> = createPersonenkontext(true);
            const personenkontexte: Personenkontext<true>[] = [personenkontext];
            organisationRepoMock.findByName.mockResolvedValue([]);
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

    describe('zuweisen', () => {
        it('should create and save a Personenkontext', async () => {
            const personId: string = faker.string.uuid();
            const organisationId: string = faker.string.uuid();
            const rolleId: string = faker.string.uuid();

            const personenkontext: Personenkontext<true> = createPersonenkontext(true, {
                personId: personId,
                rolleId: rolleId,
                organisationId: organisationId,
            });
            anlage.organisationId = organisationId;
            anlage.rolleId = rolleId;
            dBiamPersonenkontextRepoMock.save.mockResolvedValue(personenkontext);

            const result: Personenkontext<true> = await anlage.zuweisen(personId);
            expect(result).toEqual(personenkontext);
            expect(dBiamPersonenkontextRepoMock.save).toHaveBeenCalledTimes(1);
        });

        it('should throw an error when organisationId is not set', async () => {
            const personId: string = faker.string.alpha();
            const personenkontext: Personenkontext<true> = createPersonenkontext(true);

            dBiamPersonenkontextRepoMock.save.mockResolvedValue(personenkontext);
            anlage.organisationId = undefined;
            await expect(anlage.zuweisen(personId)).rejects.toThrow(Error);
        });
    });
});
