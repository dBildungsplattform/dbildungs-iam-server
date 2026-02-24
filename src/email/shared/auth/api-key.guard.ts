import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    public canActivate(context: ExecutionContext): boolean {
        const req: Request = context.switchToHttp().getRequest<Request>();
        const apiKey: string | string[] | undefined = req.headers['x-api-key'];

        if (!apiKey || apiKey !== '') {
            throw new UnauthorizedException('Invalid API key');
        }
        return true;
    }
}
