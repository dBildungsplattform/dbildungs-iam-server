import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateRollenerweiterungBodyParams {
    @IsUUID()
    @ApiProperty()
    public organisationId!: string;

    @IsUUID()
    @ApiProperty()
    public rolleId!: string;

    @IsUUID()
    @ApiProperty()
    public serviceProviderId!: string;
}
