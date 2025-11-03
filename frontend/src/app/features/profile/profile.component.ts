import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface UserProfile {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  accountType: string;
  memberSince: Date;
  lastLogin: Date;
  has2FA: boolean;
}

interface ActivityLog {
  action: string;
  timestamp: Date;
  ipAddress: string;
  device: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatChipsModule,
    MatListModule,
    MatSnackBarModule
  ],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <div class="avatar-section">
          <div class="avatar">
            <mat-icon>account_circle</mat-icon>
          </div>
          <div class="header-info">
            <h1>{{ userProfile().fullName }}</h1>
            <p class="username">{{ '@' + userProfile().username }}</p>
            <mat-chip class="role-chip">{{ getRoleLabel(userProfile().role) }}</mat-chip>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat">
            <mat-icon>schedule</mat-icon>
            <div class="stat-info">
              <span class="stat-label">Miembro desde</span>
              <span class="stat-value">{{ userProfile().memberSince | date:'mediumDate' }}</span>
            </div>
          </div>
          <div class="stat">
            <mat-icon>login</mat-icon>
            <div class="stat-info">
              <span class="stat-label">Último acceso</span>
              <span class="stat-value">{{ userProfile().lastLogin | date:'short' }}</span>
            </div>
          </div>
        </div>
      </div>

      <mat-tab-group>
        <!-- Tab: Información Personal -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">person</mat-icon>
            Información Personal
          </ng-template>
          
          <div class="tab-content">
            <form [formGroup]="personalInfoForm" (ngSubmit)="updatePersonalInfo()">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Datos Personales</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Nombre Completo</mat-label>
                      <input matInput formControlName="fullName" required>
                      <mat-icon matPrefix>person</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Usuario</mat-label>
                      <input matInput formControlName="username" required>
                      <mat-icon matPrefix>alternate_email</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Email</mat-label>
                      <input matInput type="email" formControlName="email" required>
                      <mat-icon matPrefix>email</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Teléfono</mat-label>
                      <input matInput formControlName="phone">
                      <mat-icon matPrefix>phone</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Tipo de Cuenta</mat-label>
                      <mat-select formControlName="accountType">
                        <mat-option value="individual">Individual</mat-option>
                        <mat-option value="corporate">Corporativa</mat-option>
                        <mat-option value="institutional">Institucional</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Idioma Preferido</mat-label>
                      <mat-select formControlName="language">
                        <mat-option value="es">Español</mat-option>
                        <mat-option value="en">English</mat-option>
                        <mat-option value="pt">Português</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-raised-button color="primary" type="submit" [disabled]="!personalInfoForm.valid">
                    <mat-icon>save</mat-icon>
                    Guardar Cambios
                  </button>
                  <button mat-button type="button" (click)="resetPersonalInfo()">
                    Cancelar
                  </button>
                </mat-card-actions>
              </mat-card>
            </form>
          </div>
        </mat-tab>

        <!-- Tab: Seguridad -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">security</mat-icon>
            Seguridad
          </ng-template>
          
          <div class="tab-content">
            <!-- Cambiar Contraseña -->
            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Cambiar Contraseña</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Contraseña Actual</mat-label>
                      <input matInput [type]="hideCurrentPassword ? 'password' : 'text'" formControlName="currentPassword" required>
                      <button mat-icon-button matSuffix type="button" (click)="hideCurrentPassword = !hideCurrentPassword">
                        <mat-icon>{{hideCurrentPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                      </button>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Nueva Contraseña</mat-label>
                      <input matInput [type]="hideNewPassword ? 'password' : 'text'" formControlName="newPassword" required>
                      <button mat-icon-button matSuffix type="button" (click)="hideNewPassword = !hideNewPassword">
                        <mat-icon>{{hideNewPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                      </button>
                      <mat-hint>Mínimo 8 caracteres</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Confirmar Nueva Contraseña</mat-label>
                      <input matInput [type]="hideConfirmPassword ? 'password' : 'text'" formControlName="confirmPassword" required>
                      <button mat-icon-button matSuffix type="button" (click)="hideConfirmPassword = !hideConfirmPassword">
                        <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                      </button>
                    </mat-form-field>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-raised-button color="primary" type="submit" [disabled]="!passwordForm.valid">
                    <mat-icon>lock</mat-icon>
                    Cambiar Contraseña
                  </button>
                </mat-card-actions>
              </mat-card>
            </form>

            <!-- Autenticación de Dos Factores -->
            <mat-card class="security-card">
              <mat-card-header>
                <mat-card-title>Autenticación de Dos Factores (2FA)</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="security-option">
                  <div class="option-info">
                    <mat-icon [class.active]="userProfile().has2FA">verified_user</mat-icon>
                    <div>
                      <h3>Estado: {{ userProfile().has2FA ? 'Activado' : 'Desactivado' }}</h3>
                      <p>Agrega una capa extra de seguridad a tu cuenta</p>
                    </div>
                  </div>
                  <button *ngIf="userProfile().has2FA" mat-raised-button color="warn" (click)="disable2FA()">
                    <mat-icon>block</mat-icon>
                    Desactivar 2FA
                  </button>
                  <button *ngIf="!userProfile().has2FA" mat-raised-button color="primary" (click)="setup2FA()">
                    <mat-icon>security</mat-icon>
                    Activar 2FA
                  </button>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Sesiones Activas -->
            <mat-card class="security-card">
              <mat-card-header>
                <mat-card-title>Sesiones Activas</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <mat-list>
                  <mat-list-item>
                    <mat-icon matListItemIcon class="session-current">computer</mat-icon>
                    <div matListItemTitle>
                      <strong>Sesión Actual</strong>
                      <mat-chip class="current-chip">Activo</mat-chip>
                    </div>
                    <div matListItemLine>Windows • Chrome • 192.168.1.100</div>
                    <div matListItemLine>
                      <small>Última actividad: Ahora</small>
                    </div>
                  </mat-list-item>
                  <mat-divider></mat-divider>
                  <mat-list-item>
                    <mat-icon matListItemIcon>phone_android</mat-icon>
                    <div matListItemTitle>Dispositivo Móvil</div>
                    <div matListItemLine>iOS • Safari • 192.168.1.105</div>
                    <div matListItemLine>
                      <small>Hace 2 horas</small>
                    </div>
                    <button mat-icon-button matListItemMeta (click)="closeSession('mobile')">
                      <mat-icon>close</mat-icon>
                    </button>
                  </mat-list-item>
                </mat-list>
                <button mat-button color="warn" (click)="closeAllSessions()">
                  <mat-icon>logout</mat-icon>
                  Cerrar Todas las Sesiones
                </button>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab: Preferencias -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">settings</mat-icon>
            Preferencias
          </ng-template>
          
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Notificaciones</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="preferences-list">
                  <div class="preference-item">
                    <div class="preference-info">
                      <h4>Alertas de Trading</h4>
                      <p>Recibe notificaciones cuando se ejecuten tus órdenes</p>
                    </div>
                    <mat-slide-toggle [checked]="true"></mat-slide-toggle>
                  </div>
                  <mat-divider></mat-divider>

                  <div class="preference-item">
                    <div class="preference-info">
                      <h4>Alertas de Precio</h4>
                      <p>Notificaciones cuando los precios alcancen tus límites</p>
                    </div>
                    <mat-slide-toggle [checked]="true"></mat-slide-toggle>
                  </div>
                  <mat-divider></mat-divider>

                  <div class="preference-item">
                    <div class="preference-info">
                      <h4>Resumen Diario</h4>
                      <p>Recibe un resumen de tu portafolio cada día</p>
                    </div>
                    <mat-slide-toggle [checked]="false"></mat-slide-toggle>
                  </div>
                  <mat-divider></mat-divider>

                  <div class="preference-item">
                    <div class="preference-info">
                      <h4>Noticias del Mercado</h4>
                      <p>Actualizaciones importantes del mercado financiero</p>
                    </div>
                    <mat-slide-toggle [checked]="true"></mat-slide-toggle>
                  </div>
                  <mat-divider></mat-divider>

                  <div class="preference-item">
                    <div class="preference-info">
                      <h4>Notificaciones por Email</h4>
                      <p>Recibe copias de las notificaciones por correo</p>
                    </div>
                    <mat-slide-toggle [checked]="false"></mat-slide-toggle>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="preferences-card">
              <mat-card-header>
                <mat-card-title>Visualización</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="preferences-list">
                  <div class="preference-item">
                    <div class="preference-info">
                      <h4>Tema de la Aplicación</h4>
                      <p>Selecciona el tema visual</p>
                    </div>
                    <mat-form-field appearance="outline" class="preference-select">
                      <mat-select value="light">
                        <mat-option value="light">Claro</mat-option>
                        <mat-option value="dark">Oscuro</mat-option>
                        <mat-option value="auto">Automático</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <mat-divider></mat-divider>

                  <div class="preference-item">
                    <div class="preference-info">
                      <h4>Moneda de Visualización</h4>
                      <p>Moneda predeterminada para mostrar valores</p>
                    </div>
                    <mat-form-field appearance="outline" class="preference-select">
                      <mat-select value="USD">
                        <mat-option value="USD">USD - Dólar</mat-option>
                        <mat-option value="COP">COP - Peso Colombiano</mat-option>
                        <mat-option value="EUR">EUR - Euro</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <mat-divider></mat-divider>

                  <div class="preference-item">
                    <div class="preference-info">
                      <h4>Formato de Fecha</h4>
                      <p>Cómo se muestran las fechas</p>
                    </div>
                    <mat-form-field appearance="outline" class="preference-select">
                      <mat-select value="DD/MM/YYYY">
                        <mat-option value="DD/MM/YYYY">DD/MM/YYYY</mat-option>
                        <mat-option value="MM/DD/YYYY">MM/DD/YYYY</mat-option>
                        <mat-option value="YYYY-MM-DD">YYYY-MM-DD</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab: Actividad Reciente -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">history</mat-icon>
            Actividad Reciente
          </ng-template>
          
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Historial de Actividad</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <mat-list>
                  <ng-container *ngFor="let activity of activityLogs()">
                    <mat-list-item>
                      <mat-icon matListItemIcon>{{ getActivityIcon(activity.action) }}</mat-icon>
                      <div matListItemTitle>{{ activity.action }}</div>
                      <div matListItemLine>
                        {{ activity.device }} • {{ activity.ipAddress }}
                      </div>
                      <div matListItemLine>
                        <small>{{ activity.timestamp | date:'medium' }}</small>
                      </div>
                    </mat-list-item>
                    <mat-divider></mat-divider>
                  </ng-container>
                </mat-list>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .profile-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .profile-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 32px;
      border-radius: 12px;
      margin-bottom: 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 24px;
    }

    .avatar-section {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .avatar {
      width: 100px;
      height: 100px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
      }
    }

    .header-info {
      h1 {
        margin: 0 0 4px 0;
        font-size: 28px;
        font-weight: 500;
      }
      
      .username {
        margin: 0 0 8px 0;
        opacity: 0.9;
        font-size: 16px;
      }
      
      .role-chip {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        font-weight: 500;
      }
    }

    .header-stats {
      display: flex;
      gap: 32px;
      
      .stat {
        display: flex;
        align-items: center;
        gap: 12px;
        
        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          opacity: 0.9;
        }
        
        .stat-info {
          display: flex;
          flex-direction: column;
          
          .stat-label {
            font-size: 12px;
            opacity: 0.8;
          }
          
          .stat-value {
            font-size: 16px;
            font-weight: 500;
          }
        }
      }
    }

    .tab-icon {
      margin-right: 8px;
    }

    .tab-content {
      padding: 24px 0;
    }

    mat-card {
      margin-bottom: 24px;
      
      mat-card-title {
        font-size: 20px;
        font-weight: 500;
        color: #333;
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }

    mat-card-actions {
      padding: 16px;
      display: flex;
      gap: 16px;
    }

    /* Security Section */
    .security-card {
      .security-option {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0;
        
        .option-info {
          display: flex;
          align-items: center;
          gap: 16px;
          
          mat-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
            color: #ccc;
            
            &.active {
              color: #4caf50;
            }
          }
          
          h3 {
            margin: 0 0 4px 0;
            font-size: 16px;
            color: #333;
          }
          
          p {
            margin: 0;
            font-size: 14px;
            color: #666;
          }
        }
      }
    }

    .session-current {
      color: #4caf50;
    }

    .current-chip {
      background: #e8f5e9;
      color: #4caf50;
      font-size: 11px;
      min-height: 20px;
      margin-left: 8px;
    }

    /* Preferences */
    .preferences-card {
      margin-top: 24px;
    }

    .preferences-list {
      .preference-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0;
        
        .preference-info {
          flex: 1;
          
          h4 {
            margin: 0 0 4px 0;
            font-size: 16px;
            color: #333;
          }
          
          p {
            margin: 0;
            font-size: 14px;
            color: #666;
          }
        }
        
        .preference-select {
          width: 200px;
          margin: 0;
        }
      }
    }

    mat-divider {
      margin: 8px 0;
    }

    @media (max-width: 768px) {
      .profile-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .header-stats {
        flex-direction: column;
        gap: 16px;
      }
      
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  personalInfoForm: FormGroup;
  passwordForm: FormGroup;
  
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  
  userProfile = signal<UserProfile>({
    username: 'admin',
    fullName: 'Administrador del Sistema',
    email: 'admin@casadevalores.com',
    phone: '+57 300 123 4567',
    role: 'admin',
    accountType: 'individual',
    memberSince: new Date('2024-01-15'),
    lastLogin: new Date(),
    has2FA: true
  });
  
  activityLogs = signal<ActivityLog[]>([
    {
      action: 'Inicio de sesión exitoso',
      timestamp: new Date(),
      ipAddress: '192.168.1.100',
      device: 'Windows • Chrome'
    },
    {
      action: 'Actualización de perfil',
      timestamp: new Date(Date.now() - 3600000),
      ipAddress: '192.168.1.100',
      device: 'Windows • Chrome'
    },
    {
      action: 'Orden de compra ejecutada',
      timestamp: new Date(Date.now() - 7200000),
      ipAddress: '192.168.1.105',
      device: 'iOS • Safari'
    },
    {
      action: 'Descarga de reporte',
      timestamp: new Date(Date.now() - 86400000),
      ipAddress: '192.168.1.100',
      device: 'Windows • Chrome'
    },
    {
      action: 'Configuración de 2FA',
      timestamp: new Date(Date.now() - 172800000),
      ipAddress: '192.168.1.100',
      device: 'Windows • Chrome'
    }
  ]);

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.personalInfoForm = this.fb.group({
      fullName: [this.userProfile().fullName, Validators.required],
      username: [this.userProfile().username, Validators.required],
      email: [this.userProfile().email, [Validators.required, Validators.email]],
      phone: [this.userProfile().phone],
      accountType: [this.userProfile().accountType],
      language: ['es']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Cargar perfil del usuario desde localStorage
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      this.userProfile.set({
        ...this.userProfile(),
        username: user.username,
        fullName: user.fullName || user.username,
        role: user.role,
        has2FA: user.has2FA || false
      });
      
      this.personalInfoForm.patchValue({
        fullName: this.userProfile().fullName,
        username: this.userProfile().username
      });
    }
  }

  getRoleLabel(role: string): string {
    const labels: any = {
      'admin': 'Administrador',
      'broker': 'Broker',
      'investor': 'Inversor',
      'manager': 'Gerente'
    };
    return labels[role] || role;
  }

  updatePersonalInfo() {
    if (this.personalInfoForm.valid) {
      const formValue = this.personalInfoForm.value;
      this.userProfile.update(profile => ({
        ...profile,
        ...formValue
      }));
      
      this.snackBar.open('Información actualizada exitosamente', 'Cerrar', {
        duration: 3000
      });
    }
  }

  resetPersonalInfo() {
    this.personalInfoForm.reset({
      fullName: this.userProfile().fullName,
      username: this.userProfile().username,
      email: this.userProfile().email,
      phone: this.userProfile().phone,
      accountType: this.userProfile().accountType,
      language: 'es'
    });
  }

  changePassword() {
    if (this.passwordForm.valid) {
      const { newPassword, confirmPassword } = this.passwordForm.value;
      
      if (newPassword !== confirmPassword) {
        this.snackBar.open('Las contraseñas no coinciden', 'Cerrar', {
          duration: 3000
        });
        return;
      }
      
      this.snackBar.open('Contraseña actualizada exitosamente', 'Cerrar', {
        duration: 3000
      });
      this.passwordForm.reset();
    }
  }

  setup2FA() {
    this.snackBar.open('Redirigiendo a configuración de 2FA...', 'Cerrar', {
      duration: 2000
    });
    // Aquí se redirigiría a /auth/two-factor-setup
  }

  disable2FA() {
    if (confirm('¿Estás seguro de desactivar la autenticación de dos factores?')) {
      this.userProfile.update(profile => ({
        ...profile,
        has2FA: false
      }));
      
      this.snackBar.open('2FA desactivado', 'Cerrar', {
        duration: 3000
      });
    }
  }

  closeSession(device: string) {
    this.snackBar.open(`Sesión cerrada en ${device}`, 'Cerrar', {
      duration: 3000
    });
  }

  closeAllSessions() {
    if (confirm('¿Cerrar todas las sesiones excepto la actual?')) {
      this.snackBar.open('Todas las sesiones han sido cerradas', 'Cerrar', {
        duration: 3000
      });
    }
  }

  getActivityIcon(action: string): string {
    if (action.includes('sesión')) return 'login';
    if (action.includes('perfil')) return 'person';
    if (action.includes('compra') || action.includes('venta')) return 'shopping_cart';
    if (action.includes('reporte')) return 'description';
    if (action.includes('2FA')) return 'security';
    return 'info';
  }
}