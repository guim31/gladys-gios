# GIOŚ

La calidad del aire medida por las estaciones oficiales de
[GIOŚ](https://powietrze.gios.gov.pl), la Inspección General de Protección
del Medio Ambiente de Polonia (Główny Inspektorat Ochrony Środowiska): el
índice polaco de calidad del aire y los contaminantes, estación por estación,
hora por hora.

Sin afiliación con GIOŚ. Los datos proceden de su API abierta
(`api.gios.gov.pl`), utilizados tal como GIOŚ los publica.

## Qué hace la integración

- Lee las estaciones de GIOŚ que usted elija (10 como máximo), sin cuenta ni
  clave.
- Crea **un dispositivo por estación**: el índice polaco de calidad del aire
  (de 0 a 5) y su nivel en palabras, los contaminantes que mide la estación
  (PM2.5, PM10, NO₂, O₃, SO₂, CO, benceno) y la antigüedad de los datos.
- Añade un widget **Calidad del aire GIOŚ**, dos disparadores de escena
  (**calidad del aire degradada**, **calidad del aire normal de nuevo**) y una
  acción de escena **Obtener la calidad del aire**.
- Encuentra una estación por su nombre o su ciudad, o las más cercanas a su
  casa.

Solo lectura: la integración solo lee datos públicos.

## Requisitos

- Gladys Assistant 5.3.0 o posterior.
- Acceso a Internet de Gladys hacia `api.gios.gov.pl`.
- Para buscar alrededor de su casa: su ubicación, en **Configuración →
  Viviendas**.

## Configuración

### Elegir las estaciones

1. Abra la pestaña **Configuración** de la integración.
2. Haga clic en **Buscar una estación**: escriba un nombre o una ciudad
   (`Kraków`, `Gdansk`: los acentos son opcionales), o déjelo vacío para
   listar las estaciones más cercanas a su casa, con su distancia.
3. Copie los números que desee en **Estaciones**, separados por comas: por
   ejemplo `530, 401`. Guarde.
4. En la pestaña **Descubrir**, añada las estaciones a Gladys.

El [mapa de las estaciones](https://powietrze.gios.gov.pl/pjp/current) las
muestra todas.

### Otros ajustes

- **Lectura**: cada 30 minutos (por defecto) o cada hora. GIOŚ publica medias
  horarias, poco después de cada hora: leer más a menudo no aportaría nada.
- **Idioma**: idioma de los nombres de las funciones (fijados al añadir un
  dispositivo: elíjalo primero) y de los textos de escena. Francés por
  defecto.

El botón **Comprobar las estaciones** lee todas las estaciones al instante e
indica lo que responde cada una.

## Dispositivos

Un dispositivo por estación, llamado `GIOŚ <estación>`.

| Función                             | Valores                                    |
| ----------------------------------- | ------------------------------------------ |
| Índice de calidad del aire          | de 0 a 5 (índice polaco, más abajo)        |
| Calidad del aire                    | el nivel en palabras, en su idioma         |
| PM2.5, PM10, NO₂, O₃, SO₂, CO, C₆H₆ | µg/m³, media horaria                       |
| Antigüedad de la medición           | minutos desde la hora de los últimos datos |

Solo se crean los contaminantes que mide la estación. El CO y el benceno no
tienen un tipo propio en µg/m³ en Gladys: aparecen como valores simples,
nombrados por su fórmula.

El **índice polaco de calidad del aire** (Polski indeks jakości powietrza)
tiene seis niveles: 0 Muy buena (Bardzo dobry), 1 Buena (Dobry), 2 Moderada
(Umiarkowany), 3 Suficiente (Dostateczny), 4 Mala (Zły), 5 Muy mala (Bardzo
zły). GIOŚ lo calcula a partir de PM2.5, PM10, NO₂, O₃ y SO₂: el peor de los
cinco lo fija.

Un valor de más de 3 horas ya no se publica como actual: Gladys conserva el
último con su fecha, y el widget indica que los datos están desactualizados.

## Widget

**Calidad del aire GIOŚ**:

- con una estación elegida: hasta cuatro mosaicos de contaminantes, el nivel
  del índice en color (verde, naranja, rojo) y la antigüedad de los datos;
- sin ella: una fila por estación, su nivel en color.

## Escenas

### Disparador: GIOŚ: calidad del aire degradada

Se activa cuando el índice de una estación sube a **Moderada** o peor, o
empeora de nuevo (Moderada y luego Mala se activa dos veces). Filtros: la
estación y el **nuevo nivel**: marque los niveles a partir de su umbral (por
ejemplo Mala y Muy mala). Información para las acciones: nombre de la
estación, nivel, su índice, el índice anterior, el contaminante que fija el
nivel, un resumen listo.

### Disparador: GIOŚ: calidad del aire normal de nuevo

Se activa cuando el índice vuelve a **Buena** o **Muy buena** tras una
degradación. Filtros: la estación y el peor nivel que alcanzó la degradación
(marque los mismos niveles que arriba para emparejar ambas escenas).
Información: el nuevo nivel, el peor nivel alcanzado, un resumen.

El primer índice leído tras la instalación fija el nivel de partida y no
activa nada; un reinicio no activa dos veces el mismo cambio.

### Acción: GIOŚ: obtener la calidad del aire

La calidad del aire de una estación, o de la estación con el peor índice:
resumen, nivel, índice, contaminante, PM2.5, PM10, NO₂, O₃ y antigüedad de los
datos, para las acciones siguientes (un mensaje, una condición).

## Ejemplos de escenas

- **Cerrar las ventanas**: disparador _calidad del aire degradada_ con los
  niveles Mala y Muy mala → enviar `{{triggerEvent.data.summary}}` y apagar la
  ventilación.
- **Aire de nuevo**: disparador _calidad del aire normal de nuevo_ con los
  mismos niveles → enviar «Puede volver a abrir las ventanas».
- **Resumen de la mañana**: a las 7:30, acción _obtener la calidad del aire_
  sin estación, y luego enviar su resumen en el mensaje de la mañana.
- **Purificador**: cuando la función PM2.5 de su estación supere 25 µg/m³,
  encender el purificador de aire.

## Solución de problemas

- **«Ninguna estación»** en la pantalla de configuración: escriba al menos un
  número de estación en **Estaciones**.
- **«no es una estación de GIOŚ»** en la comprobación: el número no está en la
  lista de GIOŚ; use **Buscar una estación**.
- **Sin PM2.5 en una estación que lo mide**: algunas estaciones solo tienen un
  sensor de PM2.5 manual, cuyos resultados GIOŚ publica semanas después. Solo
  se leen los sensores automáticos, horarios.
- **«La API de GIOŚ no responde»**: los valores se conservan y se vuelven a
  leer en la siguiente lectura. La pestaña Registros indica el error una vez,
  y su fin.
- **Índice de calidad del aire sin valor**: GIOŚ no da índice para esa hora
  («Brak indeksu»), por ejemplo tras una avería de medición.
- Detalles en la pestaña **Registros** de la integración (`LOG_LEVEL=debug`
  para más).

## Límites

- Datos horarios, publicados por GIOŚ poco después de cada hora: la última
  hora suele faltar todavía, y los valores tienen de 1 a 2 horas de retraso.
- Son mediciones, no previsiones.
- GIOŚ limita su API (1500 peticiones por minuto en los datos actuales, 2 por
  minuto en la lista de estaciones): la integración lee 10 estaciones como
  máximo, una petición por contaminante, y la lista de estaciones una vez al
  día.
- Los disparadores siguen el índice horario de GIOŚ tal como se publica: un
  índice que duda entre dos niveles se activa en cada cambio.
