import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';

export class LoeschungDto {
    @AutoMap(() => Date)
    @ApiProperty()
    public readonly zeitpunkt!: Date;
}
