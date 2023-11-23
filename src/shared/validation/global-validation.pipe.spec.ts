import { Test, TestingModule } from '@nestjs/testing';
import { GlobalValidationPipe } from './global-validation.pipe.js';
import { DetailedValidationError } from './detailed-validation.error.js';
import { ValidationError } from 'class-validator';

describe('GlobalValidationPipe', () => {
    let module: TestingModule;
    let validationPipe: GlobalValidationPipe;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [GlobalValidationPipe],
        }).compile();
        validationPipe = module.get(GlobalValidationPipe);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(validationPipe).toBeDefined();
    });

    it('should be instance of ValidationPipe', async () => {
        const validationError: ValidationError = {
            property: '',
        };
        await validationPipe
            .transform(validationError, {
                type: 'body',
                metatype: DetailedValidationError,
            })
            .catch((error: ValidationError) => {
                expect(error).toBeInstanceOf(DetailedValidationError);
            });
    });

    it('should throw DetailedValidation error on failure', async () => {
        const validationError: ValidationError = {
            property: '',
        };

        await expect(
            validationPipe.transform(validationError, {
                type: 'body',
                metatype: DetailedValidationError,
            }),
        ).rejects.toThrow(DetailedValidationError);
    });
});
