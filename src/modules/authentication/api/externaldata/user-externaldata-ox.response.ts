import { ApiProperty } from '@nestjs/swagger';

interface OldParams {
    username: string;
    oxContextId: string;
}

interface NewParams {
    oxContextId: string;
}

export class UserExeternalDataResponseOx {
    @ApiProperty()
    public id: string;

    public constructor(params: OldParams | NewParams) {
        if ('username' in params) {
            this.id = `${params.username}@${params.oxContextId}`;
        } else {
            this.id = params.oxContextId;
        }
    }
}
