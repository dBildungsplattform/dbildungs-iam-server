import { Test, TestingModule } from '@nestjs/testing';
import { GlobalValidationPipe } from './global-validation.pipe.js';
import { DetailedValidationError } from './detailed-validation.error.js';
import { CreatePersonBodyParams } from '../../modules/person/api/create-person.body.params.js';
import { PersonNameParams } from '../../modules/person/api/person-name.params.js';
import { CreatePersonDto } from '../../modules/person/api/create-person.dto.js';

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

    it('should throw DetailedValidation error on failure', () => {
        const person: CreatePersonBodyParams = {
            email: 'testgmail.com',
            mandant: '',
            name: new PersonNameParams(),
        };

        return validationPipe
            .transform(person, {
                type: 'body',
                metatype: CreatePersonDto,
            })
            .then(() => fail('should have thrown DetailedValidationError'))
            .catch((error: Error) => {
                expect(error.name).toBe(DetailedValidationError.name);
            });
    });
});
