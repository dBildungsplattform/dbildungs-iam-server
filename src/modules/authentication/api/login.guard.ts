import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ClassLogger } from '../../../core/logging/class-logger.js';

@Injectable()
export class LoginGuard extends AuthGuard(['jwt', 'oidc']) {
    constructor(private logger: ClassLogger) {
        super();
    }

    public override async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: Request = context.switchToHttp().getRequest<Request>();
        if (request.query['redirectUrl']) {
            request.session.redirectUrl = request.query['redirectUrl'] as string;
        }
        if (request.isAuthenticated()) {
            return true;
        }

        try {
            if (!(await super.canActivate(context))) {
                return false;
            }
            await super.logIn(request);
        } catch (err) {
            this.logger.info(JSON.stringify(err));
            return false;
        }

        return request.isAuthenticated();
    }
}
