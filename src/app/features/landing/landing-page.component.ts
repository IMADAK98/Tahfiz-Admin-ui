import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CENTER_SIGNUP_URL } from '../../core/config/public-links';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink],
  template: `
    <section class="hero">
      <div>
        <span class="eyebrow">نظام التحفيظ لمراكز القرآن</span>
        <h1>أدِر حلقات التحفيظ بوضوح — من التسجيل حتى التقارير</h1>
        <div class="hero-ctas">
          <a routerLink="/login" class="btn btn-primary btn-lg">تسجيل الدخول</a>
          <a [href]="centerSignupUrl" class="btn btn-secondary btn-lg" title="نموذج تسجيل المركز">إنشاء حساب مركز</a>
        </div>
      </div>

      <aside class="hero-panel" aria-label="قدرات لوحة إدارة المركز">
        <h3>ماذا يرى مشرف المركز؟</h3>
        <ul class="mini-list">
          <li>
            <span class="check" aria-hidden="true">✓</span>
            <span>إنشاء الدورات وتحديد فترات التسجيل والإجازات</span>
          </li>
          <li>
            <span class="check" aria-hidden="true">✓</span>
            <span>موافقة طلبات المعلمين والطلاب في مكان واحد</span>
          </li>
          <li>
            <span class="check" aria-hidden="true">✓</span>
            <span>تقارير حضور وتقدّم جاهزة للمراجعة الأسبوعية</span>
          </li>
        </ul>
      </aside>
    </section>

    <section class="features" id="features">
      <div class="section-head">
        <h2>ما تحتاجه لإدارة المركز</h2>
        <p>إعداد الحلقات، تسجيل الطلاب وإدارتهم، ومتابعة الحضور والحفظ</p>
      </div>
      <div class="feature-grid">
        <article class="feature">
          <div class="feature-icon" aria-hidden="true">١</div>
          <h3>الحلقات والدورات</h3>
          <p>أنشئ الحلقات والدورات، وعيّن المعلمين والطلاب</p>
        </article>
        <article class="feature">
          <div class="feature-icon" aria-hidden="true">٢</div>
          <h3>طلبات الانضمام</h3>
          <p>وافق على طلبات الانضمام أو ارفضها</p>
        </article>
        <article class="feature">
          <div class="feature-icon" aria-hidden="true">٣</div>
          <h3>الحضور والتقارير</h3>
          <p>اطّلع على الحضور وتقارير الحفظ والتثبيت والمراجعة</p>
        </article>
      </div>
    </section>

    <section class="cta-band" aria-labelledby="cta-title">
      <div>
        <h2 id="cta-title">ابدأ بإعداد مركزك</h2>
        <p>أنشئ مركزًا جديدًا، أو سجّل دخولك إن كان لديك حساب</p>
      </div>
      <div class="cta-band-actions">
        <a [href]="centerSignupUrl" class="btn btn-accent btn-lg" title="نموذج تسجيل المركز">إنشاء مركز</a>
        <a routerLink="/login" class="btn btn-secondary btn-lg">لديّ حساب / تسجيل الدخول</a>
      </div>
    </section>

    <footer class="site-footer">
      <p>© تحفيظ</p>
    </footer>
  `,
})
export class LandingPageComponent {
  protected readonly centerSignupUrl = CENTER_SIGNUP_URL;
}
