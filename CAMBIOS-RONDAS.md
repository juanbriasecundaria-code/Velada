# Rondas y buzzer

- El fixture intercala Guess Movies/Songs, 100 Argentinos Dicen, Impostor y ¿Quién lo dijo? en posiciones aleatorias. El orden queda guardado y se comparte con Firebase; recargar no vuelve a sortearlo.
- Las claves de los duelos anteriores se conservan: insertar una ronda no cambia sus resultados ni apuestas.
- Cada ronda común tiene una fila visible para abrir el juego o cargar su resultado. Impostor se registra desde su pantalla y solo suma al ranking individual.
- Guess, 100 Argentinos y ¿Quién lo dijo? suman al ranking grupal en la columna de su ronda. ¿Quién lo dijo? no se suma dos veces.
- “Cargar resultados automáticamente” ofrece la primera ronda pendiente y los resultados publicados de rondas posteriores, para revisarlos antes de confirmarlos. Los resultados ya aplicados no se duplican.
- Guess tiene un botón “Finalizar ronda y publicar resultado”. Puntaje: primero 3, segundo 1 y resto 0; con dos equipos, 3 y 0. Los empates comparten puesto. Bonus de 1 al primero si supera a todos los demás por 5 o más aciertos.
- 100 Argentinos publica participantes activos al activar la ronda. Al abrir su conductor arma los equipos de juego sin separar los grupos originales. “Grupos” permite ajustar el armado; el buzzer actualiza los integrantes de los equipos que juegan cada pregunta.
- Las configuraciones antiguas de cinco o seis juegos recuperan los juegos originales faltantes una vez. Las eliminaciones guardadas con esta versión se respetan.
- El ranking conserva el desplazamiento horizontal táctil y muestra una barra sutil.

## Instalación

Subir todos los archivos de `Velada-main`, incluyendo `common-rounds.js` y los JavaScript actualizados. Recargar el hub y los juegos con Ctrl + F5. No borrar los datos de la noche.

## Pruebas

Ejecutar `node tests/rondas.cjs`. Comprueba sintaxis, migración de catálogo, estabilidad del orden, puntajes, revisión de resultados, filas del fixture, columnas del ranking y publicaciones del buzzer con una conexión simulada. La conexión con Firebase y la experiencia simultánea entre conductor y celulares deben comprobarse en la web publicada.

## Panel de participantes y Guess

Guess carga el listado completo de equipos desde el fixture, independientemente del último estado de cartas. El marcador muestra las fotos de todos los integrantes, incluidos los equipos de tres, y se actualiza al cambiar el roster o los puntajes.

El panel de participantes tiene una única sección de Apuestas, correspondiente a la fase grupal. El resumen usa los puntos y el puesto del equipo. La tarjeta de Impostor aparece cuando existen resultados propios y no suma al ranking grupal. Se retiraron las tarjetas, apuestas y duelos de la antigua clasificación individual; los datos anteriores se conservan para compatibilidad. La interfaz y los textos guardados usan “Fase grupal”.

Prueba adicional: `node tests/participantes.cjs`.

## Correcciones del fixture y conexión

Las filas de Guess, 100 Argentinos y ¿Quién lo dijo? abren su propio formulario con todos los equipos. Se puede cargar puntos manualmente o usar “Traer resultado del juego”. Abrir la pantalla del juego es una acción aparte. Impostor abre un acceso a su carga individual y nunca suma al ranking grupal.

Los cuatro juegos tienen colores propios. Impostor y ¿Quién lo dijo? están dentro de Fase grupal en las reglas. El editor tolera estaciones sin condición de bonus y permite editar la descripción de ¿Quién lo dijo?.

Palabras a Tiempo inicia su conexión a la misma base de rondas del hub. El pozo de la vista de participantes de 100 Argentinos tiene altura compacta. Guess confirma la escritura de la cuenta regresiva antes de abrir el buzzer. Los celulares registran el orden completo de equipos en Guess y 100 Argentinos; dos jugadores del mismo equipo no ocupan dos lugares. La cola se reinicia al volver a habilitar el buzzer.

Subir el proyecto completo, incluido index.html (buzzer), y recargar las pantallas de conductor, participantes y celulares. Los scripts actualizados incluyen una nueva versión en su URL para evitar usar copias en caché.

Prueba del flujo: `node tests/integracion.cjs`. Usa las funciones reales del conductor y celular con una base simulada: cuenta regresiva, orden de tres equipos, rechazo de duplicados, rondas obsoletas, publicación de Guess e importación sin bloquear por una ronda previa. También renderiza el editor con el catálogo completo. Estas pruebas no reemplazan una comprobación con celulares conectados a Firebase en la web publicada.

