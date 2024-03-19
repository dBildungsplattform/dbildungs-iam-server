import { Embeddable, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// TODO: should be converted to an entity an not used in tests.
@Embeddable()
export class Laufzeit {
    @Type(() => Date)
    @ApiProperty({ required: false, nullable: true })
    @Property({ nullable: true })
    public readonly von?: Date;

    @ApiProperty({ required: false, nullable: true })
    @Property({ nullable: true })
    // TODO: should refer to code property of a lernperiode entity.
    public readonly vonLernperiode?: string;

    @Type(() => Date)
    @ApiProperty({ required: false, nullable: true })
    @Property({ nullable: true })
    public readonly bis?: Date;

    @ApiProperty({ required: false, nullable: true })
    @Property({ nullable: true })
    // TODO: should refer to code property of a lernperiode entity.
    public readonly bisLernperiode?: string;

    public constructor(props: Readonly<Laufzeit>) {
        Object.assign(this, props);
    }
}
