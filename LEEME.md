# La Velada — original con las mejoras acordadas

Esta versión parte del ZIP original: conserva sus pantallas de Guess Movies/Songs y 100 Argentinos, sus estilos, mazos iniciales, sonidos, música, diario, fotos, podio y cierre. La organización pasa a equipos; se retiran la fase individual y los controles de VAR.

## Para usarla

1. Publicá **todos los archivos de esta carpeta**, manteniendo juntos los HTML, los JS, los CSS, `vendor` y los archivos de música e imágenes. Podés reemplazar los archivos del sitio existente. No alcanza con subir solamente `velada.html`.
2. Abrí `index.html`: es la entrada de participantes, sin cuentas. Elegís el juego y luego tu nombre con foto.
3. El conductor abre `velada.html` y usa la contraseña **100**. Las páginas de conducción también aceptan 100; no usan Google ni Firebase Authentication.
4. En **Equipos · Ranking · Fixture**, cargá equipos e integrantes y pulsá **Guardar equipos**. Escribir nombres o agregar filas no guarda la formación. La formación guardada permanece hasta que la borres.
5. Generá el fixture o activá un juego desde Reglas. Los encuentros son por turnos. Registrá el resultado al terminar cada juego.
6. Abrí `tv.html` para el ranking. Desde las partidas podés abrir su pantalla de TV.

Para una prueba local con Python, desde esta carpeta ejecutá `python -m http.server 8000` y abrí `http://localhost:8000/index.html`. Para los celulares, usá el sitio publicado o la dirección de la computadora dentro de la misma red. Mantené abierta la página del conductor para los cambios automáticos de turno.

## Firebase recuperado

`firebase-config.js` centraliza las configuraciones originales:

- `guessmovie-905e2`: Realtime Database. La organización nueva usa `velada/equipos2026` para formación, ranking, encuentros, partidas, buzzer, mazos y pantallas compartidas. Las partidas anteriores permanecen en sus rutas originales.
- `cumple-598e7`: Cloud Firestore. Se reutiliza `ndj/photos`, con el formato original `{data: "JSON", ts: ...}`. Las palabras, reglas y otras funciones originales también conservan sus documentos `ndj`.

La formación nueva comienza vacía, aunque existan datos de la organización anterior. Las fotos se recuperan por nombre: si existe una foto de Cori, escribir Cori la muestra. Subir una foto la guarda aparte, sin guardar automáticamente el resto de la formación.

Las reglas de Realtime Database que ya configuraste permiten leer y escribir las rutas `velada` y `argentinos`, incluida la ruta nueva. Las reglas de Firestore que compartiste permiten los documentos `ndj` usados por el original. No hace falta crear otro proyecto ni activar proveedores de inicio de sesión. La contraseña 100 mantiene el bloqueo de pantalla del original, no una cuenta de usuario.

Si no existe todavía un mazo en la ruta nueva, Guess y Quién lo dijo pueden leer el mazo de sus rutas originales recuperadas. Si tampoco existe allí, usan el mazo incluido en el ZIP. Un mazo que vaciaste explícitamente permanece vacío.

## Juegos, resultados y bonus

Inicialmente hay once juegos: Guess Movies/Songs, 100 Argentinos Dicen, Quién lo dijo, Erudito, Impostor, Palabras a Tiempo, Mario Party, Beer Pong, Time’s Up, Curling y Carrera de Mentes.

Cada juego tiene su marcador interno. Sus bonus viajan con el juego y se incluyen en ese marcador. Al registrar el resultado, el ranking recibe **3 por victoria, 1 por empate y 0 por derrota**. Una corrección reemplaza el registro anterior, sin sumar nuevamente el mismo encuentro.

Los juegos manuales permiten ingresar el marcador. Al registrar también aparece la condición del bonus original del juego; no lo marques si ya lo incluiste en el número ingresado. Guess conserva además los bonus de sus cartas, e Impostor conserva el puntaje original de las rondas y lo suma a los equipos correspondientes.

