import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
    Jahrgangsstufe,
    JahrgangsstufeTypName,
    Personenstatus,
    PersonenstatusTypName,
} from '../../domain/personenkontext.enums.js';
import { AutoMap } from '@automapper/classes';

export class UpdatePersonenkontextBodyParams {
    @IsString()
    public id!: string;

    @AutoMap()
    @IsString()
    @IsOptional()
    @ApiProperty({ required: false, description: 'The new referrer of the personenkontext.' })
    public readonly referrer?: string;

    @AutoMap(() => String)
    @IsEnum(Personenstatus)
    @IsOptional()
    @ApiProperty({
        enum: Personenstatus,
        enumName: PersonenstatusTypName,
        required: false,
        description: 'The new personenstatus of the personenkontext.',
    })
    public readonly personenstatus?: Personenstatus;

    @AutoMap(() => String)
    @IsEnum(Jahrgangsstufe)
    @IsOptional()
    @ApiProperty({
        enum: Jahrgangsstufe,
        enumName: JahrgangsstufeTypName,
        required: false,
        description: 'The new jahrgangsstufe of the personenkontext.',
    })
    public readonly jahrgangsstufe?: Jahrgangsstufe;

    @AutoMap()
    @IsString()
    @ApiProperty({ required: true, description: 'The revision of the personenkontext.' })
    public readonly revision!: string;
}
