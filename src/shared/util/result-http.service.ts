import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '../error/index.js';

@Injectable()
export class ResultHttpService {
    public createHttpResponseFromResult<T>(result: Result<T>): T {
        if (result.ok) {
            return result.value;
        }
        if (result.error instanceof EntityNotFoundError) {
            throw new HttpException('Requested entity does not exist', HttpStatus.NOT_FOUND);
        }
        throw new HttpException('Internal server error.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
