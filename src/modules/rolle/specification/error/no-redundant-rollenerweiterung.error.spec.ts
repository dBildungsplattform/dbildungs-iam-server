import { NoRedundantRollenerweiterungError } from './no-redundant-rollenerweiterung.error.js';

describe('NoRedundantRollenerweiterungError', () => {
    it('should create an error with the correct message', () => {
        const error: NoRedundantRollenerweiterungError = new NoRedundantRollenerweiterungError();
        expect(error.message).toBe(
            'The Rollenerweiterung is not possible, because the Rolle already has access to the ServiceProvider.',
        );
    });

    it('should allow additional details', () => {
        const details: Record<string, undefined> = { key: undefined };
        const error: NoRedundantRollenerweiterungError = new NoRedundantRollenerweiterungError(details);
        expect(error.details).toEqual(details);
    });
});
