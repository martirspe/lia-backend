# Lia Backend

Backend de **Lia**, una plataforma SaaS multi-tenant para la gestión de chatbots con IA.
Desarrollado en **NestJS 11.1.6** siguiendo **Hexagonal / Clean Architecture**, integra autenticación, gestión de tenants, bots, chat en tiempo real, ingestión de datos, RAG y facturación mediante **PayPal**.

---

## 🚀 Tecnologías principales

* **NestJS 11.1.6** – Framework backend modular y escalable.
* **Prisma ORM** + **PostgreSQL** – Persistencia de datos relacional.
* **Redis** – Cache y control de sesiones.
* **Qdrant** – Vector store para búsquedas semánticas y RAG.
* **OpenAI API** – Modelos LLM y embeddings.
* **PayPal API** – Gestión de pagos y suscripciones.
* **WebSockets** – Comunicación en tiempo real para chat.
* **Docker & Docker Compose** – Entornos reproducibles.

---

## 📂 Estructura del proyecto

```
src/
 ├─ common/            # Decorators, guards, filters, middlewares, interceptors
 ├─ shared/            # DTOs, utils, types, errores genéricos
 ├─ modules/           # Dominios principales (auth, users, tenants, bots, etc.)
 │   ├─ auth/
 │   ├─ billing/
 │   ├─ bots/
 │   ├─ chat/
 │   ├─ files/
 │   ├─ ingest/
 │   ├─ rag/
 │   ├─ tenants/
 │   └─ users/
 ├─ infrastructure/    # Prisma, Redis y otros adaptadores globales
 └─ prisma/            # Schema y migraciones
```

Cada módulo se organiza en capas:

* **domain/** → entidades y contratos (interfaces).
* **application/** → casos de uso y servicios de aplicación.
* **infrastructure/** → adaptadores a tecnologías externas (repositorios, SDKs).
* **presentation/** → controladores, resolvers, gateways (NestJS).

---

## ⚙️ Requisitos previos

* Node.js >= 20
* Docker y Docker Compose
* PostgreSQL >= 15
* Redis >= 7
* Qdrant >= 1.9
* Cuenta y credenciales de PayPal API
* Cuenta y credenciales de OpenAI API

---

## 🔧 Instalación y configuración

Clonar el repositorio:

```bash
git clone https://github.com/martirspe/lia-backend.git
cd lia-backend
```

Instalar dependencias:

```bash
npm install
```

Configurar variables de entorno en un archivo `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/lia_db"
REDIS_URL="redis://localhost:6379"
QDRANT_URL="http://localhost:6333"
OPENAI_API_KEY="tu-api-key"
PAYPAL_CLIENT_ID="tu-client-id"
PAYPAL_CLIENT_SECRET="tu-client-secret"
JWT_SECRET="clave-super-secreta"
```

---

## 🗄️ Base de datos

Generar el cliente de Prisma:

```bash
npx prisma generate
```

Aplicar migraciones:

```bash
npx prisma migrate dev
```

---

## ▶️ Ejecución

Modo desarrollo:

```bash
npm run start:dev
```

Modo producción:

```bash
npm run build
npm run start:prod
```

Con Docker Compose:

```bash
docker-compose up --build
```

---

## 🧩 Módulos principales

* **Auth** – Registro, login, JWT, refresh tokens.
* **Users** – Gestión de usuarios.
* **Tenants** – Soporte multi-tenant y aislamiento de datos.
* **Bots** – Creación y configuración de chatbots.
* **Chat** – Conversaciones en tiempo real vía WebSockets.
* **Files** – Subida y gestión de archivos.
* **Ingest** – Procesamiento de datos desde archivos, URLs o APIs.
* **RAG** – Recuperación de contexto y embeddings con Qdrant + OpenAI.
* **Billing** – Gestión de planes y suscripciones vía PayPal.

---

## ✅ Tests

Ejecutar pruebas unitarias:

```bash
npm run test
```

Ejecutar pruebas e2e:

```bash
npm run test:e2e
```

---

## 📌 Roadmap

* [ ] Panel de administración para tenants.
* [ ] Soporte para múltiples proveedores de LLM.
* [ ] Webhooks avanzados de PayPal.
* [ ] Métricas y monitoreo con Prometheus + Grafana.

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**.

---
