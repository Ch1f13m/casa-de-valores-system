import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="market-container">
      <h1>Datos de Mercado</h1>
      <mat-card>
        <mat-card-content>
          <p>Información en tiempo real del mercado financiero.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .market-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
  `]
})
export class MarketComponent { }