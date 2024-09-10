import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PersonByPersonalnummerBodyParams {
    @IsString()
    @ApiProperty({ required: true })
    public readonly personalnummer!: string;
}
