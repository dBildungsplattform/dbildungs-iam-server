import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { extractStepUpLevelFromJWT, StepUpLevel } from '../passport/oidc.strategy.js';
import { RequiredStepUpLevelNotMetError } from '../domain/required-step-up-level-not-met.error.js';

@Injectable()
export class StepUpGuard implements CanActivate {
    public canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request: Request = context.switchToHttp().getRequest();
        let stepUpLevel: StepUpLevel | undefined = request.passportUser?.stepUpLevel;

        if (!stepUpLevel) {
            const accessToken: string | undefined = request.passportUser?.access_token;
            if (accessToken) {
                const extractedACR: string = extractStepUpLevelFromJWT(accessToken);
                stepUpLevel = Object.values(StepUpLevel).includes(extractedACR as StepUpLevel)
                    ? (extractedACR as StepUpLevel)
                    : undefined;
            }
        }

        if (!stepUpLevel || stepUpLevel !== StepUpLevel.GOLD) {
            throw new RequiredStepUpLevelNotMetError();
        }
        return true;
    }
}