## Guess y 100 Argentinos: buzzer, participantes y JSON

Se conservan los dos proyectos Firebase existentes. No se trasladan datos ni se cambian sus configuraciones: las rondas y buzzers siguen en guessmovie y las fotos se leen de cumple, documento ndj/photos, igual que ¿Quién lo dijo?.

Las escrituras de Guess toleran que Firebase elimine los objetos vacíos. Los nombres de equipos con barras u otros caracteres se codifican únicamente en los mapas enviados a Realtime Database y se decodifican al recibirlos. Esto corrige tanto la publicación de cartas/puntajes para participantes como la carga de resultados de Guess y 100 Argentinos. Cada turno de Guess dispone de un contador nuevo de 15 segundos, incluido el segundo y el tercero.

El marcador principal de 100 Argentinos muestra todos los grupos con controles de suma y resta. Al confirmar el cierre, se espera la publicación y el hub incorpora el resultado válido al fixture/ranking una sola vez; repetir una publicación reemplaza el aporte anterior.

100 Argentinos inicia con el banco vacío. No incluye preguntas predefinidas ni un banco separado para la final. Cargá tus preguntas con Importar JSON; se conservan al recargar y la final usa ese mismo banco. La nueva versión no carga automáticamente el banco mezclado de versiones anteriores: reimportá el JSON que querés utilizar. Los datos locales anteriores se conservan en su clave original, sin usarse ni borrarse. “Vaciar banco importado” nunca restaura preguntas originales.

Subir también team-maps.js, guess-teams.js y los HTML actualizados. Recargar el hub y ambas pantallas del juego con Ctrl+F5, y recargar el buzzer en los celulares.

Pruebas: `node tests/turnos-banco.cjs` y `node tests/integracion.cjs`, además de las anteriores. Cubren objetos vacíos eliminados por Firebase, claves de equipos con / y otros caracteres, cartas y resultados publicados, cambio automático de turnos, puntaje/cierre del tercer grupo, fotos desde el proyecto correcto y persistencia de preguntas importadas. Se ejecutan con conexiones simuladas: la entrega no acredita una prueba en la web publicada.

## Equipos antes de preguntar, formularios y turnos de ¿Quién lo dijo?

100 Argentinos publica también la lista completa de grupos antes de lanzar una pregunta. La vista de participantes muestra 2, 3, 4 o los grupos configurados, con sus nombres y puntajes; ya no reduce el marcador inicial a Equipo 1 / Equipo 2. La pantalla se sincroniza por Firebase entre dispositivos, además del apoyo local. Las respuestas aún no reveladas se excluyen de esa publicación.

Los cuatro formularios comunes usan la cuadrícula de tarjetas, bordes, controles oscuros y botones Cancelar / Guardar del estilo de Mario Party y Time’s Up. Se retiraron todos los accesos “Abrir juego” de estos formularios. Impostor permite ajustar los puntos individuales y sigue sin sumar al ranking grupal.

¿Quién lo dijo? registra una cola confirmada por equipo. El primer buzzeo inicia un turno de 30 segundos; si vence sin marcar correcto, se pasa automáticamente al siguiente equipo que buzzeó, con 30 segundos nuevos. Si todavía no buzzeó otro equipo, se espera su toque. Al agotarse los equipos registrados, se muestra “Nadie acertó” para pasar a la siguiente pregunta. El mismo contador se muestra en participantes, calculado desde el inicio confirmado del servidor; no se envían escrituras de reloj cada segundo. Los puntos no se pueden asignar al equipo del turno vencido ni a otro equipo mientras está respondiendo el actual.

El index.html del buzzer también está actualizado. Las transacciones de los celulares no anuncian ganadores provisionales; la posición que se muestra viene de la cola confirmada. El celular muestra quién responde y el puesto de su equipo. Mientras espera confirmación no duplica solicitudes. Guess y 100 Argentinos identifican cada apertura para rechazar toques atrasados de una pregunta anterior y evitar que un temporizador viejo reabra el buzzer.

Subir todo el proyecto, incluidos qld-turns.js, qld-timer.js e index.html. Recargar con Ctrl+F5 el hub, los conductores y participantes, y recargar los celulares. Se conservan los dos Firebase existentes.

Pruebas nuevas: `node tests/qld-roster-modales.cjs`, `node tests/qld-widget.cjs` y `node tests/buzzer-confirmado.cjs`. Las pruebas usan las funciones reales de las pantallas con conexiones simuladas: verifican 30/30/30 segundos, el reloj de conductor/TV, rechazo de turnos obsoletos, formularios, roster previo de 2–5 grupos y confirmación compartida del orden del buzzer. No constituyen una comprobación con celulares en la web publicada.
