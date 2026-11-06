import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AttendanceApiService } from '../../core/api/attendance-api.service';
import { ALL_ACTIVE_HALAQAT, HalqaFilterOption } from './dto/attendance-report-filters.dto';
import {
  CenterWeeklyTable,
  normalizeCenterWeeklyTable,
  readHalqaDropdown,
  withAllActiveHalqaOption,
} from './dto/center-weekly-table.mapper';

/**
 * Thin UI orchestration — HttpClient stays in core/api.
 * «كل الحلقات النشطة» omits `halqaId`. That set matches `GET /halqa/dropdown`:
 * any active ḥalaqa, including one whose term is not active. No term filter here.
 */
@Injectable({ providedIn: 'root' })
export class AttendanceReportService {
  private readonly attendanceApi = inject(AttendanceApiService);

  loadHalqaFilterOptions(): Observable<HalqaFilterOption[]> {
    return this.attendanceApi.getHalqaDropdown().pipe(
      map((raw) => withAllActiveHalqaOption(readHalqaDropdown(raw))),
    );
  }

  loadCenterWeeklyTable(weekStartDate: string, halqaValue: string): Observable<CenterWeeklyTable> {
    const halqaId = halqaValue === ALL_ACTIVE_HALAQAT ? null : Number(halqaValue);
    return this.attendanceApi
      .getCenterWeeklyTable(weekStartDate, Number.isFinite(halqaId) ? halqaId : null)
      .pipe(map((raw) => normalizeCenterWeeklyTable(raw)));
  }
}
