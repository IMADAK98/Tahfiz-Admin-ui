import { Component, input } from '@angular/core';

/** Under-input Nest 400 message. RTL-safe; styles live on `.field-error`. */
@Component({
  selector: 'app-field-error',
  template: `
    @if (message(); as msg) {
      <p class="field-error" [attr.id]="errorId() || null" role="alert">{{ msg }}</p>
    }
  `,
})
export class FieldErrorComponent {
  readonly message = input<string | undefined>(undefined);
  readonly errorId = input<string>('');
}
