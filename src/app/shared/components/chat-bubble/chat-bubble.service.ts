import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChatBubbleService {
  openSignal = signal<boolean>(false);

  open() {
    this.openSignal.set(true);
  }
}
