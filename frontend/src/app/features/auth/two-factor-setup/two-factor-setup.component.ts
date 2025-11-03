import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-two-factor-setup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatStepperModule,
    MatSelectModule
  ],
  template: `
    <div class="twofa-container">
      <mat-card class="twofa-card">
        <mat-card-header>
          <mat-card-title>Configurar Autenticación 2FA</mat-card-title>
          <mat-card-subtitle>Protege tu cuenta con verificación en dos pasos</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <mat-stepper [linear]="true" #stepper>
            <!-- Paso 1: Instalar App -->
            <mat-step label="Instalar Aplicación" [stepControl]="step1Form">
              <form [formGroup]="step1Form">
                <div class="step-content">
                  <h3>1. Instala una aplicación de autenticación</h3>
                  <p>Recomendamos:</p>
                  <ul>
                    <li><strong>Google Authenticator</strong> (iOS/Android)</li>
                    <li><strong>Microsoft Authenticator</strong> (iOS/Android)</li>
                    <li><strong>Authy</strong> (iOS/Android/Desktop)</li>
                  </ul>
                  
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>¿Ya tienes una app instalada?</mat-label>
                    <mat-select formControlName="hasApp">
                      <mat-option value="yes">Sí, tengo una app de autenticación</mat-option>
                      <mat-option value="no">No, necesito instalar una</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                
                <div class="step-actions">
                  <button mat-raised-button color="primary" 
                          [disabled]="!step1Form.valid"
                          (click)="nextStep()">
                    Siguiente
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Paso 2: Escanear QR -->
            <mat-step label="Escanear Código QR" [stepControl]="step2Form">
              <form [formGroup]="step2Form">
                <div class="step-content">
                  <h3>2. Escanea el código QR</h3>
                  <p>Abre tu aplicación de autenticación y escanea este código:</p>
                  
                  <div class="qr-container">
                    <div class="qr-placeholder">
                      <mat-icon style="font-size: 120px; width: 120px; height: 120px;">qr_code</mat-icon>
                      <p>Código QR para autenticación 2FA</p>
                      <p><small>{{ qrCodeData }}</small></p>
                    </div>
                  </div>
                  
                  <div class="manual-entry">
                    <h4>¿No puedes escanear?</h4>
                    <p>Ingresa este código manualmente:</p>
                    <div class="secret-code">
                      <code>{{ secretKey }}</code>
                      <button mat-icon-button (click)="copySecret()" matTooltip="Copiar código">
                        <mat-icon>content_copy</mat-icon>
                      </button>
                    </div>
                  </div>
                  
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>¿Has añadido la cuenta?</mat-label>
                    <mat-select formControlName="accountAdded">
                      <mat-option value="yes">Sí, he añadido la cuenta</mat-option>
                      <mat-option value="no">No, tengo problemas</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                
                <div class="step-actions">
                  <button mat-button (click)="stepper.previous()">Anterior</button>
                  <button mat-raised-button color="primary" 
                          [disabled]="!step2Form.valid"
                          (click)="nextStep()">
                    Siguiente
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Paso 3: Verificar Código -->
            <mat-step label="Verificar Código" [stepControl]="step3Form">
              <form [formGroup]="step3Form">
                <div class="step-content">
                  <h3>3. Verifica tu configuración</h3>
                  <p>Ingresa el código de 6 dígitos que aparece en tu aplicación:</p>
                  
                  <mat-form-field appearance="outline" class="verification-code">
                    <mat-label>Código de verificación</mat-label>
                    <input matInput 
                           formControlName="verificationCode" 
                           placeholder="123456"
                           maxlength="6"
                           pattern="[0-9]{6}">
                    <mat-error *ngIf="step3Form.get('verificationCode')?.hasError('required')">
                      El código es requerido
                    </mat-error>
                    <mat-error *ngIf="step3Form.get('verificationCode')?.hasError('pattern')">
                      Debe ser un código de 6 dígitos
                    </mat-error>
                  </mat-form-field>
                  
                  <div class="backup-codes" *ngIf="showBackupCodes">
                    <h4>Códigos de respaldo</h4>
                    <p>Guarda estos códigos en un lugar seguro. Puedes usarlos si pierdes acceso a tu dispositivo:</p>
                    <div class="codes-grid">
                      <code *ngFor="let code of backupCodes">{{ code }}</code>
                    </div>
                    <button mat-button (click)="downloadBackupCodes()">
                      <mat-icon>download</mat-icon>
                      Descargar códigos
                    </button>
                  </div>
                </div>
                
                <div class="step-actions">
                  <button mat-button (click)="stepper.previous()">Anterior</button>
                  <button mat-raised-button color="primary" 
                          [disabled]="!step3Form.valid || isVerifying"
                          (click)="verifyAndComplete()">
                    {{ isVerifying ? 'Verificando...' : 'Completar configuración' }}
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
    .twofa-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .twofa-card {
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

    .qr-container {
      display: flex;
      justify-content: center;
      margin: 24px 0;
      padding: 20px;
      border: 2px dashed #ccc;
      border-radius: 8px;
    }

    .qr-placeholder {
      text-align: center;
      color: #666;
    }

    .qr-placeholder mat-icon {
      color: #999;
      margin-bottom: 8px;
    }

    .manual-entry {
      margin-top: 24px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .secret-code {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }

    .secret-code code {
      background-color: #e0e0e0;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      flex: 1;
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

    .backup-codes {
      margin-top: 24px;
      padding: 16px;
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
    }

    .codes-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin: 16px 0;
    }

    .codes-grid code {
      padding: 8px;
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      text-align: center;
      font-family: 'Courier New', monospace;
    }

    mat-card-header {
      text-align: center;
      margin-bottom: 24px;
    }

    h3 {
      color: #333;
      margin-bottom: 16px;
    }

    h4 {
      color: #555;
      margin: 16px 0 8px 0;
    }

    ul {
      margin: 16px 0;
      padding-left: 20px;
    }

    li {
      margin-bottom: 8px;
    }
  `]
})
export class TwoFactorSetupComponent implements OnInit {
  step1Form: FormGroup;
  step2Form: FormGroup;
  step3Form: FormGroup;
  
