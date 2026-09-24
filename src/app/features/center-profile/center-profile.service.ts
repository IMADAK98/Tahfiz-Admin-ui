import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CenterApiService } from '../../core/api/center-api.service';
import { CenterProfileView, mapCenterProfile } from './dto';

@Injectable({ providedIn: 'root' })
export class CenterProfileService {
  private readonly centerApi = inject(CenterApiService);

  load(centerId: number): Observable<CenterProfileView> {
    return this.centerApi.getById(centerId).pipe(map(mapCenterProfile));
  }
}
