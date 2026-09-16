import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { JwtClaims } from '../../core/auth/jwt.helpers';
import { LoginFormModel, toLoginRequest } from './dto/login-form.model';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly auth = inject(AuthService);

  login(form: LoginFormModel): Observable<JwtClaims> {
    const request = toLoginRequest(form);
    return this.auth.login(request.email, request.password);
  }
}
