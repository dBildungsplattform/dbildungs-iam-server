import { EmailUpdateInProgressError } from './email-update-in-progress.error';

describe('EmailUpdateInProgressError', () => {
    describe('constructor', () => {
        describe('when calling the constructor without providing domain', () => {
            it('should set notice that domain was not provided', () => {
                const error: EmailUpdateInProgressError = new EmailUpdateInProgressError(
                    'E-Mail is already being updated',
                );
                expect(error.message).toBe('E-Mail is already being updated');
                expect(error.code).toBe('UPDATE_IN_PROGRESS');
            });
        });
    });
});
