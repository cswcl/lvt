# Changelog

**0.3.0**

 - (breaking change) se renombra función de filtrado `filter` a `setFilter`.
 - (breaking change) la función query ahora retorna un geojson feature.

**0.2.4**

  - agrega función de filtrado

**0.2.3**

  - corrige error en llamada a callback para dar soporte a leaflet 1.0.1

**0.2.2**

  - Corrige función query para linestring.

**0.2.1**

  - Agrega función `getStyleFn` para obtener la función generadora de estilos.

**0.2.0**

  - (breaking change) Se renombra y limita las propiedades posibles en el estilo.
  - (breaking change) `setStyle` redibuja automaticamente los tiles con el nuevo estilo.
  - Agrega metodo `getStyle` para obtener el estilo de la capa.
  - (breaking change) la opción style ya no soporta una función como valor posible.
    La razón de esto, es que la generación de leyenda sólo está disponible para
    definición de estilo en formato json.
  - Define estilo por defecto simple en `style.js`

**v0.1.3**

  - agrega funcionalidad para generar y dibujar leyendas
  - (fix) reRender borra los tiles antes de redibujarlos

**v0.1.2**:

  - Sirve los archivos compilados a es5.

**v0.1.1**:

  - Refactoriza libreria.

**v0.1.0**:

  - (breaking change) cambia la opción `getStyle` por `style`.
  - Agrega método `setStyle` para cambiar el estilo.
  - Agrega método `reRender` para redibujar de nuevo los tiles.
  - Agrega soporte para definir estilos en formato json

**v0.0.1**:

  - version inicial
