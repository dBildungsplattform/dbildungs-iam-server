import { ApiProperty } from '@nestjs/swagger';

export class TokenRequiredResponse {
    @ApiProperty()
    public required: boolean;

    public constructor(required: boolean) {
        this.required = required;
    }
}
