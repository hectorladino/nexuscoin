# Nexus Construcciones — Sitio estático

Sitio web estático (sin backend) para venta de **bloques/ladrillos** y servicios de **construcción**, inspirado en la experiencia de búsqueda de tiquetes.

## Características
- Landing con **buscador/cotización rápida** por pestañas.
- **Catálogo** filtrable con productos.
- **Cotizador** de muros: calcula unidades de bloque, materiales y transporte.
- **Agenda** de visitas técnicas (localStorage).
- **Contacto** vía `mailto:`.
- **Diseño responsive** sin dependencias.

> Los **precios** incluidos son de **referencia** para demostración. Ajústelos en `data/productos.json`.

## Cómo usar
1. Descarga y descomprime el `.zip`.
2. Abre `index.html` en tu navegador.
3. Edita textos, precios e imágenes según tu negocio.

## Estructura
```
nexus-construcciones-site/
│ index.html
│ productos.html
│ servicios.html
│ cotizador.html
│ nosotros.html
│ contacto.html
│ cita.html
├─ css/
│  └─ styles.css
├─ js/
│  └─ app.js
├─ data/
│  └─ productos.json
└─ assets/
   └─ placeholder.svg
```