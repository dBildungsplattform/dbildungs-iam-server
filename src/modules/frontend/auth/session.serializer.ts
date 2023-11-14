import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';

type DoneCallback<T> = (err: Error | null | undefined, value: T) => void;

@Injectable()
export class SessionSerializer extends PassportSerializer {
    public override serializeUser(user: unknown, done: DoneCallback<unknown>): void {
        done(null, user);
    }

    public override deserializeUser(payload: unknown, done: DoneCallback<unknown>): void {
        done(null, payload);
    }
}
