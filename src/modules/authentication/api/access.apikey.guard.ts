import { ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

export const DISABLE_ACCESS_GUARD_FLAG: string = 'disableAccessGuard';

@Injectable()
export class AccessApiKeyGuard extends AuthGuard('api-key') {

    public override canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        console.log("canActivate")

        const request: Request = context.switchToHttp().getRequest<Request>();

        if (request.isAuthenticated()) {
            console.log("request.isAuthenticated")
            return true;
        } else {
            console.log("super.canActivate")
            return super.canActivate(context);
        }
    }
}
