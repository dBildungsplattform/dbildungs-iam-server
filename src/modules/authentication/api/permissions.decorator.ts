import { createParamDecorator, ExecutionContext, PipeTransform, Type } from '@nestjs/common';
import { Request } from 'express';
import { PassportUser } from '../types/user.js';
import { PersonPermissions } from '../domain/person-permissions.js';

export const Permissions: (
    ...dataOrPipes: (Type<PipeTransform> | PipeTransform<unknown, unknown> | unknown[])[]
) => ParameterDecorator = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): Promise<PersonPermissions | undefined> => {
        const request: Request = ctx.switchToHttp().getRequest();
        const passportUser: PassportUser | undefined = request.passportUser;

        if (!passportUser) {
            return Promise.resolve(undefined);
        } else {
            return passportUser.personPermissions();
        }
    },
);
