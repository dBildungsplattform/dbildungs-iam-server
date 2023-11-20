import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserinfoResponse } from 'openid-client';

type UserDecoratorFactory = () => ParameterDecorator;

export type User = { id_token: string; access_token: string; userinfo: UserinfoResponse };

export const CurrentUser: UserDecoratorFactory = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest<Request>();

    return request.user;
});
