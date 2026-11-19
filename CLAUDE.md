# CLAUDE.md — Landing restaurante Valencia

Landing de una sola página para un restaurante de Valencia. Proyecto para cliente:
la web se vende/entrega a un negocio real, así que la calidad y la honestidad del contenido importan.

## Estructura
- `index.html` — todo el contenido (cabecera, carta, opiniones, horario, mapa, reservas).
- `styles.css` — único CSS, organizado por secciones numeradas. Colores y fuentes en `:root`.
- `main.js` — único JS. Datos editables en el bloque `CONFIG` del principio (WhatsApp, horario, días cerrados).
- `assets/img/` — imágenes en WebP. La foto del local va en `assets/img/local.webp`.
- `.htaccess` — caché y cabeceras para hosting Apache/LiteSpeed (Hostinger).

## Reglas técnicas
- HTML + CSS + JavaScript **sin frameworks, sin librerías, sin npm y sin paso de build**.
- JS en un IIFE, cargado con `<script defer>` (nunca `type="module"`). Cada función se ejecuta envuelta en `safe()`.
- El contenido se escribe **directamente en el HTML** (la web debe leerse aunque falle el JS). El JS solo mejora.
- **Mobile first**: probar siempre a 375 px de ancho; nada de scroll horizontal; inputs a 16 px (evita zoom en iPhone).
- Imágenes siempre en WebP, con `alt` descriptivo y `loading="lazy"` salvo la de la cabecera.
  Tamaños: cabecera ≤1920 px, galería ≤1000 px, fotos de platos 320×320 (recorte cuadrado).
- Las fotos actuales son **de ejemplo** (bancos libres con licencia CC). Cada una debe figurar en
  «Créditos de las fotos» del pie (título, autor, licencia y enlace). Si se cambia o quita una foto,
  actualizar los créditos. Con fotos reales del cliente, los créditos de stock se borran.
- Animaciones suaves y respetando `prefers-reduced-motion`.
- Tras cada cambio en CSS/JS, actualizar el `?v=AAAAMMDD` en `index.html`.
- Accesibilidad: HTML semántico, `aria-*` en pestañas y menú, contraste suficiente.

## Reglas de contenido
- Los textos de ejemplo deben estar **marcados como ejemplo** (barra amarilla superior, notas "de ejemplo").
- **Nunca** inventar opiniones, premios o datos presentándolos como reales. Las opiniones reales solo con permiso.
- Al pasar a datos reales: cambiar nombre, teléfono (`tel:`), WhatsApp (`CONFIG.whatsapp` y `wa.me` en HTML),
  dirección, mapa (`q=` del iframe), horario (tabla HTML **y** `CONFIG.horario` deben coincidir),
  y por último borrar la `.demo-bar`.
- Textos en español de España, tono cercano. Precios con formato `12,50 €`.

## Reservas
- Sin servidor: el formulario valida (fecha no pasada, día abierto, hora de cena solo jue–sáb)
  y abre WhatsApp con la reserva redactada. No se guarda ningún dato en la web.
- Si en el futuro se guardan reservas en servidor, añadir aviso de privacidad (RGPD) y guardar los datos fuera de la carpeta pública.

## Probar en local
```bash
cd plantilla-restaurante && python3 -m http.server 8000
```
Abrir http://localhost:8000 y revisar en modo móvil del navegador.
