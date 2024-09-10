import { PersonenkontextCommitError } from './personenkontext-commit.error.js';

describe('PersonenkontextCommitError', () => {
    it('should create an error with the correct message and code', () => {
        const error: PersonenkontextCommitError = new PersonenkontextCommitError();

        expect(error).toBeInstanceOf(PersonenkontextCommitError);
        expect(error.message).toBe('PERSONENKONTEXT_COULD_NOT_BE_COMMITED');
        expect(error.code).toBe('ENTITIES_COULD_NOT_BE_UPDATED');
        expect(error.details).toBeUndefined();
    });

    it('should create an error with details as an array', () => {
        const details: {
            key: string;
        }[] = [{ key: 'value' }];
        const error: PersonenkontextCommitError = new PersonenkontextCommitError(details);

        expect(error).toBeInstanceOf(PersonenkontextCommitError);
        expect(error.message).toBe('PERSONENKONTEXT_COULD_NOT_BE_COMMITED');
        expect(error.code).toBe('ENTITIES_COULD_NOT_BE_UPDATED');
        expect(error.details).toEqual(details);
    });
});
