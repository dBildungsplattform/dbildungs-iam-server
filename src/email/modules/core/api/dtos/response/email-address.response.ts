import { ApiProperty } from '@nestjs/swagger';
import { EmailAddress } from '../../../domain/EmailAddress.js';
import { EmailAddressStatus } from '../../../persistence/email-address.entity.js';

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
    public status: EmailAddressStatus;

    @ApiProperty()
    public spshPersonId?: string;

    @ApiProperty()
    public oxUserId?: string;

    public constructor(emailAddress: EmailAddress<true>) {
        this.id = emailAddress.id;
        this.createdAt = emailAddress.createdAt;
        this.updatedAt = emailAddress.updatedAt;
        this.address = emailAddress.address;
        this.status = emailAddress.status;
        this.spshPersonId = emailAddress.spshPersonId;
        this.oxUserId = emailAddress.oxUserId ?? undefined;
    }
}
