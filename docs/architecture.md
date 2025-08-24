# Stocker Architecture Document

## Introduction
Este documento define la arquitectura general de Stocker, alineada con el PRD y el Project Brief. Cubre decisiones de backend (BaaS con Supabase), frontend (React + Vite + TS + Tailwind) y consideraciones transversales.

Starter Template / Proyecto existente: N/A (greenfield). Monorepo con npm workspaces. Despliegue queda fuera del alcance por ahora (según preferencia), pero se contemplan decisiones compatibles con Vercel/Netlify + Supabase a futuro.

### Change Log
| Date | Version | Description | Author |
|---|---|---|---|
| 2025-08-22 | 0.1 | Borrador inicial de arquitectura | BMAD Assistant |

## High Level Architecture
### Technical Summary
- Estilo: Monolito ligero en frontend (SPA/MPA) + BaaS (Supabase) con modularidad para crecer a micro frontends/servicios.
- Componentes clave: Web App (React/Vite/TS), Supabase (Auth, Postgres, Realtime, Storage), librerías de UI/estado/pruebas.
- Patrón de datos: Acceso a Postgres vía supabase-js; consultas paginadas y con índices; uso selectivo de Realtime.
- Relación con PRD: Optimiza entrega rápida de MVP, mantiene escalabilidad y calidad (pruebas y tipado estricto).

### High Level Overview
1) Arquitectura principal: Monolito ligero (frontend) + BaaS (Supabase).
2) Estructura de repo: Monorepo (npm workspaces).
3) Service architecture: Módulos de dominio (productos, categorías, movimientos, dashboard, auth/roles).
4) Flujo principal: Usuario -> Web App -> Supabase (Auth) -> Postgres (datos) -> Realtime/Storage cuando aplique.
5) Decisiones clave: Tipado TS estricto, RLS en Postgres para seguridad, pruebas desde el inicio.

### High Level Project Diagram (Mermaid)
```mermaid
graph TD
  U[Usuario] --> W[Web App (React + Vite + TS)]
  W -->|Auth| A[Supabase Auth]
  W -->|CRUD / Query| DB[(Supabase Postgres)]
  W -->|Realtime (selectivo)| RT[Supabase Realtime]
  W -->|Archivos (futuro)| ST[Supabase Storage]
  W -->|Export CSV| EX[Export Service (local/lib)]
  A --> DB
```

### Architectural and Design Patterns (propuestos)
- Módulos por dominio en frontend para aislar responsabilidades — Rationale: facilita escalado y mantenibilidad.
- Repository/Service layer en cliente para acceso a datos (supabase-js) — Rationale: desacopla UI de data access, facilita pruebas.
- Feature-based folder structure + UI components reutilizables — Rationale: coherencia y reuso.
- State/data fetching con TanStack Query — Rationale: caching, sincronización y estados de carga/errores consistentes.
- RLS en Postgres y control de permisos por rol — Rationale: seguridad desde el diseño.

## Tech Stack (propuesto para aprobación)
### Cloud Infrastructure
- Provider: Supabase
- Key Services: Auth, Postgres, Realtime, Storage (opcional en MVP)
- Regions: a definir según cercanía de usuarios (p.ej., US/EU)

### Technology Stack Table (versiones propuestas; confirmar)
| Category | Technology | Version | Purpose | Rationale |
|---|---|---|---|---|
| Language | TypeScript | 5.6.x | Lenguaje principal | Tipado estricto y tooling maduro |
| Runtime | Node.js | 22.14.0 | Tooling/build | Compatibilidad con entorno actual |
| Framework FE | React | 18.3.x | UI | Ecosistema, madurez, soporte |
| Build Tool | Vite | 5.x | Dev/build | Rápido, DX excelente |
| Styling | Tailwind CSS | 3.4.x | Estilos | Productividad, consistencia visual |
| Router | React Router | 6.26.x | Routing | Estándar de facto en React SPA |
| Data Fetching | @tanstack/react-query | 5.x | Cache/fetch | Estados, reintentos, sincronización |
| Forms | react-hook-form | 7.x | Formularios | Performance y DX |
| Supabase SDK | @supabase/supabase-js | 2.x | BaaS SDK | Integración Auth/DB/Realtime |
| i18n | i18next | 23.x | Internacionalización | Escalable, ecosistema amplio |
| Charts (MVP) | recharts o chart.js | 2.x/4.x | Gráficas básicas | Peso razonable, simple |
| Lint | ESLint | 9.x | Calidad de código | Reglas y consistencia |
| Formatter | Prettier | 3.x | Formato | Consistencia |
| Tests Unit | Jest | 29.x | Unit testing | Ecosistema maduro |
| Tests UI | @testing-library/react | 14.x | Integración | Mejores prácticas de testing |
| E2E | Cypress | 13.x | E2E | Flujos críticos fin a fin |

Notas: preferencia explícita por npm (workspaces). Despliegue ignorado en esta fase.

## Data Models (conceptual inicial)
### Product
- id (uuid), name, sku (único), category_id, price, status, created_at, updated_at

### Category
- id (uuid), name (único), description, status, created_at, updated_at

### InventoryMovement
- id (uuid), product_id, type (in|out|adjust), quantity, reason, note, moved_at, user_id, counterparty_id (opcional), created_at

### Supplier / Customer (básico)
- id (uuid), name, contact_info, status, created_at, updated_at

### Role / User meta
- role (admin|user), mapping por user_id; políticas RLS en tablas sensibles

Relaciones clave: Category 1..N Product; Product 1..N InventoryMovement; (Supplier|Customer) 1..N InventoryMovement (opcional).

## Components (frontend lógicos)
- Auth & Session Guard
- Dashboard (métricas simples)
- Products (list/detail/form)
- Categories (list/form)
- Movements (form/historial)
- Settings (umbrales/roles básicos)
- Data Access Layer (supabase client + repos)
- Utils (i18n, formatos, csv export)

## External APIs
- MVP: Solo Supabase. Exportación CSV local (lib). PDF/Excel y Stripe quedan post-MVP.

## Security & Compliance
- Supabase Auth; RLS y políticas por rol.
- Validaciones en cliente; sanitización de entradas.
- Preparación para GDPR si escala a SaaS (control de datos y baja de usuarios).

## Non-Functional Considerations
- Performance: UI < 200ms en interacciones típicas; registro < 10s E2E.
- Observabilidad: logging de errores en cliente; plan para Sentry post-MVP.
- Accesibilidad: objetivo WCAG AA progresivo.

## Next Steps
1) Confirmar versiones propuestas del stack (o ajustarlas) y cerrar tabla Tech Stack.
2) Acordar modelo de datos definitivo (atributos obligatorios/índices/constraints) e iniciar esquema en Supabase.
3) Definir estructura de monorepo (workspaces npm) y scripts iniciales.
4) Plan de historias listo para ejecución del Epic 1 (bootstrap + auth + roles + dashboard canario).