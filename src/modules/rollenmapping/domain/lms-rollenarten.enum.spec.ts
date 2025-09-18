import { SchulcloudRollenArt, MoodleRollenArt } from './lms-rollenarten.enums.js';

describe('Lms RollenArten Enums', () => {
    describe('SchulcloudRollenArt Enum', () => {
        it('should have correct values', () => {
            expect(SchulcloudRollenArt.USER).toBe('user');
            expect(SchulcloudRollenArt.STUDENT).toBe('student');
            expect(SchulcloudRollenArt.TEACHER).toBe('teacher');
            expect(SchulcloudRollenArt.ADMIN).toBe('admin');
            expect(SchulcloudRollenArt.SUPERHERO).toBe('superhero');
        });
    });

    describe('MoodleRollenArt Enum', () => {
        it('should have correct values', () => {
            expect(MoodleRollenArt.MANAGER).toBe('manager');
            expect(MoodleRollenArt.COURSE_CREATOR).toBe('coursecreator');
            expect(MoodleRollenArt.EDITING_TEACHER).toBe('editingteacher');
            expect(MoodleRollenArt.TEACHER).toBe('teacher');
            expect(MoodleRollenArt.STUDENT).toBe('student');
            expect(MoodleRollenArt.GUEST).toBe('guest');
            expect(MoodleRollenArt.USER).toBe('user');
            expect(MoodleRollenArt.FRONTPAGE).toBe('frontpage');
            expect(MoodleRollenArt.EDITING_TEACHER_SELF).toBe('editingteacher_self');
        });
    });
});
