import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-risk',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="risk-container">
      <h1>Gestión de Riesgo</h1>
      <mat-card>
        <mat-card-content>
          <p>Análisis y gestión de riesgos de inversión.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .risk-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
  `]
})
export class RiskComponent { }