import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';

import { AuthService } from './core/services/auth.service';
import { NavigationComponent } from './shared/components/navigation/navigation.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatMenuModule,
    NavigationComponent
  ],
  template: `
    <div class="app-container">
      <app-navigation *ngIf="authService.isAuthenticated()"></app-navigation>
      <main [class.with-nav]="authService.isAuthenticated()">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    main {
      flex: 1;
      overflow: auto;
    }

    main.with-nav {
      margin-left: 250px;
    }

    @media (max-width: 768px) {
      main.with-nav {
        margin-left: 0;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Casa de Valores';

  constructor(public authService: AuthService) {}

  ngOnInit() {
    // Initialize app
    this.authService.checkAuthStatus();
  }
}