import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
    public canActivate(context: ExecutionContext): boolean {
        const request: Request = context.switchToHttp().getRequest<Request>();
        const isAuthenticated: boolean = request.isAuthenticated();

        if (!isAuthenticated) {
            throw new UnauthorizedException();
        }

        return isAuthenticated;
    }
}
