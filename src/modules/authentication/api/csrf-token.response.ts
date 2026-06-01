import { ApiProperty } from '@nestjs/swagger';

export class CsrfTokenResponse {
    @ApiProperty({
        description: 'The CSRF token to include in X-CSRF-Token header',
        example: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    })
    public readonly csrfToken: string;

    public constructor(csrfToken: string) {
        this.csrfToken = csrfToken;
    }
}
