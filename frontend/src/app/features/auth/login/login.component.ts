import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Casa de Valores</mat-card-title>
          <mat-card-subtitle>Iniciar Sesión</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Información de credenciales demo -->
          <div class="demo-credentials">
            <h4>🔑 Credenciales de Demo:</h4>
            <p><strong>Administrador:</strong> admin / admin <span class="mfa-badge">🔒 2FA</span></p>
            <p><strong>Broker:</strong> broker / broker123 <span class="mfa-badge">🔒 2FA</span></p>
            <p><strong>Inversor:</strong> investor / investor123</p>
            <p><strong>Demo:</strong> demo / demo</p>
            <p class="mfa-note"><small>💡 Código 2FA para usuarios con 🔒: <strong>123456</strong></small></p>
          </div>
          
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field class="form-field">
              <mat-label>Usuario</mat-label>
              <input matInput formControlName="username" required>
              <mat-icon matSuffix>person</mat-icon>
              <mat-error *ngIf="loginForm.get('username')?.hasError('required')">
                El usuario es requerido
              </mat-error>
            </mat-form-field>

            <mat-form-field class="form-field">
              <mat-label>Contraseña</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" 
                     formControlName="password" required>
              <button mat-icon-button matSuffix type="button"
                      (click)="hidePassword = !hidePassword">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                La contraseña es requerida
              </mat-error>
            </mat-form-field>

            <mat-form-field class="form-field" *ngIf="requiresMFA">
              <mat-label>Código MFA</mat-label>
              <input matInput formControlName="mfa_code" maxlength="6">
              <mat-icon matSuffix>security</mat-icon>
              <mat-error *ngIf="loginForm.get('mfa_code')?.hasError('required')">
                El código MFA es requerido
              </mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" 
                    class="login-button" [disabled]="loginForm.invalid || loading">
              <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
              <span *ngIf="!loading">Iniciar Sesión</span>
            </button>
          </form>
        </mat-card-content>
        
        <mat-card-actions>
          <div class="card-actions">
            <a routerLink="/auth/forgot-password" class="forgot-link">
              ¿Olvidaste tu contraseña?
            </a>
            <p class="register-link">
              ¿No tienes cuenta? 
              <a routerLink="/auth/register">Regístrate aquí</a>
            </p>
          </div>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      width: 100%;
      max-width: 450px;
      padding: 20px;
    }

    .demo-credentials {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #3f51b5;
    }

    .demo-credentials h4 {
      margin: 0 0 12px 0;
      color: #3f51b5;
      font-size: 16px;
    }

    .demo-credentials p {
      margin: 4px 0;
      font-size: 14px;
      color: #666;
    }

    .mfa-badge {
      background: #ff9800;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      margin-left: 8px;
    }

    .mfa-note {
      margin-top: 12px !important;
      padding-top: 12px;
      border-top: 1px solid #e0e0e0;
      color: #3f51b5 !important;
    }

    .form-field {
      width: 100%;
      margin-bottom: 16px;
    }

    .login-button {
      width: 100%;
      height: 48px;
      margin-top: 16px;
    }

    .card-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
    }

    .forgot-link {
      color: #3f51b5;
      text-decoration: none;
      font-size: 14px;
    }

    .forgot-link:hover {
      text-decoration: underline;
    }

    .register-link {
      text-align: center;
      margin: 8px 0 0 0;
    }

    .register-link a {
      color: #3f51b5;
      text-decoration: none;
    }

    .register-link a:hover {
      text-decoration: underline;
    }

    mat-card-header {
      text-align: center;
      margin-bottom: 20px;
    }

    mat-card-title {
      font-size: 24px;
      font-weight: 500;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;
  requiresMFA = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      mfa_code: ['']
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      const { username, password, mfa_code } = this.loginForm.value;
      
      // Lista de usuarios con sus credenciales y si requieren 2FA
      const validCredentials = [
        { username: 'admin', password: 'admin', role: 'admin', fullName: 'Administrador del Sistema', requires2FA: true },
        { username: 'broker', password: 'broker123', role: 'broker', fullName: 'Broker Principal', requires2FA: true },
        { username: 'investor', password: 'investor123', role: 'investor', fullName: 'Inversor Demo', requires2FA: false },
        { username: 'demo', password: 'demo', role: 'investor', fullName: 'Usuario Demo', requires2FA: false }
      ];
      
      const user = validCredentials.find(cred => 
        cred.username === username && cred.password === password
      );
      
      if (!user) {
        this.loading = false;
        this.snackBar.open('Credenciales incorrectas. Prueba: admin/admin', 'Cerrar', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        return;
      }

      // Si el usuario requiere 2FA y aún no se ha solicitado
      if (user.requires2FA && !this.requiresMFA && !mfa_code) {
        this.loading = false;
        this.requiresMFA = true;
        this.loginForm.get('mfa_code')?.setValidators([Validators.required, Validators.minLength(6)]);
        this.loginForm.get('mfa_code')?.updateValueAndValidity();
        this.snackBar.open('Ingresa tu código de 2FA (usa: 123456 para demo)', 'Cerrar', { 
          duration: 5000,
          panelClass: ['info-snackbar']
        });
        return;
      }

      // Validar código 2FA si es requerido
      if (user.requires2FA && this.requiresMFA) {
        // En demo, aceptamos 123456 como código válido
        if (mfa_code !== '123456') {
          this.loading = false;
          this.snackBar.open('Código 2FA incorrecto. Usa: 123456', 'Cerrar', { 
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          return;
        }
      }

      // Login exitoso
      this.loading = false;
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('currentUser', JSON.stringify({
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        has2FA: user.requires2FA
      }));
      
      this.snackBar.open(`¡Bienvenido ${user.fullName}!`, 'Cerrar', { 
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      this.router.navigate(['/dashboard']);
    }
  }
}