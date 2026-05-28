import { ApiProperty } from '@nestjs/swagger';

export class CsrfTokenResponse {
    @ApiProperty({
        description: 'The CSRF token to include in X-CSRF-Token header',
        example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
    })
    public readonly csrfToken: string;

    public constructor(csrfToken: string) {
        this.csrfToken = csrfToken;
    }
}
