import { RequiredStepUpLevelNotMetError } from './required-step-up-level-not-met.error.js';

describe('PersonalNummerForPersonWithTrailingSpaceError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: RequiredStepUpLevelNotMetError = new RequiredStepUpLevelNotMetError(undefined);
                expect(error.message).toBe(
                    'The action could not be perfomed, bequase the required step up level was not met',
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});
