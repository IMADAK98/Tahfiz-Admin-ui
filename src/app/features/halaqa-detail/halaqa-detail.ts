import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-halaqa-detail',
  templateUrl: './halaqa-detail.html',
})
export class HalaqaDetailComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly halaqaId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );
}
