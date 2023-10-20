import { HttpService } from '@nestjs/axios';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';

import { SessionData } from './frontend.controller.js';

@Injectable()
export class AuthenticationInterceptor implements NestInterceptor {
    public constructor(private httpService: HttpService) {}

    public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const ctx: HttpArgumentsHost = context.switchToHttp();
        const session: SessionData = ctx.getRequest<FastifyRequest>().session as SessionData;

        const token: string | undefined = session.access_token;

        if (token) {
            this.httpService.axiosRef.defaults.headers.common.Authorization = `Bearer ${token}`;
        }

        return next.handle().pipe();
    }
}
