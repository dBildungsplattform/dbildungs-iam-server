import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { StepUpLevel } from '../passport/oidc.strategy.js';
import { RequiredStepUpLevelNotMetError } from '../domain/required-step-up-level-not-met.error.js';

@Injectable()
export class StepUpGuard implements CanActivate {
    public canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request: Request = context.switchToHttp().getRequest();
        const stepUpLevel: StepUpLevel | undefined = request.passportUser?.stepUpLevel;

        if (!stepUpLevel || stepUpLevel !== StepUpLevel.GOLD) {
            throw new RequiredStepUpLevelNotMetError();
        }
        return true;
    }
}
