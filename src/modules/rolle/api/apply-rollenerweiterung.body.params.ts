import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ApplyRollenerweiterungBodyParams {
    @IsArray()
    @IsString({ each: true })
    @ApiProperty({
        description: 'List of rolleIds to apply.',
        type: [String],
        required: true,
        example: ['rolleId1', 'rolleId2'],
    })
    public readonly addErweiterungenForRolleIds!: string[];

    @IsArray()
    @IsString({ each: true })
    @ApiProperty({
        description: 'List of rolleIds to apply.',
        type: [String],
        required: true,
        example: ['rolleId1', 'rolleId2'],
    })
    public readonly removeErweiterungenForRolleIds!: string[];
}
