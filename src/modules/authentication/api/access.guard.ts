import { ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

export const DISABLE_ACCESS_GUARD_FLAG = 'disableAccessGuard';

@Injectable()
export class AccessGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    public override canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        if (this.reflector.get<boolean>(DISABLE_ACCESS_GUARD_FLAG, context.getHandler())) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();

        if (request.isAuthenticated()) {
            return true;
        } else {
            return super.canActivate(context);
        }
    }
}
