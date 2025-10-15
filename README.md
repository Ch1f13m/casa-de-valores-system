# Casa de Valores Information System

Sistema de información integral para casa de valores que maneja trading de valores, gestión de portafolios y operaciones financieras.

## Arquitectura

- **Frontend**: Angular 17+ con PWA
- **Backend**: Microservicios Python con FastAPI y Django
- **Bases de Datos**: MySQL (transaccional), MongoDB (documentos), Redis (cache)
- **Message Queue**: Celery con RabbitMQ
- **Containerización**: Docker y Docker Compose

## Estructura del Proyecto

```
codigo/
├── frontend/                 # Angular PWA Application
├── backend/                  # Python Microservices
│   ├── api-gateway/         # API Gateway Service
│   ├── user-service/        # User Management Service
│   ├── trading-service/     # Trading Service
│   ├── portfolio-service/   # Portfolio Management Service
│   ├── market-data-service/ # Market Data Service
│   ├── risk-service/        # Risk Management Service
│   ├── compliance-service/  # Compliance Service
│   └── shared/              # Shared utilities and models
├── infrastructure/          # Docker, K8s, CI/CD configs
├── docs/                   # Documentation
└── tests/                  # Integration and E2E tests
```

## Requisitos del Sistema

- Python 3.11+
- Node.js 18+
- Docker y Docker Compose
- MySQL 8.0+
- MongoDB 6.0+
- Redis 7.0+

## Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd casa-de-valores-system
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con las configuraciones necesarias
```

### 3. Levantar servicios con Docker Compose
```bash
docker-compose up -d
```

### 4. Instalar dependencias del frontend
```bash
cd frontend
npm install
npm start
```

## Desarrollo

### Backend Services
Cada microservicio tiene su propio directorio con:
- `main.py` - Punto de entrada de la aplicación
- `models/` - Modelos de datos
- `services/` - Lógica de negocio
- `api/` - Endpoints REST
- `requirements.txt` - Dependencias Python

### Frontend
- Angular 17+ con TypeScript
- PWA configurado para acceso offline
- Diseño responsive con Angular Material

## Testing

```bash
# Backend tests
pytest backend/

# Frontend tests
cd frontend && npm test

# E2E tests
npm run e2e
```

## Deployment

El sistema está configurado para deployment con:
- Docker containers
- Kubernetes manifests
- CI/CD pipeline con GitHub Actions

## Licencia

Proyecto académico - Universidad