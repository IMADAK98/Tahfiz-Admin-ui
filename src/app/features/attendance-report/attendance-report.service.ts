import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AttendanceApiService } from '../../core/api/attendance-api.service';
import {
  ALL_ACTIVE_HALAQAT,
  ALL_ACTIVE_HALAQAT_LABEL,
  HalqaFilterOption,
} from './dto/attendance-report-filters.dto';
import {
  CenterWeeklyTable,
  HalqaDropdownItem,
  normalizeCenterWeeklyTable,
  withAllActiveHalqaOption,
} from './dto/center-weekly-table.mapper';

/**
 * Thin UI orchestration — HttpClient stays in core/api.
 * «كل الحلقات النشطة» omits `halqaId` and sends the selected termId.
 * The grid is the server payload. Membership follows term status on the server.
 * This client does not add a membership query and does not drop rows.
 */
@Injectable({ providedIn: 'root' })
export class AttendanceReportService {
  private readonly attendanceApi = inject(AttendanceApiService);

  loadHalqaFilterOptions(
    termId: number,
    allLabel: string = ALL_ACTIVE_HALAQAT_LABEL,
  ): Observable<HalqaFilterOption[]> {
    return this.attendanceApi.getHalqasByTerm(termId).pipe(
      map((list) => withAllActiveHalqaOption(readTermHalqas(list), allLabel)),
    );
  }

  loadCenterWeeklyTable(
    weekStartDate: string,
    halqaValue: string,
    termId?: number | null,
  ): Observable<CenterWeeklyTable> {
    const halqaId = halqaValue === ALL_ACTIVE_HALAQAT ? null : Number(halqaValue);
    return this.attendanceApi
      .getCenterWeeklyTable(weekStartDate, Number.isFinite(halqaId) ? halqaId : null, termId)
      .pipe(map((raw) => normalizeCenterWeeklyTable(raw)));
  }
}

function readTermHalqas(list: { id: number | string; name: string }[] | null | undefined): HalqaDropdownItem[] {
  return (list ?? []).flatMap((item) => {
    const id = Number(item.id);
    if (!Number.isInteger(id) || id <= 0 || !item.name) {
      return [];
    }
    return [{ id, name: item.name }];
  });
}
