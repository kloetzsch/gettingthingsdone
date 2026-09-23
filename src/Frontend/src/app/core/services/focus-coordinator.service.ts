import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FocusCoordinatorService {
  readonly captureFormRequests = signal(0);

  requestCaptureFormFocus(): void {
    this.captureFormRequests.update((n) => n + 1);
  }
}
