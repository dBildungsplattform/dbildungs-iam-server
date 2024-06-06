import { RoleAssignmentError } from './role-assignment.error.js';

describe('RoleAssignmentErrorError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: RoleAssignmentError = new RoleAssignmentError('message');

                expect(error.message).toBe('message');
                expect(error.code).toBe('ROLE_ASSIGNMENT_NOT_ALLOWED');
            });
        });
    });
});
