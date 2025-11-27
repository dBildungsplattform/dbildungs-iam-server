import { ApiProperty } from '@nestjs/swagger';
import { EmailAddress } from '../../../domain/email-address.js';
import { EmailAddressStatus } from '../../../domain/email-address-status.js';
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

    @ApiProperty({ required: false })
    public spshPersonId?: string;

    public constructor(emailAddress: EmailAddress<true>, latestStatus: EmailAddressStatus<true>, oxContextId: string) {
        this.id = emailAddress.id;
        this.createdAt = emailAddress.createdAt;
        this.updatedAt = emailAddress.updatedAt;
        this.address = emailAddress.address;
        this.status = latestStatus.status;
        this.oxLoginId = emailAddress.externalId + '@' + oxContextId;
        this.spshPersonId = emailAddress.spshPersonId;
    }
}
