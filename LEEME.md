# Inscripción IBERO

Formulario de inscripción por pasos para la **Corporación Universitaria Iberoamericana (IBERO)**,
hecho con el Manual de Marca (Montserrat, gris `#4A4848`, dorados `#DFC14E` / `#D0AB4B`).

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La página y el formulario |
| `style.css` | El diseño |
| `app.js` | Lógica: pasos, validaciones, resumen y envío |
| `assets/` | Logo, logo en blanco y favicon |
| `apps-script/Code.gs` | Código que guarda las inscripciones en Google Sheets |

## Conectar con Google Sheets (una sola vez)

1. Crea un Google Sheets nuevo (por ejemplo "Inscripciones IBERO").
2. Menú **Extensiones → Apps Script**. Borra lo que haya y pega todo el contenido de `apps-script/Code.gs`. Guarda.
3. **Implementar → Nueva implementación** → tipo **Aplicación web**.
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
4. Autoriza los permisos y copia la **URL de la aplicación web** (termina en `/exec`).
5. En `app.js`, línea 7, pégala entre las comillas:
   `const SCRIPT_URL = 'https://script.google.com/macros/s/XXXX/exec';`
6. Sube el cambio a GitHub. Las inscripciones llegan a la pestaña **Inscripciones** (se crea sola con sus encabezados).

> Si después cambias `Code.gs`, usa **Implementar → Gestionar implementaciones → Editar → Nueva versión** para que la URL siga siendo la misma.

## Publicar en GitHub Pages

Repositorio → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main` / `(root)` → Save.
Queda en `https://jorgelosada1.github.io/Iberoamericana/`.
Para usar un dominio propio (como `csu-galan.csu.com.co`), agrega un archivo `CNAME` con el dominio.

## Datos que se guardan

Fecha de registro · Nombres completos · Tipo y número de documento · Fecha de expedición ·
Fecha de nacimiento · Estado civil · Celular · Teléfono fijo · Correo · Ciudad · Dirección · Barrio ·
EPS · Estrato · Personas a cargo · Grupo étnico · Discapacidad (y cuál, si es "Otra") ·
Familiar de contacto, parentesco y número · Autorización de datos (Ley 1581 de 2012).

## Prueba recomendada

Haz una inscripción de prueba con tus datos, revisa que aparezca la fila en el Sheets y luego bórrala.
