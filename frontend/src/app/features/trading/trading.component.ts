import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-trading',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="trading-container">
      <h1>Trading</h1>
      <mat-card>
        <mat-card-content>
          <p>Plataforma de trading para ejecutar órdenes de compra y venta.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .trading-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class TradingComponent { }