# Rondas y buzzer

- El fixture intercala Guess Movies/Songs, 100 Argentinos Dicen, Impostor y ¿Quién lo dijo? en posiciones aleatorias. El orden queda guardado y se comparte con Firebase; recargar no vuelve a sortearlo.
- Las claves de los duelos anteriores se conservan: insertar una ronda no cambia sus resultados ni apuestas.
- Cada ronda común tiene una fila visible para abrir el juego o cargar su resultado. Impostor se registra desde su pantalla y solo suma al ranking individual.
- Guess, 100 Argentinos y ¿Quién lo dijo? suman al ranking grupal en la columna de su ronda. ¿Quién lo dijo? no se suma dos veces.
- “Cargar resultados automáticamente” ofrece la primera ronda pendiente según el orden guardado y permite revisar los resultados antes de confirmarlos. Los resultados ya aplicados no se duplican.
- Guess tiene un botón “Finalizar ronda y publicar resultado”. Puntaje: primero 3, segundo 1 y resto 0; con dos equipos, 3 y 0. Los empates comparten puesto. Bonus de 1 al primero si supera a todos los demás por 5 o más aciertos.
- 100 Argentinos publica participantes activos al activar la ronda. Al abrir su conductor arma los equipos de juego sin separar los grupos originales. “Grupos” permite ajustar el armado; el buzzer actualiza los integrantes de los equipos que juegan cada pregunta.
- Las configuraciones antiguas de cinco o seis juegos recuperan los juegos originales faltantes una vez. Las eliminaciones guardadas con esta versión se respetan.
- El ranking conserva el desplazamiento horizontal táctil y oculta la barra visible.

## Instalación

Subir todos los archivos de `Velada-main`, incluyendo `common-rounds.js` y los JavaScript actualizados. Recargar el hub y los juegos con Ctrl + F5. No borrar los datos de la noche.

## Pruebas

Ejecutar `node tests/rondas.cjs`. Comprueba sintaxis, migración de catálogo, estabilidad del orden, puntajes, revisión de resultados, filas del fixture, columnas del ranking y publicaciones del buzzer con una conexión simulada. La conexión con Firebase y la experiencia simultánea entre conductor y celulares deben comprobarse en la web publicada.
