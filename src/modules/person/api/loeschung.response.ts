import { ApiProperty } from '@nestjs/swagger';

export class LoeschungResponse {
    @ApiProperty({ type: Date })
    public zeitpunkt!: Date;

    public static new(props: Readonly<LoeschungResponse>): LoeschungResponse {
        const response: LoeschungResponse = new LoeschungResponse();

        response.zeitpunkt = props.zeitpunkt;

        return response;
    }
}