**Agregar juego** crea su columna y lo deja disponible para el fixture. **Agregar al fixture** agrega sus encuentros al final, conservando los anteriores. **Columna manual** crea solamente una columna de ajuste. Los cuadros de la pestaña Final usan el ranking por equipos; sus fotos, diario, opciones de juegos y cierre conservan las pantallas originales.

## Buzzer y Guess

La posición se muestra después de que Realtime Database confirma la transacción. La PC, los participantes y la TV leen la misma cola. Una dupla o grupo ocupa una sola posición, aunque pulsen dos integrantes. Sin conexión, el botón se bloquea.

Guess muestra todos los equipos y tiene una cruz para cerrar el mazo. Cada equipo de la cola dispone de 15 segundos. Un error o el tiempo agotado pasan al siguiente con 15 segundos nuevos. Si nadie acertó, **Repetir orden del buzzer** vuelve al primero; **Abrir buzzer** permite una nueva cola. El cambio de carta es manual. El orden corresponde a la confirmación en Firebase, no a relojes distintos de los celulares.

## 100 Argentinos

La agrupación automática equilibra personas sin dividir duplas. Con 12 personas en 6 duplas propone 3 grupos de 4. La propuesta se puede ver y guardar desde Reglas.

- El editor usa una tarjeta de pregunta y filas de respuesta/votos; **+ Agregar respuesta** crea otra fila. Se ordenan por votos, de mayor a menor.
- En la disputa inicial, encontrar la respuesta n.º 1 da el control. Si nadie la encuentra, controla el grupo que encontró la respuesta de mejor puesto. Los demás tienen su oportunidad en el orden confirmado del buzzer.
- Los 40 segundos y los strikes empiezan únicamente al pulsar **Juega tablero**.
- Acierto: el mismo grupo recibe otros 40 segundos. Error o tiempo agotado: un strike y otros 40 segundos. Cada grupo tiene tres strikes.
- Al tercer strike pasa al siguiente grupo de la cola, comenzando la rotación desde quien inició el tablero. Si todos llegan a tres strikes, nadie gana esa ronda. El conductor puede mostrar las respuestas y cambiar la pregunta.
- Se conserva el marcador original de rondas: +1, +2 o +3 según el multiplicador. El pozo muestra los votos. Dinero Rápido conserva su bonus interno de +1 y permite turnos para todos los grupos.
- Al cerrar el juego: 3 al primero, 1 al segundo y 0 a los demás. Si hay un empate, los grupos empatados reciben 1 y los restantes 0; si empatan todos, 1 cada uno. El aporte se aplica a cada dupla integrante del grupo.

## Erudito e Impostor

Erudito recibe respuestas simultáneas y conserva la primera respuesta confirmada de cada equipo: no se puede reemplazar. El conductor carga el número correcto sin que la pantalla le muestre las cifras de los equipos; después se revelan. En una ronda empatada no suma un acierto interno, como el original.

Impostor mantiene las cartas privadas, categorías, ruleta, votación y revelación del original, en un solo dispositivo que se van pasando. Su botón de registrar lleva el marcador acumulado de esa partida al ranking por equipos.

## Respaldo y verificación

**Guardar respaldo** descarga formación, resultados, fixture, estados guardados de los juegos y mazos. **Importar respaldo** valida el archivo antes de reemplazar los datos. Las fotos por nombre también están incluidas en el estado. Las cartas privadas de una partida en curso de Impostor se conservan solo en el dispositivo; al restaurar un respaldo esa partida se cierra y se puede iniciar otra.

Las pruebas incluidas se ejecutan con `node tests/model.cjs`. Se verificaron además las pantallas en escritorio y móvil, PIN, borradores, fotos por nombre, bonus, editor de preguntas y una simulación con cuatro navegadores compartiendo el buzzer, desconexión, recarga y doble registro.

**Pendiente antes del evento:** una prueba con tus celulares, PC y TV contra los Firebase reales. La simulación automatizada usa un transporte local; no sustituye esa prueba de conexión y latencia. Este ZIP no publica el sitio ni modifica las reglas de tus proyectos.
