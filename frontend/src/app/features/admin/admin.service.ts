import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'TRADER' | 'CLIENT';
  active: boolean;
  lastLogin: Date;
  createdAt: Date;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
  dbConnections: number;
  dbSize: string;
  dbQueriesPerSec: number;
  lastBackup: Date;
  apiRequests: number;
  apiAvgResponseTime: number;
  apiErrors: number;
  activeUsers: number;
  usersToday: number;
  usersThisMonth: number;
  totalUsers: number;
  ordersToday: number;
  volumeToday: number;
  pendingOrders: number;
  successRate: number;
  services: ServiceStatus[];
}

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  uptime: string;
}

export interface AuditLog {
  id: number;
  timestamp: Date;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  eventType: string;
  user: string;
  description: string;
  ipAddress: string;
  metadata?: any;
}

export interface SystemConfig {
  // General
  systemName: string;
  timezone: string;
  defaultLanguage: string;
  defaultCurrency: string;
  
  // Security
  require2FA: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  minPasswordLength: number;
  requirePasswordChange: boolean;
  enableIpWhitelist: boolean;
  
  // Trading
  tradingHoursStart: string;
  tradingHoursEnd: string;
  commissionRate: number;
  minOrderAmount: number;
  maxOrderAmount: number;
  enableAfterHoursTrading: boolean;
  
  // Notifications
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enablePushNotifications: boolean;
  adminEmail: string;
  
  // Backups
  enableAutoBackup: boolean;
  backupFrequency: string;
  backupRetentionDays: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:8000/api/admin';

  constructor(private http: HttpClient) {}

  // Users
  getUsers(): Observable<User[]> {
    // Mock data for development
    return of([
      {
        id: 1,
        username: 'admin',
        fullName: 'Administrator',
        email: 'admin@casadevalores.com',
        role: 'ADMIN' as const,
        active: true,
        lastLogin: new Date('2025-11-03T10:30:00'),
        createdAt: new Date('2024-01-01')
      },
      {
        id: 2,
        username: 'jdoe',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        role: 'TRADER' as const,
        active: true,
        lastLogin: new Date('2025-11-03T09:15:00'),
        createdAt: new Date('2024-06-15')
      },
      {
        id: 3,
        username: 'msmith',
        fullName: 'Maria Smith',
        email: 'maria.smith@example.com',
        role: 'CLIENT' as const,
        active: true,
        lastLogin: new Date('2025-11-02T16:45:00'),
        createdAt: new Date('2024-08-20')
      },
      {
        id: 4,
        username: 'rjohnson',
        fullName: 'Robert Johnson',
        email: 'robert.johnson@example.com',
        role: 'MANAGER' as const,
        active: true,
        lastLogin: new Date('2025-11-03T08:00:00'),
        createdAt: new Date('2024-03-10')
      },
      {
        id: 5,
        username: 'lwilliams',
        fullName: 'Linda Williams',
        email: 'linda.williams@example.com',
        role: 'CLIENT' as const,
        active: false,
        lastLogin: new Date('2025-10-15T14:20:00'),
        createdAt: new Date('2024-09-05')
      }
    ]).pipe(delay(500));
    
    // Production: return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  toggleUserStatus(userId: number): Observable<any> {
    return of({ success: true }).pipe(delay(300));
    // Production: return this.http.patch(`${this.apiUrl}/users/${userId}/toggle-status`, {});
  }

  resetUserPassword(userId: number): Observable<any> {
    return of({ success: true }).pipe(delay(300));
    // Production: return this.http.post(`${this.apiUrl}/users/${userId}/reset-password`, {});
  }

  deleteUser(userId: number): Observable<any> {
    return of({ success: true }).pipe(delay(300));
    // Production: return this.http.delete(`${this.apiUrl}/users/${userId}`);
  }

