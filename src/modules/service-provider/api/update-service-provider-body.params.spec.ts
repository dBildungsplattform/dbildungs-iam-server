import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

import { UpdateServiceProviderBodyParams } from './update-service-provider-body.params.js';

describe('UpdateServiceProviderBodyParams', () => {
    it('should fail validation for invalid rollenartenWhitelist entries', async () => {
        const instance: UpdateServiceProviderBodyParams = plainToInstance(UpdateServiceProviderBodyParams, {
            rollenartenWhitelist: ['NOT_A_ROLLENART'],
        });

        const errors: ValidationError[] = await validate(instance);

        expect(errors.some((error: ValidationError) => error.property === 'rollenartenWhitelist')).toBe(true);
    });
});
