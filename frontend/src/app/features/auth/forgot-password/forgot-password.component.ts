import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
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
    MatSnackBarModule,
    MatStepperModule
  ],
  template: `
    <div class="forgot-password-container">
      <mat-card class="forgot-password-card">
        <mat-card-header>
          <mat-card-title>Recuperar Contraseña</mat-card-title>
          <mat-card-subtitle>Restaura el acceso a tu cuenta</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <mat-stepper [linear]="true" #stepper>
            <!-- Paso 1: Solicitar Reset -->
            <mat-step label="Solicitar Reset" [stepControl]="requestForm">
              <form [formGroup]="requestForm">
                <div class="step-content">
                  <p>Ingresa tu email para recibir las instrucciones de recuperación:</p>
                  
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Email</mat-label>
                    <input matInput 
                           type="email" 
                           formControlName="email" 
                           placeholder="correo@ejemplo.com">
                    <mat-icon matSuffix>email</mat-icon>
                    <mat-error *ngIf="requestForm.get('email')?.hasError('required')">
                      El email es requerido
                    </mat-error>
                    <mat-error *ngIf="requestForm.get('email')?.hasError('email')">
                      Ingrese un email válido
                    </mat-error>
                  </mat-form-field>
                  
                  <div class="security-info">
                    <mat-icon>info</mat-icon>
                    <p>Por seguridad, el enlace de recuperación expirará en 1 hora.</p>
                  </div>
                </div>
                
                <div class="step-actions">
                  <button mat-raised-button color="primary" 
                          [disabled]="!requestForm.valid || isRequesting"
                          (click)="requestReset()">
                    {{ isRequesting ? 'Enviando...' : 'Enviar enlace' }}
                  </button>
                  
                  <button mat-button routerLink="/auth/login">
                    Volver al login
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Paso 2: Verificar Código -->
            <mat-step label="Verificar Código" [stepControl]="verifyForm">
              <form [formGroup]="verifyForm">
                <div class="step-content">
                  <div class="success-message">
                    <mat-icon>check_circle</mat-icon>
                    <p>Hemos enviado un código de verificación a <strong>{{ maskedEmail }}</strong></p>
                  </div>
                  
                  <mat-form-field appearance="outline" class="verification-code">
                    <mat-label>Código de verificación</mat-label>
                    <input matInput 
                           formControlName="verificationCode" 
                           placeholder="123456"
                           maxlength="6"
                           pattern="[0-9]{6}">
                    <mat-error *ngIf="verifyForm.get('verificationCode')?.hasError('required')">
                      El código es requerido
                    </mat-error>
                    <mat-error *ngIf="verifyForm.get('verificationCode')?.hasError('pattern')">
                      Debe ser un código de 6 dígitos
                    </mat-error>
                  </mat-form-field>
                  
                  <div class="resend-section">
                    <p>¿No recibiste el código?</p>
                    <button mat-button 
                            color="primary" 
                            [disabled]="resendCountdown > 0"
                            (click)="resendCode()">
                      {{ resendCountdown > 0 ? 'Reenviar en ' + resendCountdown + 's' : 'Reenviar código' }}
                    </button>
                  </div>
                </div>
                
                <div class="step-actions">
                  <button mat-button (click)="stepper.previous()">Anterior</button>
                  <button mat-raised-button color="primary" 
                          [disabled]="!verifyForm.valid || isVerifying"
                          (click)="verifyCode()">
                    {{ isVerifying ? 'Verificando...' : 'Verificar código' }}
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Paso 3: Nueva Contraseña -->
            <mat-step label="Nueva Contraseña" [stepControl]="resetForm">
              <form [formGroup]="resetForm">
                <div class="step-content">
                  <p>Crea una nueva contraseña segura:</p>
                  
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Nueva contraseña</mat-label>
                    <input matInput 
                           [type]="hidePassword ? 'password' : 'text'" 
                           formControlName="password">
                    <button mat-icon-button matSuffix 
                            (click)="hidePassword = !hidePassword" 
                            type="button">
                      <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                    <mat-error *ngIf="resetForm.get('password')?.hasError('required')">
                      La contraseña es requerida
                    </mat-error>
                    <mat-error *ngIf="resetForm.get('password')?.hasError('minlength')">
                      Mínimo 8 caracteres
                    </mat-error>
                    <mat-error *ngIf="resetForm.get('password')?.hasError('pattern')">
                      Debe contener al menos: 1 mayúscula, 1 minúscula, 1 número
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Confirmar contraseña</mat-label>
                    <input matInput 
                           [type]="hideConfirmPassword ? 'password' : 'text'" 
                           formControlName="confirmPassword">
                    <button mat-icon-button matSuffix 
                            (click)="hideConfirmPassword = !hideConfirmPassword" 
                            type="button">
                      <mat-icon>{{ hideConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                    <mat-error *ngIf="resetForm.get('confirmPassword')?.hasError('required')">
                      Confirme la contraseña
                    </mat-error>
                    <mat-error *ngIf="resetForm.hasError('passwordMismatch')">
                      Las contraseñas no coinciden
                    </mat-error>
                  </mat-form-field>
                  
                  <div class="password-strength">
                    <h4>Requisitos de contraseña:</h4>
                    <div class="requirements">
                      <div class="requirement" [class.met]="passwordRequirements.length">
                        <mat-icon>{{ passwordRequirements.length ? 'check' : 'close' }}</mat-icon>
                        Al menos 8 caracteres
                      </div>
                      <div class="requirement" [class.met]="passwordRequirements.uppercase">
                        <mat-icon>{{ passwordRequirements.uppercase ? 'check' : 'close' }}</mat-icon>
                        Una letra mayúscula
                      </div>
                      <div class="requirement" [class.met]="passwordRequirements.lowercase">
                        <mat-icon>{{ passwordRequirements.lowercase ? 'check' : 'close' }}</mat-icon>
                        Una letra minúscula
                      </div>
                      <div class="requirement" [class.met]="passwordRequirements.number">
                        <mat-icon>{{ passwordRequirements.number ? 'check' : 'close' }}</mat-icon>
                        Un número
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="step-actions">
                  <button mat-button (click)="stepper.previous()">Anterior</button>
                  <button mat-raised-button color="primary" 
                          [disabled]="!resetForm.valid || isResetting"
                          (click)="resetPassword()">
                    {{ isResetting ? 'Actualizando...' : 'Actualizar contraseña' }}
                  </button>
                </div>
              </form>
            </mat-step>
          </mat-stepper>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .forgot-password-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .forgot-password-card {
      max-width: 600px;
      width: 100%;
      padding: 24px;
    }

    .step-content {
      margin: 24px 0;
    }

    .step-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .verification-code {
      width: 200px;
      margin: 0 auto;
      display: block;
    }

    .verification-code input {
      text-align: center;
      font-size: 24px;
      letter-spacing: 4px;
    }

    .security-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 12px;
      background-color: #e3f2fd;
      border-radius: 8px;
      color: #1976d2;
    }

    .success-message {
      text-align: center;
      padding: 20px;
      background-color: #e8f5e8;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .success-message mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #4caf50;
      margin-bottom: 8px;
    }

    .resend-section {
      text-align: center;
      margin-top: 24px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .password-strength {
      margin-top: 16px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .requirements {
      margin-top: 12px;
    }

    .requirement {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      color: #666;
    }

    .requirement.met {
      color: #4caf50;
    }

    .requirement mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    mat-card-header {
      text-align: center;
      margin-bottom: 24px;
    }

    h4 {
      margin: 0 0 8px 0;
      color: #333;
    }
  `]
})
export class ForgotPasswordComponent {
  requestForm: FormGroup;
  verifyForm: FormGroup;
  resetForm: FormGroup;
  
