import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { AuthService } from './auth.service';

export interface SessionInfo {
  sessionId: string;
  device: string;
  location: string;
  loginTime: Date;
  lastActivity: Date;
  isActive: boolean;
  isCurrent: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private sessionTimeout = 30 * 60 * 1000; // 30 minutos en millisegundos
  private warningTime = 5 * 60 * 1000; // 5 minutos antes del timeout
  private activityTimer: any;
  private warningTimer: any;
  
  private sessionWarningSubject = new BehaviorSubject<boolean>(false);
  private activeSessions = new BehaviorSubject<SessionInfo[]>([]);
  
  public sessionWarning$ = this.sessionWarningSubject.asObservable();
  public activeSessions$ = this.activeSessions.asObservable();

  constructor(private authService: AuthService) {
    this.initializeActivityTracking();
    this.loadActiveSessions();
  }

  /**
   * Inicializa el seguimiento de actividad del usuario
   */
  private initializeActivityTracking() {
    // Eventos que indican actividad del usuario
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => this.resetActivityTimer(), true);
    });

    this.resetActivityTimer();
  }

  /**
   * Reinicia el timer de actividad
   */
  private resetActivityTimer() {
    // Limpiar timers existentes
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }

    // Ocultar advertencia si está visible
    this.sessionWarningSubject.next(false);

    // Actualizar última actividad
    this.updateLastActivity();

    // Configurar advertencia antes del timeout
    this.warningTimer = setTimeout(() => {
      this.sessionWarningSubject.next(true);
    }, this.sessionTimeout - this.warningTime);

    // Configurar logout automático
    this.activityTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.sessionTimeout);
  }

  /**
   * Maneja el timeout de la sesión
   */
  private handleSessionTimeout() {
    this.sessionWarningSubject.next(false);
    this.authService.logout();
    // Mostrar mensaje de sesión expirada
    this.showSessionExpiredMessage();
  }

  /**
   * Extiende la sesión actual
   */
  extendSession() {
    this.resetActivityTimer();
    this.sessionWarningSubject.next(false);
  }

  /**
   * Actualiza la última actividad en localStorage
   */
  private updateLastActivity() {
    const currentSession = this.getCurrentSession();
    if (currentSession) {
      currentSession.lastActivity = new Date();
      this.updateSessionInfo(currentSession);
    }
  }

  /**
   * Carga las sesiones activas del usuario
   */
  loadActiveSessions() {
    // Simular carga de sesiones activas desde el servidor
    const sessions: SessionInfo[] = [
      {
        sessionId: this.generateSessionId(),
        device: this.getDeviceInfo(),
        location: 'Bogotá, Colombia',
        loginTime: new Date(),
        lastActivity: new Date(),
        isActive: true,
        isCurrent: true
      },
      {
        sessionId: 'sess_' + Math.random().toString(36).substr(2, 9),
        device: 'iPhone 12 - Safari',
        location: 'Medellín, Colombia',
        loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        lastActivity: new Date(Date.now() - 30 * 60 * 1000), // 30 min atrás
        isActive: true,
        isCurrent: false
      },
      {
        sessionId: 'sess_' + Math.random().toString(36).substr(2, 9),
        device: 'Windows 11 - Chrome',
        location: 'Cali, Colombia',
        loginTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 día atrás
        lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
        isActive: false,
        isCurrent: false
      }
    ];

    this.activeSessions.next(sessions);
  }

  /**
   * Termina una sesión específica
   */
  terminateSession(sessionId: string): Observable<boolean> {
    return new Observable(observer => {
      const sessions = this.activeSessions.value;
      const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
      
      if (sessionIndex !== -1) {
        const session = sessions[sessionIndex];
        
        if (session.isCurrent) {
          // Si es la sesión actual, hacer logout
          this.authService.logout();
          observer.next(true);
        } else {
          // Terminar sesión remota
          session.isActive = false;
          sessions[sessionIndex] = session;
          this.activeSessions.next([...sessions]);
          observer.next(true);
        }
      } else {
        observer.next(false);
      }
      
      observer.complete();
    });
  }

  /**
   * Termina todas las demás sesiones
   */
  terminateAllOtherSessions(): Observable<boolean> {
    return new Observable(observer => {
      const sessions = this.activeSessions.value;
      const updatedSessions = sessions.map(session => ({
        ...session,
        isActive: session.isCurrent ? session.isActive : false
      }));
      
      this.activeSessions.next(updatedSessions);
      observer.next(true);
      observer.complete();
    });
  }

  /**
   * Obtiene la sesión actual
   */
  getCurrentSession(): SessionInfo | null {
    const sessions = this.activeSessions.value;
    return sessions.find(s => s.isCurrent) || null;
  }

  /**
   * Actualiza información de una sesión
   */
  private updateSessionInfo(session: SessionInfo) {
    const sessions = this.activeSessions.value;
    const index = sessions.findIndex(s => s.sessionId === session.sessionId);
    
    if (index !== -1) {
      sessions[index] = session;
      this.activeSessions.next([...sessions]);
    }
  }

  /**
   * Genera un ID único para la sesión
   */
  private generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Obtiene información del dispositivo
   */
  private getDeviceInfo(): string {
    const ua = navigator.userAgent;
    let device = 'Dispositivo desconocido';
    
    if (ua.includes('Windows')) device = 'Windows';
    else if (ua.includes('Mac')) device = 'macOS';
    else if (ua.includes('Linux')) device = 'Linux';
    else if (ua.includes('Android')) device = 'Android';
    else if (ua.includes('iPhone')) device = 'iPhone';
    else if (ua.includes('iPad')) device = 'iPad';
    
    let browser = 'Navegador desconocido';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    
    return `${device} - ${browser}`;
  }

  /**
   * Muestra mensaje de sesión expirada
   */
  private showSessionExpiredMessage() {
    // Este método puede ser implementado para mostrar un modal o notificación
    console.log('Sesión expirada por inactividad');
  }

  /**
   * Configura el tiempo de timeout de sesión
   */
  setSessionTimeout(minutes: number) {
    this.sessionTimeout = minutes * 60 * 1000;
    this.warningTime = Math.min(this.warningTime, this.sessionTimeout - 60000); // Al menos 1 minuto antes
    this.resetActivityTimer();
  }

  /**
   * Obtiene el tiempo restante de la sesión
   */
  getTimeUntilExpiry(): number {
    const currentSession = this.getCurrentSession();
    if (!currentSession) return 0;
    
    const lastActivity = currentSession.lastActivity.getTime();
    const timeElapsed = Date.now() - lastActivity;
    const timeRemaining = this.sessionTimeout - timeElapsed;
    
    return Math.max(0, timeRemaining);
  }

  /**
   * Limpia todos los timers al destruir el servicio
   */
  cleanup() {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }
  }
}