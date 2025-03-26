import { HttpException, HttpStatus } from '@nestjs/common';

export class HttpFoundException extends HttpException {
    public constructor(message: string | Record<string, unknown>) {
        super(message, HttpStatus.FOUND);
    }
}
