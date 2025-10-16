import { ApiProperty } from '@nestjs/swagger';
import { EmailAddress } from '../../../domain/email-address.js';
import { EmailAddressStatusEnum } from '../../../persistence/email-address-status.entity.js';

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
    public status: EmailAddressStatusEnum;

    @ApiProperty({ required: false })
    public spshPersonId?: string;

    @ApiProperty({ required: false })
    public oxUserId?: string;

    public constructor(emailAddress: EmailAddress<true>) {
        this.id = emailAddress.id;
        this.createdAt = emailAddress.createdAt;
        this.updatedAt = emailAddress.updatedAt;
        this.address = emailAddress.address;
        this.status = emailAddress.status!.status;
        this.spshPersonId = emailAddress.spshPersonId;
        this.oxUserId = emailAddress.oxUserId ?? undefined;
    }
}
