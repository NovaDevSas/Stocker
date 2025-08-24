# Stocker Product Requirements Document (PRD)

## 1. Goals and Background Context

### Goals
- Entregar un MVP funcional de gestión de inventario con flujos clave (CRUD productos/categorías, movimientos, dashboard, auth y roles) en 6–8 semanas.
- Proveer UX moderna/minimalista que reduzca errores y tiempos de registro (<10s por registro).
- Validar tracción con ≥ 20 usuarios activos en piloto, y > 80% de satisfacción de usabilidad.
- Sentar las bases para evolucionar a SaaS modular y escalable.

### Background Context
Stocker busca resolver la desorganización y errores de inventario que sufren PyMEs debido a procesos manuales y herramientas poco estructuradas. Mediante una app web responsive, con Supabase (Postgres + Auth + Realtime) y un frontend React + Vite + TypeScript + Tailwind, el MVP se enfocará en registrar entradas/salidas, consultar existencias en tiempo real, y visualizar métricas básicas, con roles admin/usuario. El enfoque modular permitirá crecer hacia reportes avanzados, integraciones y potencial SaaS.

### Change Log
| Date | Version | Description | Author |
|---|---|---|---|
| 2025-08-22 | 0.1 | Draft inicial del PRD basado en brief | BMAD Assistant |

## 2. Requirements

### Functional (FR)
1. FR1: El sistema debe permitir autenticación de usuarios usando Supabase Auth (email/password) y gestión de sesión segura.
2. FR2: Debe existir gestión de roles básica (admin, usuario estándar) con control de permisos por vista/acción.
3. FR3: CRUD de productos con campos mínimos: nombre, SKU/código, categoría, stock actual, precio estándar, estado (activo/inactivo).
4. FR4: CRUD de categorías con nombre, descripción y estado.
5. FR5: Registro de movimientos de inventario (entrada/salida/ajuste), con referencia a producto, cantidad, motivo/nota, fecha, usuario ejecutor.
6. FR6: Consulta de existencias en tiempo real por producto y por categoría, con filtros/búsqueda.
7. FR7: Dashboard con métricas básicas (productos más vendidos, rotación de inventario simple, alertas por bajo stock configurable).
8. FR8: Gestión de proveedores y clientes vinculados a movimientos (campos básicos: nombre, contacto; opcional en MVP si complica flujo).
9. FR9: Alertas por bajo inventario por producto (umbral configurable a nivel producto o categoría).
10. FR10: i18n inicial en español con capacidad de extensibilidad futura.

### Non Functional (NFR)
1. NFR1: Respuesta de UI < 200ms para interacciones comunes; tiempo de registro end-to-end < 10s.
2. NFR2: Seguridad básica: almacenamiento seguro de credenciales (Supabase), control de acceso basado en rol, validaciones de entrada.
3. NFR3: Disponibilidad razonable para MVP (dependiente de Supabase) y resiliencia ante errores de red.
4. NFR4: Observabilidad mínima: logging de errores en cliente y trazas básicas en backend (p. ej. Sentry en futuro post-MVP).
5. NFR5: Escalabilidad inicial: índices en tablas críticas (productos, movimientos); consultas paginadas y uso eficiente de Realtime.
6. NFR6: Código mantenible: tipado estricto TS, ESLint/Prettier, estructura modular.
7. NFR7: Pruebas: unitarias para lógica, integración para componentes, E2E básicos para flujos críticos (Cypress).

## 3. User Interface Design Goals
- Overall UX Vision: Interfaz limpia, minimalista, con énfasis en velocidad de registro y descubribilidad. Paleta con salmón + complementarios, componentes consistentes (botones, inputs, tablas).
- Key Interaction Paradigms: Búsqueda/filtro rápidos, atajos de teclado para registrar movimientos, tablas con paginación/sorting, feedback inmediato.
- Core Screens: Login, Dashboard, Productos (lista/detalle/edición), Categorías, Movimientos (registro + historial), Proveedores/Clientes (básico), Configuración (umbrales de stock, roles básicos).
- Accessibility: WCAG AA (objetivo aspiracional, verificación progresiva durante MVP según capacidad).
- Branding: Definir tokens de color, tipografías y logotipo (pendiente); usar Tailwind para tokens utilitarios.
- Target Device and Platforms: Web Responsive.

## 4. Technical Assumptions
- Repository Structure: Monorepo (npm workspaces; evaluar pnpm/Turborepo más adelante).
- Service Architecture: Monolito ligero con módulos (facilitando escalar a micro frontends/servicios post-MVP).
- Testing Requirements: Unit + Integration + E2E básicos.
- Additional Assumptions:
  - Frontend: React 18 + Vite + TypeScript + Tailwind.
  - Backend: Supabase (Postgres + Auth + Realtime).
  - Hosting: Vercel/Netlify (frontend), Supabase (backend). Despliegue ignorado por ahora.
  - i18n con soporte inicial español; estructura preparada para más idiomas.

