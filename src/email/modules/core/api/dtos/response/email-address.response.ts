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

    @ApiProperty()
    public oxLoginId: string;
    public isPrimary: boolean;

    @ApiProperty({ required: false })
    public spshPersonId?: string;

    public constructor(emailAddress: EmailAddress<true>, latestStatus: EmailAddressStatusEnum, oxContextId: string) {
        this.id = emailAddress.id;
        this.createdAt = emailAddress.createdAt;
        this.updatedAt = emailAddress.updatedAt;
        this.address = emailAddress.address;
        this.status = latestStatus;
        this.oxLoginId = emailAddress.externalId + '@' + oxContextId;
        this.isPrimary = emailAddress.priority === 0;
        this.spshPersonId = emailAddress.spshPersonId;
    }
}
