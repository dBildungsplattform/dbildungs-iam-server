import { ItsLearningError } from '../../../shared/error/its-learning.error.js';
import { FailureStatusInfo, StatusInfo, SuccessStatusInfo } from '../actions/base-mass-action.js';
import { StatusInfoHelpers } from './status-info.utils.js';

function makeSuccessStatus(): SuccessStatusInfo {
    return {
        codeMajor: 'success',
        severity: 'status',
    };
}

function makeFailureStatus(description: string): FailureStatusInfo {
    return {
        codeMajor: 'failure',
        severity: 'error',
        codeMinor: {
            codeMinorField: [{ codeMinorName: 'error', codeMinorValue: 'error' }],
        },
        description: {
            language: 'en',
            text: description,
        },
    };
}

describe('StatusInfoHelpers', () => {
    describe('errorOnFailure', () => {
        it('should return undefined when there is no error status', () => {
            const status: StatusInfo[] = [makeSuccessStatus()];

            const result: ItsLearningError | undefined = StatusInfoHelpers.errorOnFailure(status);

            expect(result).toBeUndefined();
        });

        it('should return number of failure statuses as error', () => {
            const status: StatusInfo[] = [makeSuccessStatus(), makeFailureStatus('Some Error')];

            const result: ItsLearningError | undefined = StatusInfoHelpers.errorOnFailure(status);

            expect(result).toEqual(new ItsLearningError('1 of 2 Requests failed', [makeFailureStatus('Some Error')]));
        });
    });

    describe('failedStatus', () => {
        it('should only return the failure statuses', () => {
            const status: StatusInfo[] = [makeSuccessStatus(), makeFailureStatus('Some Error')];

            const result: FailureStatusInfo[] = StatusInfoHelpers.failedStatus(status);

            expect(result).toEqual([makeFailureStatus('Some Error')]);
        });
    });

    describe('zipFailed', () => {
        it('should only return the failure statuses with their corresponding input', () => {
            const inputs: string[] = ['will succeed', 'will error'];
            const status: StatusInfo[] = [makeSuccessStatus(), makeFailureStatus('Some Error')];

            const result: [FailureStatusInfo, string][] = StatusInfoHelpers.zipFailed(status, inputs);

            expect(result).toEqual([[makeFailureStatus('Some Error'), 'will error']]);
        });
    });
});
