import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="profile-container">
      <h1>Mi Perfil</h1>
      <mat-card>
        <mat-card-content>
          <p>Información del perfil de usuario.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
  `]
})
export class ProfileComponent { }