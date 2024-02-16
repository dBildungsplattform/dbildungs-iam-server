import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class Referenzgruppen {
    @IsString()
    @ApiProperty({ required: true })
    public id!: string;

    // Gruppenrollen aus der  Gruppenzugehörigkeit von Personen.
    @IsArray()
    @IsOptional()
    @ApiProperty({ type: [String], required: false })
    public rollen!: string[];

    public constructor(props: Readonly<Referenzgruppen>) {
        Object.assign(this, props);
    }
}
