import { RequiredStepUpLevelNotMetError } from './required-step-up-level-not-met.error.js';

describe('RequiredStepUpLevelNotMetError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: RequiredStepUpLevelNotMetError = new RequiredStepUpLevelNotMetError();
                expect(error.message).toBe(
                    'The action could not be perfomed, because the required step up level was not met',
                );
                expect(error.code).toBe('USER_COULD_NOT_BE_AUTHENTICATED');
            });
        });
    });
});
