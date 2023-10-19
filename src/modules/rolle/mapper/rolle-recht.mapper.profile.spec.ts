import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { MappingError } from '../../../shared/error/index.js';
import {RolleRechtDo} from "../domain/rolle-recht.do.js";
import {RolleRechtEntity} from "../../../persistence/rolle-recht.entity.js";
import {RolleRechtMapperProfile} from "./rolle-recht.mapper.profile";

describe('RolleRechtMapperProfile', () => {
    let module: TestingModule;
    let sut: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                RolleRechtMapperProfile
            ],
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
        it('should map RolleRechtDo to RolleRechtEntity', () => {
            const spz: RolleRechtDo<true> = DoFactory.createRolleRecht(true);
            expect(() => sut.map(spz, RolleRechtDo, RolleRechtEntity)).not.toThrowError(
                MappingError,
            );
        });
    });
});
