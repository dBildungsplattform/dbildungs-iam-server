import { Test, TestingModule } from '@nestjs/testing';
import { GlobalValidationPipe } from './global-validation.pipe.js';
import { DetailedValidationError } from './detailed-validation.error.js';
import { ValidationError } from 'class-validator';

describe('GlobalValidationPipe', () => {
    let module: TestingModule;
    let sut: GlobalValidationPipe;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [GlobalValidationPipe],
        }).compile();
        sut = module.get(GlobalValidationPipe);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    it('should be instance of ValidationPipe', async () => {
        const validationError: ValidationError = {
            property: '',
        };
        await sut
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
            sut.transform(validationError, {
                type: 'body',
                metatype: DetailedValidationError,
            }),
        ).rejects.toThrow(DetailedValidationError);
    });
});
