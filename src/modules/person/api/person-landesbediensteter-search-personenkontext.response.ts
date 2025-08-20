import { ApiProperty } from '@nestjs/swagger';

export class PersonLandesbediensteterSearchPersonenkontextResponse {
    @ApiProperty({ type: String, required: true })
    public readonly rolleId: string;

    @ApiProperty({ type: String, required: true })
    public readonly rolleName: string;

    @ApiProperty({ type: String, required: true })
    public readonly organisationId: string;

    @ApiProperty({ type: String, required: true })
    public readonly organisationName: string;

    @ApiProperty({ type: String, required: true })
    public readonly organisationDstNr: string;

    public constructor(
        rolleId: string,
        rolleName: string,
        organisationId: string,
        organisationName: string,
        organisationDstNr: string,
    ) {
        this.rolleId = rolleId;
        this.rolleName = rolleName;
        this.organisationId = organisationId;
        this.organisationName = organisationName;
        this.organisationDstNr = organisationDstNr;
    }
}
