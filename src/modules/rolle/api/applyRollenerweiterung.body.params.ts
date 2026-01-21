import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ArrayNotEmpty } from 'class-validator';

export class ApplyRollenerweiterungBodyParams {
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    @ApiProperty({
        description: 'List of rolleIds to apply.',
        type: [String],
        required: true,
        example: ['rolleId1', 'rolleId2'],
    })
    public readonly addErweiterungenForRolleIds!: string[];

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    @ApiProperty({
        description: 'List of rolleIds to apply.',
        type: [String],
        required: true,
        example: ['rolleId1', 'rolleId2'],
    })
    public readonly removeErweiterungenForRolleIds!: string[];
}
