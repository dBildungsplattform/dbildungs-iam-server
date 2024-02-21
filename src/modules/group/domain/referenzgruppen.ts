import { Embeddable, Enum, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { Gruppenrollen } from './gruppe.enums.js';

@Embeddable()
export class Referenzgruppen {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ required: true })
    @Property({ nullable: false })
    public id!: string;

    // Gruppenrollen aus der  Gruppenzugehörigkeit von Personen.
    @IsArray()
    @ApiProperty({ enum: Gruppenrollen, nullable: true, isArray: true })
    @Enum({ items: () => Gruppenrollen, nullable: true, array: true })
    public rollen?: Gruppenrollen[];

    public constructor(props: Readonly<Referenzgruppen>) {
        Object.assign(this, props);
    }
}
