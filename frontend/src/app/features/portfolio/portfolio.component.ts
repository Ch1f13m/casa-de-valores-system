import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule],
  template: `
    <div class="portfolio-container">
      <h1>Mi Portafolio</h1>
      <mat-card>
        <mat-card-content>
          <p>Aquí se mostraría el detalle del portafolio de inversiones.</p>
          <p><strong>Valor Total:</strong> $125,450.75</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .portfolio-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class PortfolioComponent { }