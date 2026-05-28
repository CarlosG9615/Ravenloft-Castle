# ⚔️ Ravenloft Castle

> Plataforma web interactiva para gestionar partidas de **Dungeons & Dragons**, con herramientas de personalización, combate en tiempo real y comunicación entre jugadores.

---

## 📖 Introducción

Analizando el mercado, detectamos que las herramientas web existentes para D&D no ofrecen una experiencia completa a los jugadores, por ello hemos desarrollado una plataforma con un alto grado de personalización que se diferencia del resto, proporcionando:

- Múltiples **modos de juego** (historia y campañas personalizables)
- **Mapas interactivos** para el transcurso de las partidas
- **Chat grupal en tiempo real** y **chat de voz**
- **Dados animados** en 3D con diferentes tipos
- Un **sistema de suscripciones** para desbloquear funcionalidades avanzadas

---

## 🎯 Objetivos

- ✅ Web personalizada e interactiva
- ✅ Mapas interactivos sobre el tablero
- ✅ Sistema de creación de personajes
- ✅ Modo historia (predeterminado) y campañas (personalizables)
- ✅ Suscripciones con distintos niveles de ventajas
- ✅ Dados 3D con animación
- ✅ Chat en tiempo real y comunicación por micrófono
- ✅ Vista diferenciada entre **Master** y **Jugador**

---

## 🛠️ Tecnologías utilizadas

### Frontend
| Tecnología | Uso |
|---|---|
| **React + TypeScript** | Framework principal de la interfaz |
| **Vite** | Bundler y entorno de desarrollo |
| **React Konva** | Tablero 2D interactivo |
| **Babylon.js** | Animación de dados 3D |

### Backend
| Tecnología | Uso |
|---|---|
| **Spring Boot** | Framework principal del servidor |
| **Spring Security + JWT** | Autenticación y autorización |
| **WebSockets** | Comunicación en tiempo real |
| **MySQL** | Base de datos relacional |

### Servicios externos
| Servicio | Uso |
|---|---|
| **Cloudinary** | Almacenamiento de imágenes en la nube |
| **Stripe** | Pasarela de pago para suscripciones |
| **DonDominio** | Servicio de correo electrónico |

### Herramientas
- **IDEs:** IntelliJ, VSCode
- **IA:** Claude, GitHub Copilot, Antigravity
- **Gestión de tareas:** Jira
- **Base de datos:** MySQL Workbench

---

## 🏗️ Arquitectura

### Backend — Spring Boot (MVC)

El backend sigue una arquitectura en capas desacopladas:

```
├── controller/     → Endpoints REST por dominio funcional
├── service/        → Lógica de negocio
├── repository/     → Acceso a datos con Spring Data JPA
├── entity/         → Entidades del modelo de dominio
├── dto/            → Transferencia de datos
├── exception/      → Manejo centralizado de errores
├── security/       → JWT (JwtFilter, JwtService, SecurityConfig)
└── websocket/      → Chat y sincronización del tablero en tiempo real
```

### Frontend — React + TypeScript (SPA)

```
src/
├── components/     → Elementos reutilizables (Header, Footer, Modales...)
├── pages/          → Vistas principales (Auth, Characters, Tablero...)
│   └── TableroStoryMode/
│       ├── components/
│       └── hooks/
├── services/       → Comunicación con el backend por dominio
├── types/          → Definiciones de tipos compartidos
└── utils/          → Funciones auxiliares
```

---

## 👥 Perfiles de usuario

| Perfil | Descripción |
|---|---|
| **Master** | Dueño de la partida. Puede crear, configurar y personalizar campañas y tableros. |
| **Jugador** | Participa en la partida. Solo tiene acceso a herramientas de juego. |
| **Usuario con suscripción** | Accede a más funcionalidades según el plan contratado. |

---

## 🗂️ Modelo de datos

| Grupo | Tablas |
|---|---|
| **Usuarios y acceso** | `usuario`, `role`, `suscripcion` |
| **Personajes y equipamiento** | `personaje`, `clase`, `raza`, `habilidad`, `hechizo`, `arma`, `armadura`, `pocion`, `inventario` |
| **Campañas y partidas** | `campana`, `campana_jugador`, `campana_personaje`, `campana_enemigo`, `campana_mapas`, `npc_campana` |
| **Misiones** | `mision`, `mision_escenario`, `mision_participante`, `mision_progreso` |
| **Enemigos y combate** | `enemigos`, `escenario`, `tirada_dado`, `dice_result` |
| **Modo Historia** | `modo_historia`, `modo_historia_personaje`, `modo_historia_enemigo` |
| **Social y comunicación** | `mensaje_chat`, `notificacion`, `seguimiento` |

---

## 🗺️ Estructura de navegación

```
Inicio
├── Comenzar aventura
│   ├── Elegir rol (Master / Jugador)
│   ├── Crear personaje
│   └── Crear nueva campaña
├── Personajes
│   ├── Mis personajes (listado y administración)
│   ├── Nuevo personaje (formulario)
│   └── Ficha de personaje → eliminar
├── Campañas
│   ├── Crear sala (nueva campaña)
│   ├── Unirte a una partida
│   └── Mis campañas
├── Modo Historia
│   └── Selección según suscripción activa
└── Planes
    └── Suscripciones → Pasarela de pago (Stripe)
```

---

## ⚙️ Instalación y despliegue

### Requisitos previos
- Node.js instalado
- MySQL en local
- Archivos `.env` de configuración

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>

# 2. Acceder al directorio frontend
cd frontend

# 3. Añadir los archivos de entorno
# Incluir .env y .env.development / .env.production

# 4. Instalar dependencias
npm install

# 5. Levantar el servidor de desarrollo
npm run dev
```

> Para el backend, importar la base de datos MySQL en local y arrancar la aplicación Spring Boot desde el IDE o mediante `mvn spring-boot:run`.

---

## ✅ Conclusiones

La gran mayoría de objetivos y funcionalidades se han implementado con éxito, resultando en una web completamente funcional, entre los desafíos superados destacan:

- 🎲 **Animación de dados sobre el tablero** → resuelto con **Babylon.js** y ajustes CSS
- 🔄 **Sincronización en tiempo real** (posición de tokens y chat) → resuelto con **WebSockets**

### Funcionalidades pendientes (fuera de alcance)
- Compra de campañas por parte del usuario
- Vídeos introductorios de campaña
- Panel de administrador con CRUD completo del contenido
