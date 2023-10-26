import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
    public canActivate(context: ExecutionContext): boolean {
        const request: Request = context.switchToHttp().getRequest<Request>();
        return request.isAuthenticated();
    }
}
