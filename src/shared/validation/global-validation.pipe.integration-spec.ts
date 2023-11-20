import { TestingModule, Test } from '@nestjs/testing';
import { GlobalValidationPipe } from './global-validation.pipe.js';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../test/utils/index.js';
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
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    it('should be instance of ValidationPipe', async () => {
        await sut
            .transform(ValidationError, {
                type: 'body',
                metatype: ValidationError,
            })
            .catch((error: ValidationError) => {
                expect(error).toBeInstanceOf(DetailedValidationError);
            });
    });
});
