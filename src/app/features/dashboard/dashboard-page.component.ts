import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-page',
  template: `
    <section class="flex flex-col gap-6">
      <header>
        <p class="badge badge-neutral mb-3">PR1 — هيكل فارغ</p>
        <h2 class="text-xl font-bold mb-2">لوحة التحكم</h2>
        <p style="color: var(--color-muted)">
          سيتم ربط مؤشرات الدورة النشطة والإحصائيات في PR4.
        </p>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        @for (card of placeholderCards; track card.label) {
          <article class="card p-5 flex flex-col gap-2">
            <span class="text-sm font-semibold" style="color: var(--color-muted)">{{ card.label }}</span>
            <span class="text-2xl font-bold">—</span>
          </article>
        }
      </div>
    </section>
  `,
})
export class DashboardPageComponent {
  protected readonly placeholderCards = [
    { label: 'الدورة النشطة' },
    { label: 'عدد الحلقات' },
    { label: 'عدد الطلاب' },
  ];
}
