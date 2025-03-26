import { PersonenkontexteUpdateError } from './personenkontexte-update.error.js';
import { DomainError } from '../../../../shared/error/index.js';

describe('PersonenkontexteUpdateError', () => {
    it('should create an instance of PersonenkontexteUpdateError with message and details', () => {
        const message: string = 'An error occurred while updating Personenkontexte.';
        const error: PersonenkontexteUpdateError = new PersonenkontexteUpdateError(message);

        expect(error).toBeInstanceOf(PersonenkontexteUpdateError);
        expect(error).toBeInstanceOf(DomainError);
    });

    it('should create an instance of PersonenkontexteUpdateError with message only', () => {
        const message: string = 'An error occurred while updating Personenkontexte.';

        const error: PersonenkontexteUpdateError = new PersonenkontexteUpdateError(message);

        expect(error).toBeInstanceOf(PersonenkontexteUpdateError);
        expect(error).toBeInstanceOf(DomainError);
    });
});
