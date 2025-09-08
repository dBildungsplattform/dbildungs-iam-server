import { Injectable } from '@nestjs/common';
import { SchulcloudRollenArt, MoodleRollenArt } from '../../rollenmapping/domain/lms-rollenarten.enums.js';

@Injectable()
export class RollenartRepo {
    public getAllRollenarten(): string[] {
        const schulcloudRollenArt: string[] = Object.values(SchulcloudRollenArt);
        const moodleRollenArt: string[] = Object.values(MoodleRollenArt);
        return [...schulcloudRollenArt, ...moodleRollenArt];
    }
}
