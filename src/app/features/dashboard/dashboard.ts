import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
})
export class DashboardComponent {
  protected readonly placeholderCards = [
    { label: 'الدورة النشطة' },
    { label: 'عدد الحلقات' },
    { label: 'عدد الطلاب' },
  ];
}
