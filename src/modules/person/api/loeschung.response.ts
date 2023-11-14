import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';

export class LoeschungResponse {
    @AutoMap(() => Date)
    @ApiProperty()
    public readonly zeitpunkt!: Date;
}
