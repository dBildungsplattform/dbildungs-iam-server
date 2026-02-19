/* v8 ignore file @preserv */
// it is not possible to instantiate an abstract class directly, so this file can not be covered by v8
import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class LoggerService {
    public abstract trace(message: string): void;

    public abstract debug(message: string): void;

    public abstract log(message: string): void;

    public abstract info(message: string): void;

    public abstract warn(message: string): void;

    public abstract error(message: string): void;
}
