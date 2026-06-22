# EcoCampus 🌱

PWA para la digitalización del seguimiento y gestión de estaciones de reciclaje (*bote-mallas*) del programa **Universidad Sustentable** de la Universidad Tecnológica de Ciudad Juárez (UTCJ).

---

## Equipo

| Nombre | Rol | Rama |
|---|---|---|
| Julio Rafael Camacho Perea | Base de datos + Deployment | `julio/db` |
| Barraza Ramírez Abel Andrés | Backend (Node.js + Express) | `abel/backend` |
| Araiza López Diego Armando | Frontend + UI/UX + Mapa | `diego/frontend` |
| Ahjuech Ramos David | Frontend + Integración API | `david/frontend` |

---

## Stack

- **Frontend:** React + Vite (PWA) — Vercel
- **Backend:** Node.js + Express — Railway
- **Base de datos:** PostgreSQL — Supabase
- **Autenticación:** Supabase Auth
- **Almacenamiento de imágenes:** Supabase Storage
- **Mapa:** Leaflet.js

---

## Estructura del repo

```
EcoCampus/
├── db/
│   └── schema.sql        # Schema de base de datos (tablas, triggers, RLS)
├── backend/              # Node.js + Express (rama abel/backend)
├── frontend/             # React + Vite PWA (ramas diego y david)
├── .env.example          # Plantilla de variables de entorno
├── .gitignore
└── README.md
```

---

## Flujo de ramas

```
julio/db ──────┐
abel/backend ──┤──→ qa (revisión Abel) ──→ main
diego/frontend ┤
david/frontend ─┘
```

- Cada integrante trabaja en su rama personal
- Para integrar: hacer PR hacia `qa`
- Abel revisa en `qa` y hace merge a `main` cuando está aprobado
- **Nunca hacer push directo a `main`**

---

## Configuración local

### 1. Clonar el repo

```bash
git clone https://github.com/Abelatzo/EcoCampus.git
cd EcoCampus
```

### 2. Cambiar a tu rama

```bash
git checkout julio/db       # Julio
git checkout abel/backend   # Abel
git checkout diego/frontend # Diego
git checkout david/frontend # David
```

### 3. Variables de entorno

```bash
cp .env.example .env
# Edita .env con los valores reales (pídelos a Julio)
```

> ⚠️ **IMPORTANTE:** Nunca subas el archivo `.env` al repo. Está en `.gitignore` por seguridad.

### 4. Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

---

## Base de datos

El schema está en `db/schema.sql`. Incluye:

- Tablas: `usuarios`, `bote_mallas`, `reportes`
- Triggers de `updated_at` automático
- Trigger de sincronización de estatus entre reportes y bote_mallas
- Row Level Security (RLS) con políticas por rol

### Roles

| Rol | Permisos |
|---|---|
| `estudiante` | Ver mapa, crear reportes, ver todos los reportes activos |
| `administrador` | Todo lo anterior + cambiar estatus de reportes + gestionar bote_mallas |

---

## Seguridad

- Las credenciales de Supabase **nunca** van en el código
- Todas las variables sensibles van en `.env` (local) o en el panel de Railway/Vercel
- Row Level Security habilitado en todas las tablas
- Autenticación manejada por Supabase Auth + JWT verificado en Express

---

## Contacto

Para acceso a credenciales de Supabase o Railway, contactar a **Julio Rafael Camacho Perea**.
