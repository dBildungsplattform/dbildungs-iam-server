import { ApiProperty } from '@nestjs/swagger';
import { Rollenerweiterung } from '../domain/rollenerweiterung.js';

export class RollenerweiterungResponse {
    @ApiProperty()
    public id: string;

    @ApiProperty()
    public createdAt: Date;

    @ApiProperty()
    public updatedAt: Date;

    @ApiProperty()
    public organisationId: string;

    @ApiProperty()
    public rolleId: string;

    @ApiProperty()
    public serviceProviderId: string;

    public constructor(rollenerweiterung: Rollenerweiterung<true>) {
        this.id = rollenerweiterung.id;
        this.createdAt = rollenerweiterung.createdAt;
        this.updatedAt = rollenerweiterung.updatedAt;
        this.organisationId = rollenerweiterung.organisationId;
        this.rolleId = rollenerweiterung.rolleId;
        this.serviceProviderId = rollenerweiterung.serviceProviderId;
    }
}
