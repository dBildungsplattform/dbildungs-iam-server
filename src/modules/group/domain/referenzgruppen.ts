import { Embeddable, EnumArrayType, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Gruppenrollen } from './gruppe.enums.js';

@Embeddable()
export class Referenzgruppen {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ required: true })
    @Property({ nullable: false })
    public id!: string;

    @IsArray()
    @IsEnum(Gruppenrollen, { each: true })
    @ApiProperty({ enum: Gruppenrollen, nullable: true, isArray: true })
    @Property({ type: EnumArrayType<Gruppenrollen>, nullable: true })
    public rollen?: Gruppenrollen[];

    public constructor(props: Readonly<Referenzgruppen>) {
        Object.assign(this, props);
    }
}
