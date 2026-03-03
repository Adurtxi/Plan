# AGENTS.md

You are an expert in TypeScript, React, Rsbuild, and modern web application development. You write maintainable, performant, and accessible code.

## Comandos del Proyecto

- `bun run dev` - Inicia el servidor de desarrollo local
- `bun run build` - Compila la aplicación para producción
- `bun run preview` - Previsualiza la compilación de producción localmente

## Documentación de Referencia

- Rsbuild: https://rsbuild.rs/llms.txt
- Rspack: https://rspack.rs/llms.txt

---

## 📌 Contexto del Proyecto y Arquitectura

Este proyecto (VoyagerV3_Nature) es una aplicación web progresiva (PWA) **Local-First** y **Offline-First** enfocada en la planificación detallada de viajes (itinerarios, mapas, control de equipaje, reservas y galería de fotos). 

**Pilar Fundamental:** NO existe un backend tradicional (REST/GraphQL) propio. Toda la persistencia de datos se realiza en el navegador del usuario utilizando **IndexedDB**. 

### 1. Stack Tecnológico Estricto (NO ALUCINAR LIBRERÍAS)

Los agentes **solo** deben utilizar las librerías que ya están integradas en el ecosistema. Está terminantemente prohibido inventar o importar librerías alternativas sin autorización explícita.

- **Framework Core:** React 18 + TypeScript + Rsbuild.
- **Enrutamiento:** `react-router` (importaciones desde `'react-router'`, no `'react-router-dom'`).
- **Base de Datos Local:** `idb` (wrapper de IndexedDB).
- **Gestión de Estado (Síncrono/UI):** `zustand` (para estados de modales, themes, selecciones temporales).
- **Gestión de Estado (Asíncrono/IDB):** `@tanstack/react-query` (Para sincronizar IndexedDB con la UI mediante hooks como `useLocations`, `useAddLocation`, etc.).
- **Estilos:** Tailwind CSS v4 (utilizando bloque `@theme` y directiva `@import "tailwindcss"`).
- **Iconografía:** `lucide-react` (NO usar `react-icons`, `heroicons`, `mui-icons`, etc.).
- **Formularios:** `react-hook-form` (usado extensivamente en modales de creación/edición).
- **Mapas:** `leaflet` y `react-leaflet` (con el setup local custom en `src/lib/leafletSetup.ts`).
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- **Manejo de Fechas:** `dayjs` (Uso exclusivo de dayjs o el objeto nativo `Date`, NO usar `date-fns` ni `moment`).
- **Animaciones:** `framer-motion` (utilizado para modales y transiciones fluidas).

### 2. Arquitectura de Datos y Tipado (`src/types.ts`)

La base de datos (VoyagerDB) consta de 5 object stores principales:
1. `locations`: Elementos del itinerario (actividades, hoteles, transportes).
2. `checklist`: Elementos de la lista de equipaje.
3. `transports`: Líneas o rutas calculadas entre localizaciones.
4. `tripVariants`: Planes de viaje (Fechas, ciudades).
5. `reservations`: Billetera/Wallet de documentos maestros (vuelos, hoteles).

**Reglas de Tipado:**
- Trata el archivo `src/types.ts` y `src/constants.ts` como la única fuente de verdad.
- La propiedad `cat` (Category) de un `LocationItem` está rígidamente definida (ej. `sight`, `flight-departure`, `hotel-checkin`). **NUNCA inventes categorías nuevas.** Utiliza la función `getCatGroup` para inferir si es `activity`, `transport` o `accommodation`.

### 3. Normas de Estilos y UI (Tailwind v4)

La aplicación tiene un diseño altamente semántico y soporta Dark/Light Mode mediante clases en la raíz (`:root` y `:root.dark`). 

- **Colores Temáticos:** Utiliza siempre variables semánticas. No introduzcas colores hexadecimales sueltos en las clases.
  - Fondos: `bg-bg-body`, `bg-bg-surface`, `bg-bg-surface-elevated`.
  - Textos: `text-text-primary`, `text-text-secondary`, `text-text-muted`.
  - Bordes: `border-border-subtle`, `border-border-strong`.
  - Brand (Nature): `text-nature-primary`, `bg-nature-mint`, `bg-nature-accent`.
- **Scrollbars:** Utiliza las clases utilitarias personalizadas `custom-scroll`, `hide-scroll-mobile` o `no-scrollbar` para mantener el estilo consistente.
- **Componentes Globales:** Para interacciones modales, NO crees modales desde cero. Utiliza las implementaciones existentes a través del store global de Zustand (`showDialog`, `openLightbox`, `openDocumentViewer`, `addToast`).

### 4. Reglas Anti-Alucinación para Agentes (Checklist de Desarrollo)

Para evitar errores y código roto, los agentes de IA deben cumplir lo siguiente en cada respuesta:

1. **Gestión del Estado Híbrido:** Recuerda que las mutaciones de datos reales se hacen llamando a IndexedDB (vía `useMutation` de React Query), seguido por una invalidación de la caché o llamando a `loadData()` del store de Zustand.
2. **Sin llamadas a APIs:** No escribas `fetch()` o `axios.get()` para obtener el clima, los usuarios, ni el itinerario de un servidor externo. Todo vive en el objeto global de Zustand o en IndexedDB local.
3. **Referencias Cruzadas en Componentes:** Si creas un botón que elimina una actividad, usa el hook custom (ej. `const { mutateAsync: deleteLocation } = useDeleteLocation()`), NO modifiques la lista en memoria y esperes que se guarde sola.
4. **Imágenes locales:** Las imágenes se manejan en formato base64 con el tipo `ImageFile { data: string, name: string }` y se comprimen/redimensionan localmente mediante un elemento `<canvas>` (como se ve en `LocationForm.tsx`). No asumas que hay un CDN o una URL externa.
5. **Estructura de Componentes:** Mantén los componentes limpios y separados. Todo sigue un patrón funcional moderno (hooks, destructuring, tailwind).
6. **Manejo de Coordenadas:** Las posiciones para Leaflet y los cálculos utilizan un objeto `{ lat: number; lng: number }`.