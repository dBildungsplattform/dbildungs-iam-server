import { Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class Referenzgruppen {
    @IsString()
    @ApiProperty({ required: true })
    @Property({ nullable: false })
    public id!: string;

    // Gruppenrollen aus der  Gruppenzugehörigkeit von Personen.
    @IsOptional()
    @IsArray()
    @ApiProperty({ type: [String], required: false })
    @Property({ nullable: true })
    public rollen?: string[];

    public constructor(props: Readonly<Referenzgruppen>) {
        Object.assign(this, props);
    }
}
