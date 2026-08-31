import { ApiProperty } from '@nestjs/swagger';
import { OrganisationsTyp } from '../domain/organisation.enums.js';
import { Organisation } from '../domain/organisation.js';

export class ParentInfoResponse {
    @ApiProperty()
    public readonly id!: string;

    @ApiProperty({ nullable: true })
    public readonly name?: string;

    @ApiProperty({ nullable: true })
    public readonly typ?: OrganisationsTyp;

    public constructor(organisation: Organisation<true>) {
        this.id = organisation.id;
        this.name = organisation.name;
        this.typ = organisation.typ;
    }
}
