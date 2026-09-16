import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { TahfizPreset } from '../styles/primeng-theme';
import { API_BASE_URL } from './core/config/api-config';
import { authInterceptor } from './core/auth/auth.interceptor';
import { errorToastInterceptor } from './core/http/error-toast.interceptor';
import { environment } from '../environments/environment';

function initTranslations(translate: TranslateService) {
  return () => firstValueFrom(translate.use('ar'));
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorToastInterceptor])),
    provideTranslateService({
      lang: 'ar',
      fallbackLang: 'ar',
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json',
        // ToastErrorService (used by errorToastInterceptor) injects TranslateService; routing the
        // loader's own HTTP call through HttpClient (and therefore through that interceptor) while
        // TranslateService is still constructing itself throws NG0204. HttpBackend bypasses interceptors.
        useHttpBackend: true,
      }),
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initTranslations,
      deps: [TranslateService],
      multi: true,
    },
    MessageService,
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: TahfizPreset,
        options: {
          prefix: 'p',
          darkModeSelector: false,
          cssLayer: false,
        },
      },
    }),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
  ],
};
