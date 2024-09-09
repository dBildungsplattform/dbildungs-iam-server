import { ApiProperty } from '@nestjs/swagger';
import { PrivacyIdeaToken } from './privacy-idea-api.types.js';

export class TokenStateResponse {
    @ApiProperty()
    public hasToken: boolean;

    @ApiProperty()
    public tokenKind: string;

    @ApiProperty()
    public serial: string;

    @ApiProperty()
    public required: boolean;

    public constructor(token: PrivacyIdeaToken | undefined, required: boolean) {
        if (token) {
            this.hasToken = true;
            this.tokenKind = token.info.tokenkind;
            this.serial = token.serial;
        } else {
            this.hasToken = false;
            this.tokenKind = '';
            this.serial = '';
        }
        this.required = required;
    }
}
