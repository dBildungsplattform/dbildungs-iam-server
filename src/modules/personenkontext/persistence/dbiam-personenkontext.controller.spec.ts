import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { PersonApiMapperProfile } from '../../person/api/person-api.mapper.profile.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { Rolle as RolleAggregate } from '../../rolle/domain/rolle.js';
import { DBiamPersonenkontextController } from './dbiam-personenkontext.controller.js';
import { PersonenkontextUc } from '../api/personenkontext.uc.js';
import { FindPersonenkontextRollenBodyParams } from '../api/find-personenkontext-rollen.body.params.js';
import { FindRollenResponse } from '../api/find-rollen.response.js';
import { FindSchulstrukturknotenResponse } from '../api/find-schulstrukturknoten.response.js';
import { OrganisationResponse } from '../../organisation/api/organisation.response.js';
import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { OrganisationApiMapperProfile } from '../../organisation/api/organisation-api.mapper.profile.js';

describe('DbiamPersonenkontextController', () => {
    let module: TestingModule;
    let sut: DBiamPersonenkontextController;
    let personenkontextUcMock: DeepMocked<PersonenkontextUc>;
    let mapper: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                DBiamPersonenkontextController,
                PersonApiMapperProfile,
                OrganisationApiMapperProfile,
                {
                    provide: PersonenkontextUc,
                    useValue: createMock<PersonenkontextUc>(),
                },
            ],
        }).compile();
        mapper = module.get(getMapperToken());
        sut = module.get(DBiamPersonenkontextController);
        personenkontextUcMock = module.get(PersonenkontextUc);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('findRollen', () => {
        it('should return list of rollen', async () => {
            const params: FindPersonenkontextRollenBodyParams = {
                rolleName: faker.string.alpha(),
                limit: 1,
            };
            const rollen: RolleAggregate<true>[] = [DoFactory.createRolle(true)];
            const expected: FindRollenResponse = new FindRollenResponse();
            expected.moeglicheRollen = rollen;
            expected.total = 1;

            personenkontextUcMock.findRollen.mockResolvedValue(expected);

            const result: FindRollenResponse = await sut.findRollen(params);
            expect(result.moeglicheRollen).toHaveLength(1);
            expect(result).toEqual(expected);
            expect(personenkontextUcMock.findRollen).toHaveBeenCalledTimes(1);
        });

        it('should return empty list if not results could be found', async () => {
            const params: FindPersonenkontextRollenBodyParams = {
                rolleName: faker.string.alpha(),
                limit: 1,
            };
            const response: FindRollenResponse = {
                moeglicheRollen: [],
                total: 1,
            };
            personenkontextUcMock.findRollen.mockResolvedValue(response);

            const result: FindRollenResponse = await sut.findRollen(params);
            expect(result.moeglicheRollen).toHaveLength(0);
            expect(personenkontextUcMock.findRollen).toHaveBeenCalledTimes(1);
        });
    });

    describe('findSchulstrukturknoten', () => {
        it('should return list of schulstrukturknoten', async () => {
            const ssks: OrganisationDo<true>[] = [DoFactory.createOrganisation(true)];
            const sskResponses: OrganisationResponse[] = mapper.mapArray(ssks, OrganisationDo, OrganisationResponse);
            personenkontextUcMock.findSchulstrukturknoten.mockResolvedValue({
                moeglicheSkks: sskResponses,
                total: 1,
            });
            const expected: FindSchulstrukturknotenResponse = new FindSchulstrukturknotenResponse();
            expected.moeglicheSkks = sskResponses;
            expected.total = 1;
            const result: FindSchulstrukturknotenResponse = await sut.findSchulstrukturknoten({
                sskName: faker.string.alpha(),
                rolleId: faker.string.numeric(),
                limit: 1,
            });
            expect(result.moeglicheSkks).toHaveLength(1);
            expect(result).toEqual(expected);
            expect(personenkontextUcMock.findSchulstrukturknoten).toHaveBeenCalledTimes(1);
        });

        it('should return empty list if not results could be found', async () => {
            personenkontextUcMock.findSchulstrukturknoten.mockResolvedValue({
                moeglicheSkks: [],
                total: 1,
            });
            const result: FindSchulstrukturknotenResponse = await sut.findSchulstrukturknoten({
                sskName: faker.string.alpha(),
                rolleId: faker.string.numeric(),
                limit: 1,
            });
            expect(result.moeglicheSkks).toHaveLength(0);
            expect(personenkontextUcMock.findSchulstrukturknoten).toHaveBeenCalledTimes(1);
        });
    });
});
