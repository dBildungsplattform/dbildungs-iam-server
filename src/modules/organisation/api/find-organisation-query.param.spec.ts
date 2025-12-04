import { plainToInstance } from 'class-transformer';
import { RollenSystemRecht } from '../../rolle/domain/systemrecht.js';
import { FindOrganisationQueryParams } from './find-organisation-query.param.js';
import { validate, ValidationError } from 'class-validator';

describe('FindOrganisationQueryParams', () => {
    it('should map systemrechte to array', () => {
        const test: FindOrganisationQueryParams = plainToInstance(FindOrganisationQueryParams, {
            systemrechte: RollenSystemRecht.ROLLEN_VERWALTEN,
        });

        expect(test.systemrechte).toEqual([RollenSystemRecht.ROLLEN_VERWALTEN]);
    });

    describe('getChildrenRecursivly Transform', () => {
        it('should transform "true" string to boolean true', async () => {
            const dto: FindOrganisationQueryParams = plainToInstance(FindOrganisationQueryParams, {
                getChildrenRecursivly: 'true',
            });
            const errors: ValidationError[] = await validate(dto);
            expect(errors).toHaveLength(0);
            expect(dto.getChildrenRecursivly).toBe(true);
        });

        it('should transform "false" string to boolean false', async () => {
            const dto: FindOrganisationQueryParams = plainToInstance(FindOrganisationQueryParams, {
                getChildrenRecursivly: 'false',
            });
            const errors: ValidationError[] = await validate(dto);
            expect(errors).toHaveLength(0);
            expect(dto.getChildrenRecursivly).toBe(false);
        });

        it('should pass through boolean true unchanged (fallback branch)', async () => {
            const dto: FindOrganisationQueryParams = plainToInstance(FindOrganisationQueryParams, {
                getChildrenRecursivly: true,
            });
            const errors: ValidationError[] = await validate(dto);
            expect(errors).toHaveLength(0);
            expect(dto.getChildrenRecursivly).toBe(true);
        });

        it('should pass through boolean false unchanged (fallback branch)', async () => {
            const dto: FindOrganisationQueryParams = plainToInstance(FindOrganisationQueryParams, {
                getChildrenRecursivly: false,
            });
            const errors: ValidationError[] = await validate(dto);
            expect(errors).toHaveLength(0);
            expect(dto.getChildrenRecursivly).toBe(false);
        });

        it('should allow undefined (IsOptional) and keep it undefined (fallback branch)', async () => {
            const dto: FindOrganisationQueryParams = plainToInstance(FindOrganisationQueryParams, {});
            const errors: ValidationError[] = await validate(dto);
            expect(errors).toHaveLength(0);
            expect(dto.getChildrenRecursivly).toBeUndefined();
        });

        it('should fail validation for arbitrary non-boolean strings (fallback branch returning string)', async () => {
            const dto: FindOrganisationQueryParams = plainToInstance(FindOrganisationQueryParams, {
                getChildrenRecursivly: 'yes',
            });
            const errors: ValidationError[] = await validate(dto);
            // Should have an IsBoolean violation since transform returned "yes"
            expect(errors).not.toHaveLength(0);
            const propError: ValidationError | undefined = errors.find(
                (e: ValidationError) => e.property === 'getChildrenRecursivly',
            );
            expect(propError).toBeDefined();
        });
    });
});
