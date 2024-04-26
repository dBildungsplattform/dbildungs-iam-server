import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { Volljaehrig } from '../domain/person.enums.js';

export class PersonBirthParams {
    @AutoMap(() => Date)
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    @ApiProperty({ required: false })
    public readonly datum?: Date;

    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly geburtsort?: string;

    @IsOptional()
    @IsEnum(Volljaehrig)
    @ApiProperty({ enum: Volljaehrig, nullable: true })
    public readonly volljaehrig?: Volljaehrig;

    public constructor(datum?: Date) {
        if (datum) {
            this.datum = datum;
            this.volljaehrig =
                new Date().getUTCMilliseconds() - datum.getUTCMilliseconds() >= 568024668000
                    ? Volljaehrig.JA
                    : Volljaehrig.NEIN;
        }
    }
}
