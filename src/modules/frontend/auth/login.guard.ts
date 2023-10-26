import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LoginGuard extends AuthGuard('oidc') {
    public override async canActivate(context: ExecutionContext): Promise<boolean> {
        const result: boolean = (await super.canActivate(context)) as boolean;

        await super.logIn(context.switchToHttp().getRequest());

        return result;
    }
}
