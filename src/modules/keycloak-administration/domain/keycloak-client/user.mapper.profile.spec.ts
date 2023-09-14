import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';

import { MapperTestModule } from '../../../../../test/utils/index.js';
import { MappingError } from '../../../../shared/error/index.js';
import { UserDo } from '../user.do.js';
import { UserRepresentationDto } from './user-representation.dto.js';
import { UserMapperProfile } from './user.mapper.profile.js';

describe('UserMapperProfile', () => {
    let module: TestingModule;
    let sut: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [UserMapperProfile],
        }).compile();

        sut = module.get(getMapperToken());
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('when mapper is initialized', () => {
        it('should map UserRepresentationDto to UserDo', () => {
            const userRepr: UserRepresentationDto = {
                id: faker.string.uuid(),
                email: faker.internet.email(),
                createdTimestamp: faker.date.recent().getTime(),
            };

            expect(() => sut.map(userRepr, UserRepresentationDto, UserDo)).not.toThrowError(MappingError);
        });
    });
});
