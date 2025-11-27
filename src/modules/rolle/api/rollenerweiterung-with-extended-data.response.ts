import { ApiProperty } from '@nestjs/swagger';
import { RollenerweiterungResponse } from './rollenerweiterung.response';
import { Rollenerweiterung } from '../domain/rollenerweiterung';

export class RollenerweiterungWithExtendedDataResponse extends RollenerweiterungResponse {
    public constructor(rollenerweiterung: Rollenerweiterung<true>, rolleName: string, serviceProviderName: string) {
        super(rollenerweiterung);
        this.rolleName = rolleName;
        this.serviceProviderName = serviceProviderName;
    }

    @ApiProperty()
    public rolleName: string;

    @ApiProperty()
    public serviceProviderName: string;
}
