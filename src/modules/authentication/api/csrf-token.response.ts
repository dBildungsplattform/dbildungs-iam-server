import { ApiProperty } from '@nestjs/swagger';

export class CsrfTokenResponse {
    @ApiProperty({
        description: 'The CSRF token to include in X-CSRF-Token header',
        example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
    })
    public readonly csrfToken: string;

    @ApiProperty({
        description: 'Whether the user is authenticated',
        example: true,
    })
    public readonly authenticated: boolean;

    @ApiProperty({
        description: 'Timestamp when token was generated',
        example: 1672531200000,
    })
    public readonly timestamp: number;

    public constructor(csrfToken: string, authenticated: boolean, timestamp: number) {
        this.csrfToken = csrfToken;
        this.authenticated = authenticated;
        this.timestamp = timestamp;
    }
}
