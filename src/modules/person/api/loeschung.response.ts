import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';

export class LoeschungResponse {
    @AutoMap(() => Date)
    @ApiProperty({ type: Date })
    public readonly zeitpunkt: Date;

    public constructor(props: Readonly<LoeschungResponse>) {
        this.zeitpunkt = props.zeitpunkt;
    }
}
