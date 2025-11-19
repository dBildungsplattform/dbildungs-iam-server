import { ApiProperty } from '@nestjs/swagger';
import { EmailAddressStatus, EmailAddressStatusName } from '../../email/domain/email-address.js';

export class PersonEmailResponse {
    @ApiProperty({ enum: EmailAddressStatus, enumName: EmailAddressStatusName, required: true })
    public readonly status: EmailAddressStatus;

    @ApiProperty({ type: String, required: true })
    public readonly address: string;

    @ApiProperty({ type: String, required: false })
    public readonly oxLoginId?: string;

    public constructor(status: EmailAddressStatus, address: string, oxLoginId?: string) {
        this.status = status;
        this.address = address;
        this.oxLoginId = oxLoginId;
    }
}
