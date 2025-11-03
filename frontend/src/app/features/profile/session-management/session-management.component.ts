import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { SessionService, SessionInfo } from '../../../core/services/session.service';

@Component({
  selector: 'app-session-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="session-management-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Gestión de Sesiones</mat-card-title>
          <mat-card-subtitle>Administra tus sesiones activas y dispositivos conectados</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Información de sesión actual -->
          <div class="current-session" *ngIf="currentSession">
            <h3>Sesión Actual</h3>
            <div class="session-info">
              <div class="info-item">
                <mat-icon>device_hub</mat-icon>
                <span>{{ currentSession.device }}</span>
              </div>
              <div class="info-item">
                <mat-icon>location_on</mat-icon>
                <span>{{ currentSession.location }}</span>
              </div>
              <div class="info-item">
                <mat-icon>schedule</mat-icon>
                <span>Iniciada: {{ currentSession.loginTime | date:'short' }}</span>
              </div>
              <div class="info-item">
                <mat-icon>access_time</mat-icon>
                <span>Última actividad: {{ currentSession.lastActivity | date:'short' }}</span>
              </div>
            </div>
            
            <!-- Tiempo restante -->
            <div class="time-remaining" *ngIf="timeRemaining > 0">
              <mat-icon>timer</mat-icon>
              <span>Tiempo restante: {{ formatTime(timeRemaining) }}</span>
              <button mat-button color="primary" (click)="extendSession()">
                Extender sesión
              </button>
            </div>
          </div>

          <!-- Todas las sesiones -->
          <div class="all-sessions">
            <div class="section-header">
              <h3>Todas las Sesiones</h3>
              <button mat-raised-button 
                      color="warn" 
                      (click)="terminateAllOtherSessions()"
                      [disabled]="!hasOtherActiveSessions()">
                <mat-icon>logout</mat-icon>
                Cerrar todas las demás
              </button>
            </div>

            <div class="sessions-table">
              <table mat-table [dataSource]="sessions" class="sessions-table">
                <!-- Dispositivo -->
                <ng-container matColumnDef="device">
                  <th mat-header-cell *matHeaderCellDef>Dispositivo</th>
                  <td mat-cell *matCellDef="let session">
                    <div class="device-info">
                      <mat-icon>{{ getDeviceIcon(session.device) }}</mat-icon>
                      <span>{{ session.device }}</span>
                      <mat-chip *ngIf="session.isCurrent" color="primary">Actual</mat-chip>
                    </div>
                  </td>
                </ng-container>

                <!-- Ubicación -->
                <ng-container matColumnDef="location">
                  <th mat-header-cell *matHeaderCellDef>Ubicación</th>
                  <td mat-cell *matCellDef="let session">
                    <div class="location-info">
                      <mat-icon>location_on</mat-icon>
                      <span>{{ session.location }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Estado -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Estado</th>
                  <td mat-cell *matCellDef="let session">
                    <mat-chip [color]="session.isActive ? 'primary' : 'default'">
                      {{ session.isActive ? 'Activa' : 'Inactiva' }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Última actividad -->
                <ng-container matColumnDef="lastActivity">
                  <th mat-header-cell *matHeaderCellDef>Última Actividad</th>
                  <td mat-cell *matCellDef="let session">
                    <div class="activity-info">
                      <span>{{ session.lastActivity | date:'short' }}</span>
                      <small>{{ getRelativeTime(session.lastActivity) }}</small>
                    </div>
                  </td>
                </ng-container>

                <!-- Acciones -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let session">
                    <button mat-icon-button 
                            color="warn"
                            *ngIf="session.isActive && !session.isCurrent"
                            (click)="terminateSession(session.sessionId)"
                            matTooltip="Cerrar sesión">
                      <mat-icon>logout</mat-icon>
                    </button>
                    
                    <button mat-icon-button 
                            *ngIf="session.isCurrent"
                            (click)="viewSessionDetails(session)"
                            matTooltip="Ver detalles">
                      <mat-icon>info</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>
          </div>

          <!-- Configuración de sesión -->
          <div class="session-settings">
            <h3>Configuración de Sesión</h3>
            <div class="settings-grid">
              <div class="setting-item">
                <mat-icon>timer</mat-icon>
                <div class="setting-content">
                  <h4>Tiempo de expiración</h4>
                  <p>Las sesiones expiran automáticamente por inactividad</p>
                  <div class="timeout-buttons">
                    <button mat-button 
                            [class.active]="sessionTimeoutMinutes === 15"
                            (click)="setSessionTimeout(15)">
                      15 min
                    </button>
                    <button mat-button 
                            [class.active]="sessionTimeoutMinutes === 30"
                            (click)="setSessionTimeout(30)">
                      30 min
                    </button>
                    <button mat-button 
                            [class.active]="sessionTimeoutMinutes === 60"
                            (click)="setSessionTimeout(60)">
                      1 hora
                    </button>
                    <button mat-button 
                            [class.active]="sessionTimeoutMinutes === 120"
                            (click)="setSessionTimeout(120)">
                      2 horas
                    </button>
                  </div>
                </div>
              </div>

              <div class="setting-item">
                <mat-icon>security</mat-icon>
                <div class="setting-content">
                  <h4>Seguridad</h4>
                  <p>Cerrar sesiones automáticamente en dispositivos no reconocidos</p>
                  <button mat-raised-button color="primary">
                    Configurar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .session-management-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .current-session {
      background-color: #e3f2fd;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 32px;
    }

    .session-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin: 16px 0;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .time-remaining {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 16px;
      padding: 12px;
      background-color: #fff3e0;
      border-radius: 4px;
      color: #f57c00;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .all-sessions {
      margin-bottom: 32px;
    }

    .sessions-table {
      width: 100%;
      margin-top: 16px;
    }

    .device-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .location-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .activity-info {
      display: flex;
      flex-direction: column;
    }

    .activity-info small {
      color: #666;
      font-size: 12px;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-top: 16px;
    }

    .setting-item {
      display: flex;
      gap: 16px;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .setting-content h4 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .setting-content p {
      margin: 0 0 16px 0;
      color: #666;
      font-size: 14px;
    }

    .timeout-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .timeout-buttons button.active {
      background-color: #3f51b5;
      color: white;
    }

    h3 {
      margin: 0 0 16px 0;
      color: #333;
    }

    mat-card-header {
      margin-bottom: 24px;
    }
  `]
})
export class SessionManagementComponent implements OnInit, OnDestroy {
  sessions: SessionInfo[] = [];
  currentSession: SessionInfo | null = null;
  timeRemaining = 0;
  sessionTimeoutMinutes = 30;
  
  displayedColumns: string[] = ['device', 'location', 'status', 'lastActivity', 'actions'];
  
  private subscriptions: Subscription[] = [];
  private timeUpdateInterval: any;

  constructor(
    private sessionService: SessionService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadSessions();
    this.startTimeUpdates();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
  }

  loadSessions() {
    const sub = this.sessionService.activeSessions$.subscribe(sessions => {
      this.sessions = sessions;
      this.currentSession = sessions.find(s => s.isCurrent) || null;
    });
    this.subscriptions.push(sub);
    
    this.sessionService.loadActiveSessions();
  }

  startTimeUpdates() {
    this.updateTimeRemaining();
    this.timeUpdateInterval = setInterval(() => {
      this.updateTimeRemaining();
    }, 1000);
  }

  updateTimeRemaining() {
    this.timeRemaining = this.sessionService.getTimeUntilExpiry();
  }

  extendSession() {
    this.sessionService.extendSession();
    this.snackBar.open('Sesión extendida exitosamente', 'Cerrar', { duration: 3000 });
  }

  terminateSession(sessionId: string) {
    this.sessionService.terminateSession(sessionId).subscribe(success => {
      if (success) {
        this.snackBar.open('Sesión terminada', 'Cerrar', { duration: 3000 });
      } else {
        this.snackBar.open('Error al terminar la sesión', 'Cerrar', { duration: 3000 });
      }
    });
  }

  terminateAllOtherSessions() {
    this.sessionService.terminateAllOtherSessions().subscribe(success => {
      if (success) {
        this.snackBar.open('Todas las demás sesiones han sido terminadas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  hasOtherActiveSessions(): boolean {
    return this.sessions.some(session => !session.isCurrent && session.isActive);
  }

  setSessionTimeout(minutes: number) {
    this.sessionTimeoutMinutes = minutes;
    this.sessionService.setSessionTimeout(minutes);
    this.snackBar.open(`Tiempo de sesión configurado a ${minutes} minutos`, 'Cerrar', { duration: 3000 });
  }

  viewSessionDetails(session: SessionInfo) {
    // Implementar modal con detalles de la sesión
    console.log('Ver detalles de sesión:', session);
  }

  getDeviceIcon(device: string): string {
    if (device.includes('iPhone') || device.includes('Android')) return 'phone_android';
    if (device.includes('iPad')) return 'tablet';
    if (device.includes('Windows') || device.includes('Mac') || device.includes('Linux')) return 'computer';
    return 'device_unknown';
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours} h`;
    return `hace ${diffDays} días`;
  }

  formatTime(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}