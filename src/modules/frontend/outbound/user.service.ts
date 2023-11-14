import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';
import { BackendHttpService } from './backend-http.service.js';

export interface ResetPasswordResponse {
    ok: boolean;
    value: string;
}

@Injectable()
export class UserService {
    public constructor(private httpService: BackendHttpService) {}

    public isResetPasswordResponse(obj: unknown): obj is ResetPasswordResponse {
        return (obj as ResetPasswordResponse)?.ok == true && (obj as ResetPasswordResponse)?.value.length == 10;
    }

    public resetPasswordForUserByUserId(userId: string): Observable<AxiosResponse<ResetPasswordResponse>> {
        return this.httpService.patch<ResetPasswordResponse>(`/api/person/${userId}/password`, {});
    }
}
