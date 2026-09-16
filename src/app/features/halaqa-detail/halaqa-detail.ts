import { NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { ApiError } from '../../core/api/api-error';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { TOAST_I18N } from '../../core/ui/toast-messages';
import { halqaCategoryLabel, halqaPeriodsLabel } from '../halaqat/enums';
import { AssignPlanStudentsModalComponent } from './assign-plan-students-modal/assign-plan-students-modal';
import { CreatePlanModalComponent } from './create-plan-modal/create-plan-modal';
import {
  HalaqaDetailViewModel,
  HalaqaStudentViewModel,
  StudyPlanItemViewModel,
  StudyPlanViewModel,
  personInitial,
} from './dto';
import { EditHalaqaModalComponent } from './edit-halaqa-modal/edit-halaqa-modal';
import { EditPlanItemModalComponent } from './edit-plan-item-modal/edit-plan-item-modal';
import { EditPlanNameModalComponent } from './edit-plan-name-modal/edit-plan-name-modal';
import { EnrollStudentsModalComponent } from './enroll-students-modal/enroll-students-modal';
import { HalaqaDetailLoadState, HalaqaDetailTab, studyPlanItemTypeBadgeClass } from './enums';
import { HalaqaDetailService } from './halaqa-detail.service';

@Component({
  selector: 'app-halaqa-detail',
  imports: [
    NgClass,
    RouterLink,
    EditHalaqaModalComponent,
    EnrollStudentsModalComponent,
    CreatePlanModalComponent,
    EditPlanNameModalComponent,
    EditPlanItemModalComponent,
    AssignPlanStudentsModalComponent,
  ],
  templateUrl: './halaqa-detail.html',
})
export class HalaqaDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly detailService = inject(HalaqaDetailService);
  private readonly toastMessage = inject(ToastMessageService);

  protected readonly HalaqaDetailLoadState = HalaqaDetailLoadState;
  protected readonly HalaqaDetailTab = HalaqaDetailTab;
  protected readonly halqaCategoryLabel = halqaCategoryLabel;
  protected readonly halqaPeriodsLabel = halqaPeriodsLabel;
  protected readonly personInitial = personInitial;
  protected readonly studyPlanItemTypeBadgeClass = studyPlanItemTypeBadgeClass;

  protected readonly halaqaId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')) || 0)),
    { initialValue: 0 },
  );

  protected readonly loadState = signal(HalaqaDetailLoadState.Loading);
  protected readonly loadError = signal<string | null>(null);
  protected readonly detail = signal<HalaqaDetailViewModel | null>(null);
  protected readonly students = signal<HalaqaStudentViewModel[]>([]);
  protected readonly plans = signal<StudyPlanViewModel[]>([]);
  protected readonly activeTab = signal(HalaqaDetailTab.Students);
  protected readonly expandedPlanIds = signal<Set<number>>(new Set());

  protected readonly showEditModal = signal(false);
  protected readonly showEnrollModal = signal(false);
  protected readonly showCreatePlanModal = signal(false);
  protected readonly showEditPlanNameModal = signal(false);
  protected readonly showEditPlanItemModal = signal(false);
  protected readonly showAssignStudentsModal = signal(false);
  protected readonly showUnenrollModal = signal(false);
  protected readonly showDeleteHalqaModal = signal(false);
  protected readonly showUnassignPlanModal = signal(false);
  protected readonly showDeletePlanModal = signal(false);

  protected readonly selectedPlan = signal<StudyPlanViewModel | null>(null);
  protected readonly selectedPlanItem = signal<StudyPlanItemViewModel | null>(null);
  protected readonly selectedStudent = signal<HalaqaStudentViewModel | null>(null);
  protected readonly deletingHalqa = signal(false);
  protected readonly unenrolling = signal(false);
  protected readonly unassigning = signal(false);
  protected readonly deletingPlan = signal(false);
  protected readonly confirmError = signal<string | null>(null);

  protected readonly studentsCountLabel = computed(() => {
    const detail = this.detail();
    const count = this.students().length;
    const total = detail?.studentLimit ?? 0;
    return `${count} / ${total}`;
  });

  constructor() {
    this.reload();
  }

  protected reload(): void {
    const halqaId = this.halaqaId();
    if (!halqaId) {
      this.loadState.set(HalaqaDetailLoadState.Error);
      this.loadError.set('');
      return;
    }

    this.loadState.set(HalaqaDetailLoadState.Loading);
    this.loadError.set(null);

    this.detailService.loadPage(halqaId).subscribe({
      next: ({ detail, students, plans }) => {
        this.detail.set(detail);
        this.students.set(students);
        this.plans.set(plans);
        this.expandedPlanIds.set(new Set(plans.map((plan) => plan.id)));
        this.loadState.set(HalaqaDetailLoadState.Ready);
      },
      error: (error: unknown) => {
        this.loadState.set(HalaqaDetailLoadState.Error);
        this.loadError.set(error instanceof ApiError ? error.message : '');
      },
    });
  }

  protected setTab(tab: HalaqaDetailTab): void {
    this.activeTab.set(tab);
  }

  protected isPlanExpanded(planId: number): boolean {
    return this.expandedPlanIds().has(planId);
  }

  protected togglePlanItems(planId: number): void {
    this.expandedPlanIds.update((current) => {
      const next = new Set(current);
      if (next.has(planId)) {
        next.delete(planId);
      } else {
        next.add(planId);
      }
      return next;
    });
  }

  protected openEditModal(): void {
    this.showEditModal.set(true);
  }

  protected closeEditModal(): void {
    this.showEditModal.set(false);
  }

  protected onHalqaSaved(updated: HalaqaDetailViewModel): void {
    this.detail.set(updated);
    this.showEditModal.set(false);
  }

  protected openEnrollModal(): void {
    this.showEnrollModal.set(true);
  }

  protected closeEnrollModal(): void {
    this.showEnrollModal.set(false);
  }

  protected onStudentsEnrolled(): void {
    this.showEnrollModal.set(false);
    this.detailService.reloadStudents(this.halaqaId()).subscribe({
      next: (roster) => this.students.set(roster),
    });
  }

  protected openCreatePlanModal(): void {
    this.showCreatePlanModal.set(true);
  }

  protected closeCreatePlanModal(): void {
    this.showCreatePlanModal.set(false);
  }

  protected onPlanCreated(): void {
    this.showCreatePlanModal.set(false);
    this.refreshPlans();
  }

  protected openEditPlanName(plan: StudyPlanViewModel): void {
    this.selectedPlan.set(plan);
    this.showEditPlanNameModal.set(true);
  }

  protected closeEditPlanNameModal(): void {
    this.showEditPlanNameModal.set(false);
    this.selectedPlan.set(null);
  }

  protected onPlanNameSaved(): void {
    this.showEditPlanNameModal.set(false);
    this.selectedPlan.set(null);
    this.refreshPlans();
  }

  protected openEditPlanItem(plan: StudyPlanViewModel, item: StudyPlanItemViewModel): void {
    this.selectedPlan.set(plan);
    this.selectedPlanItem.set(item);
    this.showEditPlanItemModal.set(true);
  }

  protected closeEditPlanItemModal(): void {
    this.showEditPlanItemModal.set(false);
    this.selectedPlan.set(null);
    this.selectedPlanItem.set(null);
  }

  protected onPlanItemSaved(): void {
    this.showEditPlanItemModal.set(false);
    this.selectedPlan.set(null);
    this.selectedPlanItem.set(null);
    this.refreshPlans();
  }

  protected openAssignStudents(plan: StudyPlanViewModel): void {
    this.selectedPlan.set(plan);
    this.showAssignStudentsModal.set(true);
  }

  protected closeAssignStudentsModal(): void {
    this.showAssignStudentsModal.set(false);
    this.selectedPlan.set(null);
  }

  protected onStudentsAssigned(): void {
    this.showAssignStudentsModal.set(false);
    this.selectedPlan.set(null);
    this.refreshPlans();
  }

  protected openUnassignPlanStudent(plan: StudyPlanViewModel, student: HalaqaStudentViewModel): void {
    this.selectedPlan.set(plan);
    this.selectedStudent.set(student);
    this.confirmError.set(null);
    this.showUnassignPlanModal.set(true);
  }

  protected closeUnassignPlanModal(): void {
    this.showUnassignPlanModal.set(false);
    this.selectedPlan.set(null);
    this.selectedStudent.set(null);
    this.confirmError.set(null);
  }

  protected confirmUnassignFromPlan(): void {
    const plan = this.selectedPlan();
    const student = this.selectedStudent();
    if (!plan || !student) {
      return;
    }

    this.unassigning.set(true);
    this.confirmError.set(null);
    this.detailService.unassignStudentsFromPlan(plan.id, [student.id]).subscribe({
      next: () => {
        this.unassigning.set(false);
        this.showUnassignPlanModal.set(false);
        this.selectedPlan.set(null);
        this.selectedStudent.set(null);
        this.toastMessage.notifySuccess(TOAST_I18N.success.saved);
        this.refreshPlans();
      },
      error: (error: unknown) => {
        this.unassigning.set(false);
        this.confirmError.set(error instanceof ApiError ? error.message : '');
      },
    });
  }

  protected openDeletePlan(plan: StudyPlanViewModel): void {
    this.selectedPlan.set(plan);
    this.confirmError.set(null);
    this.showDeletePlanModal.set(true);
  }

  protected closeDeletePlanModal(): void {
    this.showDeletePlanModal.set(false);
    this.selectedPlan.set(null);
    this.confirmError.set(null);
  }

  protected confirmDeletePlan(): void {
    const plan = this.selectedPlan();
    if (!plan) {
      return;
    }

    this.deletingPlan.set(true);
    this.confirmError.set(null);
    this.detailService.deletePlan(plan.id).subscribe({
      next: () => {
        this.deletingPlan.set(false);
        this.showDeletePlanModal.set(false);
        this.selectedPlan.set(null);
        this.toastMessage.notifySuccess(TOAST_I18N.success.saved);
        this.refreshPlans();
      },
      error: (error: unknown) => {
        this.deletingPlan.set(false);
        this.confirmError.set(error instanceof ApiError ? error.message : '');
      },
    });
  }

  protected openUnenroll(student: HalaqaStudentViewModel): void {
    this.selectedStudent.set(student);
    this.confirmError.set(null);
    this.showUnenrollModal.set(true);
  }

  protected closeUnenrollModal(): void {
    this.showUnenrollModal.set(false);
    this.selectedStudent.set(null);
    this.confirmError.set(null);
  }

  protected confirmUnenroll(): void {
    const halqaId = this.halaqaId();
    const student = this.selectedStudent();
    if (!halqaId || !student) {
      return;
    }

    this.unenrolling.set(true);
    this.confirmError.set(null);
    this.detailService.unenrollStudent(halqaId, student.id).subscribe({
      next: () => {
        this.unenrolling.set(false);
        this.showUnenrollModal.set(false);
        this.selectedStudent.set(null);
        this.toastMessage.notifySuccess(TOAST_I18N.success.saved);
        this.detailService.reloadStudents(halqaId).subscribe({
          next: (roster) => this.students.set(roster),
        });
      },
      error: (error: unknown) => {
        this.unenrolling.set(false);
        this.confirmError.set(error instanceof ApiError ? error.message : '');
      },
    });
  }

  protected openDeleteHalqa(): void {
    this.confirmError.set(null);
    this.showDeleteHalqaModal.set(true);
  }

  protected closeDeleteHalqaModal(): void {
    this.showDeleteHalqaModal.set(false);
    this.confirmError.set(null);
  }

  protected confirmDeleteHalqa(): void {
    const halqaId = this.halaqaId();
    if (!halqaId) {
      return;
    }

    this.deletingHalqa.set(true);
    this.confirmError.set(null);
    this.detailService.deleteHalqa(halqaId).subscribe({
      next: () => {
        this.deletingHalqa.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.saved);
        void this.router.navigate(['/admin/halaqat']);
      },
      error: (error: unknown) => {
        this.deletingHalqa.set(false);
        this.confirmError.set(error instanceof ApiError ? error.message : '');
      },
    });
  }

  private refreshPlans(): void {
    const halqaId = this.halaqaId();
    if (!halqaId) {
      return;
    }

    this.detailService.reloadPlans(halqaId).subscribe({
      next: (plans) => this.plans.set(plans),
      error: () => {
        /* global interceptor surfaces load errors */
      },
    });
  }
}
