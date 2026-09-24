import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserApiService } from '../../core/api/user-api.service';
import { AdminProfileView, mapAdminProfile } from './dto';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly userApi = inject(UserApiService);

  load(userId: number): Observable<AdminProfileView> {
    return this.userApi.getById(userId).pipe(map(mapAdminProfile));
  }
}
