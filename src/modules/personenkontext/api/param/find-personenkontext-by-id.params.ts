import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FindPersonenkontextByIdParams {
    @AutoMap()
    @IsUUID()
    @ApiProperty({
        description: 'The id for the personenkontext.',
        required: true,
        nullable: false,
    })
    public readonly personenkontextId!: string;

    public constructor(personenkontextId: string) {
        this.personenkontextId = personenkontextId;
    }
}
