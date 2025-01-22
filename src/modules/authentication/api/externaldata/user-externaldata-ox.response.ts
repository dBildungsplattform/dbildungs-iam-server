import { ApiProperty } from '@nestjs/swagger';

export class UserExeternalDataResponseOx {
    @ApiProperty()
    public id: string;

    public constructor(username: string, oxContext: string) {
        this.id = `${username}@${oxContext}`;
    }
}
