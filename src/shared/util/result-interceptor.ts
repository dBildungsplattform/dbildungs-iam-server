import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { EntityNotFoundError } from '../error/index.js';

@Injectable()
export class ResultInterceptor<T> implements NestInterceptor<Result<T>, T> {
    public intercept(_context: ExecutionContext, next: CallHandler<Result<T>>): Observable<T> {
        return next.handle().pipe(
            map((data: Result<T>) => {
                if (data.ok) {
                    return data.value;
                }
                return this.switchOnError(data.error);
            }),
        );
    }

    private switchOnError(error: Error): T {
        if (error instanceof EntityNotFoundError) {
            throw new HttpException('Requested entity does not exist', HttpStatus.NOT_FOUND);
        }
        throw new HttpException('Internal server error.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