  // System Metrics
  getSystemMetrics(): Observable<SystemMetrics> {
    // Mock data for development
    return of({
      cpu: 45,
      memory: 62,
      disk: 38,
      uptime: '15 días 7 horas',
      dbConnections: 23,
      dbSize: '5.2 GB',
      dbQueriesPerSec: 1250,
      lastBackup: new Date('2025-11-03T02:00:00'),
      apiRequests: 3420,
      apiAvgResponseTime: 125,
      apiErrors: 3,
      activeUsers: 47,
      usersToday: 152,
      usersThisMonth: 2340,
      totalUsers: 8450,
      ordersToday: 234,
      volumeToday: 1250000,
      pendingOrders: 12,
      successRate: 98.5,
      services: [
        { name: 'API Gateway', status: 'running' as const, uptime: '15 días' },
        { name: 'User Service', status: 'running' as const, uptime: '15 días' },
        { name: 'Portfolio Service', status: 'running' as const, uptime: '15 días' },
        { name: 'Trading Service', status: 'running' as const, uptime: '15 días' },
        { name: 'Market Data', status: 'running' as const, uptime: '15 días' },
        { name: 'Risk Service', status: 'running' as const, uptime: '14 días' }
      ]
    }).pipe(delay(500));
    
    // Production: return this.http.get<SystemMetrics>(`${this.apiUrl}/metrics`);
  }

  exportMetrics(): Observable<any> {
    return of({ success: true }).pipe(delay(300));
    // Production: return this.http.post(`${this.apiUrl}/metrics/export`, {});
  }

  // Audit Logs
  getAuditLogs(): Observable<AuditLog[]> {
    // Mock data for development
    const logs: AuditLog[] = [];
    const eventTypes = [
      'USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_UPDATED',
      'ORDER_CREATED', 'ORDER_EXECUTED', 'CONFIG_CHANGED', 'SECURITY_ALERT'
    ];
    const levels: ('INFO' | 'WARNING' | 'ERROR' | 'CRITICAL')[] = ['INFO', 'INFO', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
    const users = ['admin', 'jdoe', 'msmith', 'rjohnson'];
    
    for (let i = 0; i < 50; i++) {
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - Math.floor(Math.random() * 48));
      
      logs.push({
        id: i + 1,
        timestamp,
        level: levels[Math.floor(Math.random() * levels.length)],
        eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        user: users[Math.floor(Math.random() * users.length)],
        description: `Evento de prueba #${i + 1}`,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`
      });
    }
    
    return of(logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())).pipe(delay(500));
    
    // Production: return this.http.get<AuditLog[]>(`${this.apiUrl}/logs`);
  }

  exportLogs(logs: AuditLog[]): Observable<any> {
    return of({ success: true }).pipe(delay(300));
    // Production: return this.http.post(`${this.apiUrl}/logs/export`, { logs });
  }

  // Configuration
  getConfiguration(): Observable<SystemConfig> {
    return of({
      systemName: 'Casa de Valores',
      timezone: 'America/Bogota',
      defaultLanguage: 'es',
      defaultCurrency: 'USD',
      require2FA: false,
      sessionTimeout: 30,
      maxLoginAttempts: 3,
      minPasswordLength: 8,
      requirePasswordChange: true,
      enableIpWhitelist: false,
      tradingHoursStart: '09:30',
      tradingHoursEnd: '16:00',
      commissionRate: 0.25,
      minOrderAmount: 100,
      maxOrderAmount: 1000000,
      enableAfterHoursTrading: false,
      enableEmailNotifications: true,
      enableSmsNotifications: false,
      enablePushNotifications: true,
      adminEmail: 'admin@casadevalores.com',
      enableAutoBackup: true,
      backupFrequency: 'daily',
      backupRetentionDays: 30
    }).pipe(delay(300));
    
    // Production: return this.http.get<SystemConfig>(`${this.apiUrl}/config`);
  }

  updateConfiguration(config: SystemConfig): Observable<any> {
    return of({ success: true }).pipe(delay(300));
    // Production: return this.http.put(`${this.apiUrl}/config`, config);
  }

  getDefaultConfiguration(): Observable<SystemConfig> {
    return this.getConfiguration();
  }

  createBackup(): Observable<any> {
    return of({ success: true }).pipe(delay(2000));
    // Production: return this.http.post(`${this.apiUrl}/backup`, {});
  }
}
