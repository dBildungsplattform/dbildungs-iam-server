import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { ValidationError, validateSync } from 'class-validator';

import { RollenSystemRechtEnum } from '../domain/systemrecht.js';
import { FindRolleQueryParams } from './find-rolle-query.param.js';

describe('FindRolleQueryParams', () => {
    it('should accept MPT_ROLLEN_VERWALTEN for rollen admin queries', () => {
        const queryParams: FindRolleQueryParams = plainToInstance(FindRolleQueryParams, {
            systemrechte: [RollenSystemRechtEnum.MPT_ROLLEN_VERWALTEN],
        });

        const validationErrors: ValidationError[] = validateSync(queryParams);

        expect(validationErrors).toHaveLength(0);
    });
});