  maskedEmail = '';
  hidePassword = true;
  hideConfirmPassword = true;
  
  isRequesting = false;
  isVerifying = false;
  isResetting = false;
  
  resendCountdown = 0;
  resendInterval: any;
  
  passwordRequirements = {
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.requestForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.verifyForm = this.fb.group({
      verificationCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    this.resetForm = this.fb.group({
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // Watch password changes for requirements
    this.resetForm.get('password')?.valueChanges.subscribe(password => {
      this.checkPasswordRequirements(password || '');
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  checkPasswordRequirements(password: string) {
    this.passwordRequirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password)
    };
  }

  requestReset() {
    if (this.requestForm.valid) {
      this.isRequesting = true;
      const email = this.requestForm.get('email')?.value;
      
      // Simulate API call
      setTimeout(() => {
        this.maskedEmail = this.maskEmail(email);
        this.isRequesting = false;
        this.snackBar.open('Código enviado al email', 'Cerrar', { duration: 3000 });
        this.startResendCountdown();
      }, 2000);
    }
  }

  verifyCode() {
    if (this.verifyForm.valid) {
      this.isVerifying = true;
      
      // Simulate API call
      setTimeout(() => {
        this.isVerifying = false;
        this.snackBar.open('Código verificado correctamente', 'Cerrar', { duration: 3000 });
      }, 1500);
    }
  }

  resetPassword() {
    if (this.resetForm.valid) {
      this.isResetting = true;
      
      // Simulate API call
      setTimeout(() => {
        this.isResetting = false;
        this.snackBar.open('Contraseña actualizada exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/auth/login']);
      }, 2000);
    }
  }

  resendCode() {
    this.snackBar.open('Código reenviado', 'Cerrar', { duration: 2000 });
    this.startResendCountdown();
  }

  startResendCountdown() {
    this.resendCountdown = 60;
    this.resendInterval = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        clearInterval(this.resendInterval);
      }
    }, 1000);
  }

  maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  }

  ngOnDestroy() {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  }
}