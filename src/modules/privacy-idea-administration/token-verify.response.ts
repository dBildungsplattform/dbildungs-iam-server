import { ApiProperty } from '@nestjs/swagger';
import { PrivacyIdeaToken } from './privacy-idea-api.types.js';

export class TokenVerifyResponse {
    @ApiProperty()
    public success: boolean;

    @ApiProperty()
    public tokenSerial: string;

    public constructor(token: PrivacyIdeaToken | undefined) {
        if (token) {
            this.success = true;
            this.tokenSerial = token.serial;
        } else {
            this.success = false;
            this.tokenSerial = '';
        }
    }
}
