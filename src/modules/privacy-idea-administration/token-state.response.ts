import { ApiProperty } from '@nestjs/swagger';
import { PrivacyIdeaToken } from './privacy-idea-api.types.js';

export class TokenStateResponse {
    @ApiProperty()
    public hasToken: boolean;

    @ApiProperty()
    public tokenKind: string;

    @ApiProperty()
    public tokenSerial: string;

    public constructor(token: PrivacyIdeaToken | undefined) {
        if (token) {
            this.hasToken = true;
            this.tokenKind = token.info.tokenkind;
            this.tokenSerial = token.serial;
        } else {
            this.hasToken = false;
            this.tokenKind = '';
            this.tokenSerial = '';
        }
    }
}
