import { KlasseWithoutNumberOrLetterError } from './klasse-without-number-or-letter.error.js';

describe('KlasseWithoutNumberOrLetterError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: KlasseWithoutNumberOrLetterError = new KlasseWithoutNumberOrLetterError();
                expect(error.message).toBe(
                    `Organisation could not be created/updated because the name doesn't contain at least a letter or number`,
                );
            });
        });
    });
});
