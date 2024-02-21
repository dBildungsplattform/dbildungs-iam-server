import { DateTimeType } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

export class Laufzeit {
    @ApiProperty({ type: DateTimeType, required: false })
    public von?: Date;

    // @ApiProperty({ required: false })
    // public vonLernperiode!: string;

    @ApiProperty({ type: DateTimeType, required: false })
    public bis?: Date;

    // @ApiProperty({ required: false })
    // public bisLernperiode!: string;

    public constructor(props: Readonly<Laufzeit>) {
        Object.assign(this, props);
    }
}
