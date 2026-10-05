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
