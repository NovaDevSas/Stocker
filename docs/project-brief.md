# Project Brief: Stocker

## Executive Summary
Stocker es una aplicación web modular de gestión de inventarios para PyMEs que combina escalabilidad, diseño moderno y flujos optimizados para registrar movimientos, consultar existencias en tiempo real y generar reportes básicos de manera ágil.

## Problem Statement
- Desorganización en el control de inventarios.
- Procesos manuales que generan errores, sobrecostos y pérdidas.
- Falta de visibilidad en tiempo real de existencias y movimientos.
- Herramientas actuales (hojas de cálculo u opciones genéricas) no escalan bien ni se adaptan al flujo de cada negocio.

## Proposed Solution
- Plataforma web responsive con enfoque modular para crecer por funciones.
- Núcleo con CRUD de productos y categorías, registro de movimientos (entradas/salidas) y dashboard básico.
- Autenticación y roles (admin/usuario) con Supabase Auth; base de datos PostgreSQL (Supabase) preparada para métricas y reportes simples.
- UX moderna y minimalista, con paleta que incluye salmón y colores complementarios.

## Target Users
- Dueños de pequeñas y medianas empresas.
- Administradores de almacén/bodega.
- Personal de logística.
- Vendedores que requieren consultar stock en tiempo real.

### Casos de uso clave
- Registrar entradas y salidas de inventario.
- Consultar existencias en tiempo real.
- Generar reportes básicos (productos más vendidos, rotación de inventario).
- Gestionar proveedores y clientes vinculados al stock.
- Control de alertas por bajo inventario.

## Goals & Success Metrics
### Objetivos de negocio
- Construir una solución modular y escalable para gestión de inventarios.
- Validar un MVP rápido que pueda evolucionar a SaaS.
- Proporcionar una experiencia de usuario moderna, ágil y adaptable.

### Métricas de éxito (MVP)
- Tiempo promedio de registro de inventario < 10s.
- Reducción de errores en inventario manual ≥ 30%.
- ≥ 20 usuarios activos en pruebas piloto.
- > 80% de feedback positivo en usabilidad (encuestas internas).

## MVP Scope
### Core Features (Must Have)
- CRUD de productos.
- CRUD de categorías.
- Registro de movimientos (entradas/salidas).
- Dashboard con métricas básicas.
- Autenticación de usuarios (Supabase Auth).
- Roles básicos (admin / usuario estándar).

### Fuera de alcance (MVP)
- Reportes avanzados o BI.
- Integración con sistemas ERP.
- Aplicación móvil nativa.
- Automatizaciones con IoT (lectores de código de barras avanzados).

### Criterios de éxito del MVP
- Flujo estable y medible para registrar movimientos y consultar existencias en tiempo real.
- Seguridad básica con control de acceso por roles.
- Interfaz usable y responsiva en desktop y mobile.

## Post-MVP Vision
- Reportes avanzados (BI ligero), exportaciones a PDF/Excel.
- Integración con ERP y pasarela de pago (Stripe) si se convierte en SaaS.
- Módulos adicionales: multi-almacén, órdenes de compra, auditoría y trazabilidad.
- Soporte de hardware (lectores de código de barras) y automatizaciones.

## Technical Considerations
### Platform Requirements
- Target Platforms: Web responsive (desktop + mobile).
- Browser/OS: Soporte moderno (Chrome, Edge, Firefox, Safari móvil/desktop recientes).
- Performance: Interacciones críticas < 200ms en UI; registros < 10s end-to-end.

### Technology Preferences
- Frontend: React + Vite (TypeScript), TailwindCSS para estilos.
- Backend: Supabase (Postgres + Auth + Realtime).
- Base de datos/Almacenamiento: PostgreSQL en Supabase.
- Hosting/Infraestructura: Vercel o Netlify (frontend) + Supabase (backend). (Ignorar despliegue por ahora.)

### Architecture Considerations
- Repository Structure: Monorepo (npm workspaces inicialmente; evaluar pnpm/Turborepo más adelante).
- Service Architecture: Monolito ligero inicial, con modularidad para futuros micro frontends/microservicios.
- Integraciones: Generación PDF/Excel; Stripe futuro.
- Seguridad/Compliance: Diseño seguro desde el inicio; preparación para GDPR si escala a SaaS.

## Constraints & Assumptions
### Constraints
- Timeline: MVP en 6–8 semanas con equipo reducido.
- Presupuesto: Ajustado al alcance MVP; priorizar foco en funcionalidades esenciales.
- Recursos: Equipo pequeño; apalancar plantillas, componentes y buenas prácticas para acelerar.
- Técnicos: Escalabilidad de Supabase a vigilar (índices/consultas), i18n básico en español.

### Key Assumptions
- Los usuarios aceptarán migrar desde hojas de cálculo si la UX es clara y aporta valor inmediato.
- La modularidad permitirá incorporar nuevas funcionalidades sin reescrituras mayores.
- Los límites gratuitos/planes iniciales de Supabase serán suficientes durante el piloto.

## Risks & Open Questions
### Key Risks
- Adopción lenta por parte de usuarios tradicionales.
- Sobrecarga técnica si se integran módulos antes de tiempo.
- Escalabilidad en Supabase sin optimización de índices/consultas.

### Open Questions
- Detalle de paleta y branding (tokens de color, tipografías, logotipo).
- Reglas de roles exactas (qué puede ver/hacer cada rol).
- Definición final de modelos (producto, categoría, movimiento, proveedor, cliente) y sus relaciones.
- ¿Habrá multi-almacén en el MVP o post-MVP?
- ¿Necesidades de auditoría y trazabilidad por registro desde el MVP?

## Next Steps
1. Generar el PRD inicial a partir de este brief (sección por sección) y acordar requerimientos funcionales (FR) y no funcionales (NFR).
2. Definir epics y ordenar historias para el MVP (vertical slices ejecutables por agente/desarrollador en 2–4h).
3. Especificar el stack con versiones concretas (evitar "latest") y cerrar decisiones técnicas del PRD.
4. Bocetar modelo de datos inicial (productos, categorías, movimientos, proveedores, clientes) y criterios de índices.
5. Preparar el monorepo base (React + Vite + TS + Tailwind) y conexión a Supabase (Auth + Postgres).
6. Configurar pruebas (Jest, Testing Library, Cypress) y utilidades de desarrollo (ESLint, Prettier). (Despliegue se ignora por ahora.)