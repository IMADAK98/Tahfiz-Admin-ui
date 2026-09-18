import { signal, WritableSignal } from '@angular/core';
import { ApiError } from './api-error';
import { fieldErrorsFromUnknown } from './error-message.helpers';

/** Tiny bind/clear bag for Nest `errors[]` under inputs. Last write wins per fieldName. */
export class FieldErrorBag {
  readonly fieldErrors: WritableSignal<Record<string, string>> = signal({});

  get(...fieldNames: string[]): string | undefined {
    const current = this.fieldErrors();
    for (const fieldName of fieldNames) {
      const message = current[fieldName];
      if (message) {
        return message;
      }
    }
    return undefined;
  }

  hasAny(): boolean {
    return Object.keys(this.fieldErrors()).length > 0;
  }

  clear(...fieldNames: string[]): void {
    const current = this.fieldErrors();
    let changed = false;
    const next = { ...current };
    for (const fieldName of fieldNames) {
      if (fieldName in next) {
        delete next[fieldName];
        changed = true;
      }
    }
    if (changed) {
      this.fieldErrors.set(next);
    }
  }

  clearAll(): void {
    if (!this.hasAny()) {
      return;
    }
    this.fieldErrors.set({});
  }

  /** Returns true when Nest `errors[]` produced at least one field message. */
  apply(error: unknown): boolean {
    const fields = fieldErrorsFromUnknown(error);
    this.fieldErrors.set(fields);
    return Object.keys(fields).length > 0;
  }
}

export function createFieldErrorBag(): FieldErrorBag {
  return new FieldErrorBag();
}

/** Banner when `errors[]` present; else Nest/ApiError message; else fallback. */
export function nestSubmitBanner(
  error: unknown,
  bag: FieldErrorBag,
  fieldErrorsBanner: string,
  fallback: string,
): string | null {
  if (bag.apply(error)) {
    return fieldErrorsBanner;
  }
  if (error instanceof ApiError) {
    return error.message;
  }
  return fallback;
}
