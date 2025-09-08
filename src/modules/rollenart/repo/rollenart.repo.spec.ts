import { RollenartRepo } from './rollenart.repo.js';
import { SchulcloudRollenArt, MoodleRollenArt } from '../../rollenmapping/domain/lms-rollenarten.enums.js';
import { Test, TestingModule } from '@nestjs/testing';

describe('RollenartRepo', () => {
    let sut: RollenartRepo;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({ providers: [RollenartRepo] }).compile();

        sut = module.get(RollenartRepo);
    });

    describe('getAllRollenarten', () => {
        it('should return all rollenarten from both enums', () => {
            const result: string[] = sut.getAllRollenarten();
            expect(result).toContain('user');
            expect(result).toContain('editingteacher');
        });

        it('should return an array containing all SchulcloudRollenArt values', () => {
            const result: string[] = sut.getAllRollenarten();
            expect(result).toContain('teacher');
            expect(result).toContain('admin');
        });

        it('should return an array containing all MoodleRollenArt values', () => {
            const result: string[] = sut.getAllRollenarten();
            expect(result).toContain('user');
            expect(result).toContain('student');
        });

        it('should return an array with length equal to the sum of both enums', () => {
            const schulcloudLength: number = Object.values(SchulcloudRollenArt).length;
            const moodleLength: number = Object.values(MoodleRollenArt).length;
            const result: string[] = sut.getAllRollenarten();
            expect(result).toHaveLength(schulcloudLength + moodleLength);
        });
    });
});