  qrCodeData = '';
  secretKey = '';
  backupCodes: string[] = [];
  showBackupCodes = false;
  isVerifying = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.step1Form = this.fb.group({
      hasApp: ['', Validators.required]
    });

    this.step2Form = this.fb.group({
      accountAdded: ['', Validators.required]
    });

    this.step3Form = this.fb.group({
      verificationCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnInit() {
    this.generateQRCode();
  }

  generateQRCode() {
    // Simulate API call to get QR code data
    const user = this.authService.getCurrentUser();
    this.secretKey = this.generateSecretKey();
    const issuer = 'Casa%20de%20Valores';
    const accountName = user?.email || 'usuario@casadevalores.com';
    
    this.qrCodeData = `otpauth://totp/${issuer}:${accountName}?secret=${this.secretKey}&issuer=${issuer}`;
  }

  generateSecretKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  nextStep() {
    // Proceed to next step
  }

  copySecret() {
    navigator.clipboard.writeText(this.secretKey).then(() => {
      this.snackBar.open('Código copiado al portapapeles', 'Cerrar', { duration: 2000 });
    });
  }

  verifyAndComplete() {
    if (this.step3Form.valid) {
      this.isVerifying = true;
      const code = this.step3Form.get('verificationCode')?.value;
      
      // Simulate API call to verify 2FA
      setTimeout(() => {
        // Generate backup codes
        this.backupCodes = this.generateBackupCodes();
        this.showBackupCodes = true;
        this.isVerifying = false;
        
        this.snackBar.open('2FA configurado exitosamente', 'Cerrar', { duration: 3000 });
        
        // Redirect after a delay to show backup codes
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 5000);
      }, 2000);
    }
  }

  downloadBackupCodes() {
    const content = this.backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'casa-valores-backup-codes.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}