## 5. Epic List
- Epic 1: Fundaciones & Core Infrastructure: Setup monorepo, app React + Vite + TS + Tailwind, conexión Supabase, Auth + roles básicos, canary/dashboard inicial.
- Epic 2: Catálogo Base: CRUD de categorías y productos con validaciones, listados, filtros y detalle.
- Epic 3: Movimientos & Stock: Registro de entradas/salidas/ajustes, cálculo de stock y alertas por umbral.
- Epic 4: Dashboard & Reportes Básicos: Métricas clave (más vendidos, rotación simple), vistas y exportaciones mínimas.
- Epic 5: Proveedores/Clientes (Básico): Entidades y asociación con movimientos (opcional en MVP si bloquea tiempos).

## 6. Epic Details

### Epic 1: Fundaciones & Core Infrastructure
Objetivo: Establecer la base técnica y una primera entrega visible (dashboard canario), con autenticación y roles mínimos.

Story 1.1 - Bootstrap Monorepo y App
As a desarrollador,
I want una estructura de monorepo con app React + Vite + TS + Tailwind,
so that pueda desarrollar el MVP con modularidad y buenas prácticas.
- Acceptance Criteria:
  1: Repositorio monorepo creado con workspaces y scripts básicos.
  2: App React + Vite + TS + Tailwind ejecuta en local y muestra página inicial.
  3: ESLint/Prettier configurados y corriendo en scripts.

Story 1.2 - Supabase Setup + Auth
As a usuario,
I want iniciar sesión con email/password,
so that pueda acceder a la app de forma segura.
- Acceptance Criteria:
  1: Proyecto Supabase creado y variables listas (local).
  2: Auth funcional con registro/login/logout.
  3: Estados de sesión persistentes y guardas de ruta.

Story 1.3 - Roles Básicos
As a admin,
I want definir roles admin/usuario y reglas mínimas,
so that se restrinjan vistas/acciones según rol.
- Acceptance Criteria:
  1: Rol admin puede acceder a configuración.
  2: Rol usuario no puede acceder a configuración.
  3: Políticas RLS en Postgres para proteger datos por rol si aplica.

Story 1.4 - Dashboard Canary
As a usuario,
I want ver un dashboard inicial con métricas vacías/placeholder,
so that valide que la app está funcionando y navegar a módulos.
- Acceptance Criteria:
  1: Vista dashboard accesible tras login.
  2: Navegación a Productos/Categorías/Movimientos.
  3: Layout responsive básico.

### Epic 2: Catálogo Base
Objetivo: Gestionar productos y categorías con flujos CRUD completos.

Story 2.1 - CRUD Categorías
As a admin,
I want crear/editar/listar/eliminar categorías,
so that organice el catálogo.
- Acceptance Criteria:
  1: Form y tabla de categorías con validaciones.
  2: Filtros/búsqueda por nombre/estado.
  3: Persistencia en Postgres.

Story 2.2 - CRUD Productos
As a admin,
I want crear/editar/listar/eliminar productos (con categoría y SKU),
so that mantenga el catálogo controlado.
- Acceptance Criteria:
  1: Validaciones de campos clave (nombre, SKU único).
  2: Paginación, sorting y búsqueda.
  3: Persistencia en Postgres e índices adecuados.

### Epic 3: Movimientos & Stock
Objetivo: Registrar movimientos y mantener stock coherente.

Story 3.1 - Registro de Movimientos
As a usuario,
I want registrar entradas/salidas/ajustes,
so that el stock se actualice correctamente.
- Acceptance Criteria:
  1: Form con tipo de movimiento, cantidad, motivo/nota, fecha, producto.
  2: Actualización de stock atómica y consistente.
  3: Historial de movimientos por producto.

Story 3.2 - Alertas por Bajo Stock
As a usuario,
I want recibir alertas cuando el stock esté por debajo del umbral,
so that pueda reabastecer a tiempo.
- Acceptance Criteria:
  1: Umbral configurable por producto o categoría.
  2: Indicadores visuales en lista y detalle; notificación simple in-app.
  3: Consulta eficiente sin bloqueos.

### Epic 4: Dashboard & Reportes Básicos
Objetivo: Mostrar métricas simples y exportaciones mínimas.

Story 4.1 - Dashboard Métricas
As a usuario,
I want ver métricas clave básicas,
so that entienda el estado del inventario.
- Acceptance Criteria:
  1: Productos más vendidos (cálculo simplificado).
  2: Rotación de inventario (métrica simple definida en doc).
  3: Gráficas/tablas simples con Tailwind + lib de gráficos ligera.

Story 4.2 - Exportaciones mínimas
As a usuario,
I want exportar listados básicos a CSV/Excel,
so that comparta información rápidamente.
- Acceptance Criteria:
  1: Exportar tablas a CSV.
  2: Preparar hook/servicio para exportación a Excel/PDF (post-MVP).

### Epic 5: Proveedores/Clientes (Básico)
Objetivo: Relacionar movimientos con proveedores/clientes.

Story 5.1 - Entidades Básicas
As a admin,
I want gestionar proveedores y clientes básicos,
so that relacione movimientos con contrapartes.
- Acceptance Criteria:
  1: CRUD sencillo de proveedores y clientes.
  2: Asociación opcional en registro de movimiento.
  3: Listados con filtros básicos.

## 7. Next Steps
- Ejecutar PM checklist y QA gate en BMAD cuando el PRD esté validado.
- Preparar prompt para UX Expert y Architect con este PRD.
- Iniciar definición de modelo de datos y arquitectura técnica con versiones exactas.