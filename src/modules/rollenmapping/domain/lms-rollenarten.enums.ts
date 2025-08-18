export enum SchulcloudRollenArt {
    USER = 'user',
    STUDENT = 'student',
    TEACHER = 'teacher',
    ADMIN = 'admin',
    SUPERHERO = 'superhero',
}

export enum MoodleRollenArt {
    MANAGER = 'manager',
    COURSE_CREATOR = 'coursecreator',
    EDITING_TEACHER = 'editingteacher',
    TEACHER = 'teacher',
    STUDENT = 'student',
    GUEST = 'guest',
    USER = 'user',
    FRONTPAGE = 'frontpage',
    EDITING_TEACHER_SELF = 'editingteacher_self',
}

export type LmsRollenArt = SchulcloudRollenArt | MoodleRollenArt;
