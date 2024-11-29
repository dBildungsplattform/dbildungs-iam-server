export const ImportStatusName: string = 'ImportStatus';

export enum ImportStatus {
    STARTED = 'STARTED',
    VALID = 'VALID',
    INVALID = 'INVALID',
    INPROGRESS = 'INPROGRESS',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}
