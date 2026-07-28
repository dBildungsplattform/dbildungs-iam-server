import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsArray } from 'class-validator';

export class ApplyRollenerweiterungChangesBodyParams {
    @IsUUID('all', { each: true })
    @IsArray()
    @ApiProperty({
        type: [String],
    })
    public addErweiterungenForServiceProviderIds!: string[];

    @IsUUID('all', { each: true })
    @IsArray()
    @ApiProperty({
        type: [String],
    })
    public removeErweiterungenForServiceProviderIds!: string[];
}
