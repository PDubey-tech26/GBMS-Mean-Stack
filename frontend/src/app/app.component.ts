import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <div class="app-shell" *ngIf="auth.isLoggedIn(); else bare">
      <app-sidebar></app-sidebar>
      <div class="main-content"><router-outlet></router-outlet></div>
    </div>
    <ng-template #bare><router-outlet></router-outlet></ng-template>
  `
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}
