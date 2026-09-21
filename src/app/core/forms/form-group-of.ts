import { FormBuilder, FormGroup } from '@angular/forms';

/** Untyped FormGroup from a plain model so feature forms stay `getRawValue()`-shaped. */
export function formGroupOf<T extends object>(fb: FormBuilder, value: T): FormGroup {
  const config: Record<string, [unknown]> = {};
  for (const key of Object.keys(value)) {
    config[key] = [(value as Record<string, unknown>)[key]];
  }
  return fb.group(config);
}
