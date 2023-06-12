import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { MapperTestModule, MappingError } from '../../shared/index.js';
import { CreatePersonBodyParams, CreatePersonDTO } from './dto/index.js';
import { PersonEntity } from './person.entity.js';
import { PersonMapperProfile } from './person.mapper.profile.js';

describe('PersonMapperProfile', () => {
    let module: TestingModule;
    let mapper: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [PersonMapperProfile],
        }).compile();
        mapper = module.get(getMapperToken());
    });

    afterAll(async () => {
        await module.close();
    });

    describe('when mapper is initialized', () => {
        it('should map CreatePersonBodyParams to CreatePersonDTO', () => {
            const params: CreatePersonBodyParams = {
                referrer: 'referrer',
                name: {
                    firstName: 'john',
                    lastName: 'doe',
                },
                birth: {},
                localization: 'de-DE',
            };
            expect(() => mapper.map(params, CreatePersonBodyParams, CreatePersonDTO)).not.toThrowError(MappingError);
        });

        it('should map CreatePersonDTO to PersonEntity', () => {
            const dto: CreatePersonDTO = {
                firstName: 'john',
                lastName: 'doe',
                localization: 'de-DE',
                referrer: 'referrer',
            };
            expect(() => mapper.map(dto, CreatePersonDTO, PersonEntity)).not.toThrowError(MappingError);
        });

        it('should map CreatePersonBodyParams to PersonEntity', () => {});
    });
});
