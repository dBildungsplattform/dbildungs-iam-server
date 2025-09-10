import { ApiProperty } from '@nestjs/swagger';
import { RollenSystemRecht, RollenSystemRechtEnum, RollenSystemRechtEnumName } from '../domain/systemrecht.js';

export class SystemRechtResponse {
    public constructor(systemRecht: RollenSystemRecht) {
        this.name = systemRecht.name;
        this.isTechnical = systemRecht.technical;
    }

    @ApiProperty({
        description: 'The unique identifier of the system right',
        example: 'ROLLEN_VERWALTEN',
        enum: RollenSystemRechtEnum,
        enumName: RollenSystemRechtEnumName,
    })
    public name: RollenSystemRechtEnum;

    @ApiProperty({
        description: 'Indicates if the system right is an internal right',
    })
    public isTechnical: boolean;
}
