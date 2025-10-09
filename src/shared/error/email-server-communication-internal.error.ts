import { ApiProperty } from '@nestjs/swagger';

//Used for error communication between Email Module and Server Module

export type EmailServerCommunicationInternalErrorCode =
    | 'UNKNOWN_ERROR'
    | 'EMAIL_DOMAIN_NOT_FOUND'
    | 'EMAIL_ADDRESS_NOT_FOUND'
    | 'EMAIL_ADDRESS_GENERATION_ATTEMPTS_EXCEEDED';

export type EmailErrorProps = {
    code: number;
    emailErrorCode: EmailServerCommunicationInternalErrorCode;
};

export class EmailServerCommunicationInternalError {
    public constructor(props: EmailErrorProps) {
        Object.assign(this, props);
    }

    @ApiProperty({
        description: 'A specific error code for the email module, which the server module also understands',
    })
    public readonly emailErrorCode!: EmailServerCommunicationInternalErrorCode;

    @ApiProperty({ description: 'Corresponds to HTTP Status code like 200, 404, 500' })
    public readonly code!: number;
}
