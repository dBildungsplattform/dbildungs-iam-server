import { Embeddable, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

@Embeddable()
export class Laufzeit {
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    @ApiProperty({ required: false, nullable: true })
    @Property({ nullable: true })
    public readonly von?: Date;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false, nullable: true })
    @Property({ nullable: true })
    public readonly vonLernperiode?: string;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    @ApiProperty({ required: false, nullable: true })
    @Property({ nullable: true })
    public readonly bis?: Date;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false, nullable: true })
    @Property({ nullable: true })
    public readonly bisLernperiode?: string;

    public constructor(props: Readonly<Laufzeit>) {
        Object.assign(this, props);
    }
}
