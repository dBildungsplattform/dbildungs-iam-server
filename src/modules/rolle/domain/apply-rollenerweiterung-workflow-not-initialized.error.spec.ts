import { ApplyRollenerweiterungWorkflowNotInitializedError } from './apply-rollenerweiterung-workflow-not-initialized.error.js';

describe('ApplyRollenerweiterungWorkflowNotInitializedError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: ApplyRollenerweiterungWorkflowNotInitializedError =
                    new ApplyRollenerweiterungWorkflowNotInitializedError({});
                expect(error.message).toBe(
                    "Rollenerweiterungen could not be applied, because workflow wasn't initialized",
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});
