import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Test, TestingModule } from '@nestjs/testing';

import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { CreateRolleBodyParams } from '../api/create-rolle.body.params.js';
import { RolleResponse } from '../api/rolle.response.js';
import { Rolle } from '../domain/rolle.js';
import { RolleEntity } from '../entity/rolle.entity.js';
import { RolleMapperProfile } from './rolle.mapper.profile.js';

describe('RolleMapperProfile', () => {
    let module: TestingModule;
    let sut: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [RolleMapperProfile],
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
        it('should map Rolle to RolleResponse', () => {
            const rolle: Rolle = DoFactory.createRolle(true);
            expect(() => sut.map(rolle, Rolle, RolleResponse)).not.toThrow();
        });

        it('should map CreateRolleBodyParams to Rolle', () => {
            const createParams: CreateRolleBodyParams = new CreateRolleBodyParams();
            expect(() => sut.map(createParams, CreateRolleBodyParams, Rolle)).not.toThrow();
        });

        it('should map RolleEntity to Rolle', () => {
            const entity: RolleEntity = new RolleEntity();
            expect(() => sut.map(entity, RolleEntity, Rolle)).not.toThrow();
        });

        it('should map Rolle to RolleEntity', () => {
            const rolle: Rolle = new Rolle();
            expect(() => sut.map(rolle, Rolle, RolleEntity)).not.toThrow();
        });
    });
});
