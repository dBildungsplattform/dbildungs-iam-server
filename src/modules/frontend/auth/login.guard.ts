import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class LoginGuard extends AuthGuard('oidc') {
    public override async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: Request = context.switchToHttp().getRequest<Request>();
        if (request.query['redirectUrl']) {
            request.session.redirectUrl = request.query['redirectUrl'] as string;
        }

        const result: boolean = (await super.canActivate(context)) as boolean;

        await super.logIn(context.switchToHttp().getRequest());

        return result;
    }
}
