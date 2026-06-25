import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { TutorialService } from './shared/tutorial/tutorial.service';
import { TutorialOverlayComponent } from './shared/tutorial/tutorial-overlay.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TutorialOverlayComponent],
  template: `
    <router-outlet></router-outlet>
    <app-tutorial-overlay></app-tutorial-overlay>
  `,
})
export class AppComponent {
  private theme = inject(ThemeService);
  private tutorial = inject(TutorialService);

  constructor() {
    this.tutorial.init();
  }
}
