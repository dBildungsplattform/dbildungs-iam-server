import { ApiProperty } from '@nestjs/swagger';

interface OldParams {
    username: string;
    oxContext: string;
}

interface NewParams {
    contextId: string;
}

export class UserExeternalDataResponseOx {
    @ApiProperty()
    public id: string;

    public constructor(params: OldParams | NewParams) {
        if ('username' in params) {
            this.id = `${params.username}@${params.oxContext}`;
        } else {
            this.id = params.contextId;
        }
    }
}
