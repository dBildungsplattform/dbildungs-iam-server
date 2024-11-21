import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class MetricsGuard extends AuthGuard() {
    private readonly validUsername: string = 'admin';

    private readonly validPassword: string = 'admin';

    public override canActivate(context: ExecutionContext): boolean {
        const request: Request = context.switchToHttp().getRequest<Request>();
        const authHeader: string | undefined = request.headers.authorization;

        if (!authHeader?.startsWith('Basic ')) {
            return false;
        }

        const base64Credentials: string | undefined = authHeader.split(' ')[1];
        if (!base64Credentials) {
            return false;
        }
        const credentials: string = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [username, password]: string[] = credentials.split(':');

        if (username !== this.validUsername || password !== this.validPassword) {
            return false;
        }

        return true;
    }
}
