import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink],
  template: `
    <section class="card max-w-xl w-full p-8 text-center flex flex-col gap-6">
      <div>
        <p class="badge badge-primary mb-4">نظام التحفيظ</p>
        <h1 class="text-2xl font-bold mb-3">مرحباً بكم في ثفيز</h1>
        <p class="text-muted" style="color: var(--color-muted)">
          منصة إدارة مراكز تحفيظ القرآن — تسجيل المراكز، الحلقات، المعلمين والطلاب.
        </p>
      </div>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <a routerLink="/login" class="btn btn-primary btn-lg">دخول الإدارة</a>
        <a routerLink="/admin" class="btn btn-secondary btn-lg">معاينة لوحة الإدارة</a>
      </div>
      <p class="text-sm" style="color: var(--color-muted)">
        تسجيل مركز جديد — قريباً من هذه الصفحة (CTA فقط في الإصدار الأول).
      </p>
    </section>
  `,
})
export class LandingPageComponent {}
