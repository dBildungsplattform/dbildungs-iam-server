import { ApiProperty } from '@nestjs/swagger';

export class UserExeternalDataResponseVidis {
    @ApiProperty({ type: [String] })
    public dienststellenNummern: string[];

    public constructor(dienststellenNummern: string[]) {
        this.dienststellenNummern = dienststellenNummern;
    }
}
