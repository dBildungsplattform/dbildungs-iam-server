import { ApiProperty } from '@nestjs/swagger';

export class AssignHardwareTokenResponse {
    @ApiProperty({ type: Number })
    public readonly id: number;

    @ApiProperty({ type: String })
    public readonly jsonrpc: string;

    @ApiProperty({ type: Number })
    public readonly time: number;

    @ApiProperty({ type: String })
    public readonly version: string;

    @ApiProperty({ type: String })
    public readonly versionnumber: string;

    @ApiProperty({ type: String })
    public readonly signature: string;

    @ApiProperty({ type: String })
    public readonly dialogText: string;

    public constructor(
        id: number,
        jsonrpc: string,
        time: number,
        version: string,
        versionnumber: string,
        signature: string,
        dialogText: string,
    ) {
        this.id = id;
        this.jsonrpc = jsonrpc;
        this.time = time;
        this.version = version;
        this.versionnumber = versionnumber;
        this.signature = signature;
        this.dialogText = dialogText;
    }
}
