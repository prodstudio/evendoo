# Evendoo — Setup para correr en localhost

## 3 pasos para levantarlo

### 1. Crear proyecto en Supabase

1. Ir a https://supabase.com y crear cuenta si no tenés
2. Crear un nuevo proyecto (elegí región `South America (São Paulo)`)
3. Ir a **Settings → API** y copiar:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editar `.env.local` y completar con los valores de Supabase.

Para empezar solo necesitás las variables de Supabase. MP y Gemini son opcionales para el primer arranque.

### 3. Aplicar las migraciones y levantar

```bash
# Instalar Supabase CLI si no lo tenés
npm install -g supabase

# Linkar con tu proyecto
supabase link --project-ref TU_PROJECT_REF

# Aplicar todas las migraciones
supabase db push

# Levantar el servidor
npm run dev
```

Abrí http://localhost:3000 — deberías ver el marketplace.

---

## Qué funciona sin credenciales adicionales

✅ UI completa (marketplace, auth, dashboard, chat)
✅ Auth con Supabase (email, Google, Apple)
✅ Marketplace de proveedores
✅ Propuestas y bookings
✅ Chat en tiempo real
✅ TOTP QR check-in (generación y validación)

## Qué necesita credenciales adicionales

⚙️ **Mercado Pago** → agrega `MP_ACCESS_TOKEN` para procesar pagos reales
⚙️ **Gemini AI** → agrega `GOOGLE_GENERATIVE_AI_API_KEY` para el asistente IA

---

## Comandos útiles

```bash
npm run dev          # Modo desarrollo con hot reload
npm run build        # Build de producción
npm run lint         # Verificar código
```

## Estructura del proyecto

```
evendoo-app/
├── app/              # Next.js App Router
│   ├── (auth)/       # Login, register, onboarding
│   ├── (public)/     # Marketplace y perfiles (sin login)
│   └── (app)/        # Dashboard, eventos, chat, pagos
├── components/       # Componentes React
├── lib/              # Utilidades (Supabase, pagos, TOTP, AI)
├── stores/           # Estado global (Zustand)
├── types/            # TypeScript types
└── supabase/
    ├── migrations/   # 000 al 007 — aplicar en orden
    └── functions/    # Edge Functions (deploy con supabase functions deploy)
```
