import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UserParams {
    @AutoMap()
    @IsString()
    @ApiProperty({ name: 'username', required: true })
    public readonly username!: string;

    @AutoMap()
    @IsString()
    @ApiProperty({ name: 'password', required: true })
    public readonly password!: string;

}
