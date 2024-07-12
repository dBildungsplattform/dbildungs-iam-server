import { PersonenkontextCommitError } from './personenkontext-commit.error.js';

describe('PersonenkontextCommitError', () => {
    it('should create an error with the correct message and code', () => {
        const message: string = 'An error occurred';
        const error: PersonenkontextCommitError = new PersonenkontextCommitError(message);

        expect(error).toBeInstanceOf(PersonenkontextCommitError);
        expect(error.message).toBe(message);
        expect(error.code).toBe('PERSONENKONTEXT_COULD_NOT_BE_COMMITED');
        expect(error.details).toBeUndefined();
    });

    it('should create an error with details as an array', () => {
        const message: string = 'An error occurred';
        const details: {
            key: string;
        }[] = [{ key: 'value' }];
        const error: PersonenkontextCommitError = new PersonenkontextCommitError(message, details);

        expect(error).toBeInstanceOf(PersonenkontextCommitError);
        expect(error.message).toBe(message);
        expect(error.code).toBe('PERSONENKONTEXT_COULD_NOT_BE_COMMITED');
        expect(error.details).toEqual(details);
    });
});
