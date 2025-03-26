import { ApiProperty } from '@nestjs/swagger';
import { MeldungStatus } from '../persistence/meldung.entity.js';
import { Meldung } from '../domain/meldung.js';

export class MeldungResponse {
    @ApiProperty()
    public id: string;

    @ApiProperty()
    public createdAt: Date;

    @ApiProperty()
    public updatedAt: Date;

    @ApiProperty()
    public inhalt: string;

    @ApiProperty({ enum: MeldungStatus })
    public status: MeldungStatus;

    @ApiProperty()
    public revision: number;

    public constructor(meldung: Meldung<true>) {
        this.id = meldung.id;
        this.createdAt = meldung.createdAt;
        this.updatedAt = meldung.updatedAt;
        this.inhalt = meldung.inhalt;
        this.status = meldung.status;
        this.revision = meldung.revision;
    }
}
