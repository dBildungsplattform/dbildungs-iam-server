import { ApiProperty } from '@nestjs/swagger';
import { EmailAddress } from '../../../modules/email/domain/email-address.js';

export class EmailAddressResponse {
    @ApiProperty()
    public id: string;

    @ApiProperty()
    public createdAt: Date;

    @ApiProperty()
    public updatedAt: Date;

    @ApiProperty()
    public address: string;

    @ApiProperty()
    public status: string;

    @ApiProperty()
    public personId?: string;

    @ApiProperty()
    public oxUserId?: string;

    public constructor(emailAddress: EmailAddress<true>) {
        this.id = emailAddress.id;
        this.createdAt = emailAddress.createdAt;
        this.updatedAt = emailAddress.updatedAt;
        this.address = emailAddress.address;
        this.status = emailAddress.status;
        this.personId = emailAddress.personId;
        this.oxUserId = emailAddress.oxUserID ?? undefined;
    }
}
