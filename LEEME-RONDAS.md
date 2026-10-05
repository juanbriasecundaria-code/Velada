# Selección por ronda y participante

Cambios aplicados a Guess Movies & Songs, 100 Argentinos Dicen, Palabras a Tiempo y El Erudito. No se modificaron Impostor ni Quién lo dijo.

## Cómo probar

1. Publicá la carpeta completa, incluidos los nuevos archivos `.js`, junto a los HTML. Conservá todos los archivos en el mismo nivel. Si seguís viendo la versión anterior, recargá sin caché.
2. Abrí `velada.html`. En el fixture de Fase 1 o Fase 2, tocá **Activar ronda N**. Se toman los cruces reales del fixture configurado; los nombres del ejemplo no están fijos en el código.
3. También podés tocar **Activar este cruce** debajo de un enfrentamiento para cambiar únicamente ese juego, sin afectar las otras mesas.
4. En los celulares, entrá al HUB (`index.html`), elegí el juego y tu nombre. Verás **Ronda N · X vs. Y** y solo los participantes de ese cruce.
5. Para continuar, activá la siguiente ronda desde el fixture. Los teléfonos que estaban en el buzzer vuelven a la selección de nombres.

## Comportamiento por juego

- **100 Argentinos:** aparecen los dos participantes individuales. El nombre elegido se vincula al lado correspondiente del buzzer.
- **Guess Movies & Songs:** aparecen los integrantes de los dos equipos activos. Elegir un nombre asigna su equipo automáticamente. Cualquier integrante puede tocar; el bloqueo por respuesta incorrecta sigue siendo por equipo.
- **Palabras a Tiempo:** no se agrega buzzer. Tras elegir nombre se abre el juego; el marcador y la cabecera muestran los participantes y la ronda del fixture. Si cambia el cruce, un enlace de la ronda anterior pide volver a elegir. La página también puede abrirse directamente como pantalla de apoyo.
- **El Erudito:** no se agrega buzzer. Se conserva la respuesta numérica compartida por equipo. Los nombres elegidos se vinculan automáticamente al equipo del cruce. La ronda del fixture aparece en la cabecera y el contador interno pasa a decir **Pregunta**. La primera respuesta enviada por un equipo queda bloqueada hasta la siguiente pregunta.

## Al activar una ronda

La activación se confirma antes de publicar porque reinicia el marcador del juego para los nuevos participantes. No borra ni carga resultados en la tabla de la velada, ni modifica mazos. Activar una ronda completa cierra la selección de los juegos vinculados sin cruce en esa ronda. Activar un solo cruce mantiene las otras mesas.

No se avanza automáticamente al cargar un resultado: el conductor elige cuándo cambiar los participantes. Reabrir o refrescar la página del fixture tampoco activa cruces automáticamente.

Los nombres y equipos se toman del fixture en el momento de activación. Si los editás después, volvé a activar el cruce para publicar el cambio. Cada juego admite un cruce activo; si el fixture contiene dos cruces del mismo juego en una ronda, hay que activarlos por separado.

## Conexión y comprobaciones

Se usa la conexión Firebase ya existente. Los celulares necesitan leer los nodos del juego y el panel necesita publicar la ronda. Si las reglas actuales restringen las rutas nuevas, el administrador deberá habilitar los permisos apropiados para `velada/palabras` y la publicación del fixture en los nodos existentes; no se incluyeron ni cambiaron reglas de seguridad.

Pruebas anteriores declaradas: sintaxis JavaScript; armado de cruces individuales y por equipos; rechazo de participante ajeno, lado incorrecto y cruce vencido; un solo ganador; navegación móvil; desconexión; transición de ronda; respuestas de Erudito; publicación desde el fixture; conservación de metadatos y cancelación de cuentas regresivas anteriores en Guess y 100 Argentinos. Esas pruebas anteriores no equivalen a una prueba de punta a punta con Firebase real.

## Verificación de la captura automática (27/09/2026)

Se corrigió el adaptador Firebase del panel para que pueda leer los marcadores con `once('value')`: antes esa operación faltaba y el botón **Cargar resultados automáticamente** caía siempre en la carga manual. También se evita reutilizar resultados automáticos viejos si falla la lectura, se impide asignar el siguiente cruce si falla la lectura de resultados y se vuelve a intentar publicar el fixture cuando una escritura es rechazada.

Pruebas ejecutadas con base simulada: asignación del primer cruce, marcador en vivo, captura al abrir el modal, bonus de Guess, avance al segundo cruce cuando el primero ya tiene resultado, empate, puntos generales, los dos destinatarios posibles de Dinero Rápido y carga manual tras un error de lectura. Pasaron las comprobaciones de sintaxis de los archivos `.js`.

**Pendiente para usar en el evento:** prueba real con el Firebase configurado, sus reglas y dos dispositivos; comprobar el resultado final en la tabla. Si Firebase se corta durante El Erudito, la pantalla no ofrece una partida local equivalente: habrá que llevar el marcador por separado y cargar el cruce manualmente desde `velada.html`. La prueba simulada no valida la latencia ni los permisos reales.

## Corrección tras prueba con el modo conductor

Los botones de puntuación del modo conductor actualizan el marcador interno; la página publica ese marcador en `velada/enVivo` mientras está conectada. Se corrigió la publicación de 100 Argentinos para que solo la haga el conductor y se aseguró el inicio del publicador de Palabras aunque Firebase cargue antes que el resto de la página.

**Abrir «Cargar resultados automáticamente» ya no cambia la ronda del juego.** El resultado capturado queda en `velada/resultados` y el marcador y los participantes actuales se mantienen. Para continuar, el conductor pulsa **Activar ronda N** desde el fixture; esa activación reinicia los marcadores de los juegos de la ronda. El panel rechaza marcadores publicados con nombres distintos de los participantes actuales del fixture y muestra un aviso para activar el cruce correcto. Si el panel no logra leer Firebase, ahora muestra el motivo del error en el aviso y permite la carga manual.

En las capturas de la prueba recibida, 100 Argentinos mostraba **Lara vs. Flor** y el fixture mostraba **Laza vs. Risu**. Antes de importar ese marcador hay que activar en el fixture el cruce que corresponda, porque los participantes de esas dos pantallas no coinciden. También se vio el aviso de error de lectura, por lo que esa sesión no confirmó una captura real.

## Fixture estable tras refrescar

Se corrigió otra causa de cruces cambiantes: cuando aún no había un snapshot del fixture, la Fase 1 se volvía a generar con un desempate aleatorio en cada carga. Ahora se guarda inmediatamente el primer fixture generado y el desempate es estable. Palabras no elige por su cuenta otro cruce al refrescar o al capturar resultados: lee el cruce activado y almacenado en Firebase. Las pruebas simuladas comprobaron que dos restauraciones consecutivas conservan el mismo fixture y que la captura mantiene la estación hasta la activación explícita de otra ronda.

Si ya había un cruce activo de una versión anterior con participantes distintos de los del fixture, activá una vez la ronda correcta desde `velada.html` tras publicar esta versión. No se ha probado esta migración contra la base Firebase real.

## Reiniciar puntajes para pruebas

El botón **Reglas → Reiniciar puntajes** ahora también pone en 0 los marcadores de 100 Argentinos Dicen, Palabras a Tiempo, Guess Movie/Song y El Erudito. Borra `velada/resultados` y `velada/enVivo` para que los resultados capturados durante las pruebas no vuelvan a importarse. Publica una señal de reinicio que reciben las pestañas de juegos abiertas; las páginas que se abran después la aplican una sola vez. Se conservan el fixture, los participantes y los mazos. En El Erudito vuelve a la primera pregunta con los mismos equipos.

Si el panel está sin conexión a Firebase, reinicia los marcadores guardados en ese navegador y avisa que no pudo limpiar los dispositivos remotos. Se comprobó con una base simulada el borrado local y remoto, el cruce preservado de El Erudito y la aplicación única de la señal. Falta la prueba con la base y los dispositivos reales.

## Ajustes visuales

El splash inicial de El Erudito tiene un fondo opaco y queda por encima de la barra y la selección de participantes: antes se transparentaba el contenido de la pantalla siguiente. En Guess Movie/Song, la acción de mostrar la pregunta bonus ocupa su propia fila y los dos botones «Acertó» comparten otra fila con nombres que pueden ocupar varias líneas. Así se evita el recorte del segundo equipo en la tarjeta del conductor.

Antes del evento, probá una ronda con el panel y dos celulares conectados a tu Firebase real. La publicación, reglas de acceso y latencia reales no se validaron desde aquí.

## Ensayo guiado con dispositivos

En `velada.html` abrí **Reglas → Panel de control → Ensayo guiado con dispositivos**. Elegí un cruce digital del fixture, descargá antes un backup completo y usá **Activar este cruce**. El asistente abre el juego del conductor y ofrece un QR directo al HUB para que dos celulares elijan los participantes del cruce.

Tocá **Comprobar estado** después de cada paso. El asistente lee la conexión, el fixture publicado, el cruce activo, el buzzer (en los juegos que lo usan), un marcador distinto de 0–0, la captura en Firebase y el resultado aplicado a la tabla. La selección correcta en ambos celulares y el cambio visible en la TV se confirman manualmente: esas dos observaciones no se deducen de la base. Para las mesas sin buzzer, comprobá la selección de participantes desde los celulares.

Terminá la partida antes de abrir **Cargar resultados automáticamente**: abrir ese modal toma una copia del marcador en vivo. Tras revisar y confirmar, volvé al ensayo y comprobá que el resultado figure en la tabla. El ensayo usa resultados reales y no crea puntajes de ejemplo por sí mismo. Al terminar, descargá un backup si querés conservar la prueba y usá **Reiniciar puntos de la noche** para dejar los marcadores en cero. El simulacro aleatorio es otra función separada.

## Fotos de todas las duplas posibles

Los cinco equipos fijos conservan `equipo1.jpg` a `equipo5.jpg`: Martín/Valentín, Laza/Tomás, Thiago/Lara, Totti/Risu y Cori/Flor/Mica. Las otras 51 duplas se numeran de `equipo6.jpg` a `equipo56.jpg`, siguiendo el orden original del roster individual y sin duplicar las cuatro parejas que ya son equipos fijos. La correspondencia completa aparece en la lista desplegable debajo de **Final → Fotos del podio** y también en `equipos-posibles.csv`.

Publicá únicamente las fotos de los cuatro equipos que obtuvieron puestos en la raíz de `juanbriasecundaria-code/Buzzer`, rama `main`, con su nombre exacto `equipoN.jpg`. Al guardar los puestos o abrir Final, la aplicación comprueba si cada JPG está disponible y lo asigna a su casillero. Si todavía no está publicado, el casillero indica qué archivo falta. El orden de los nombres en una dupla no cambia su número. Las fotos de podio subidas manualmente se respetan y las automáticas se actualizan al cambiar un ganador. El selector ofrece la dupla del clasificado individual con su compañero guardado y, cuando un equipo clasificado tiene tres integrantes, sus tres parejas posibles para el 2v2.

## Panel de participantes

`participante.html` toma el roster y el fixture publicados por el conductor. Muestra arriba el próximo duelo de cada persona; «Cruce activado» aparece únicamente cuando el conductor activa de verdad ese cruce digital desde el fixture. En la pestaña Final del conductor, elegí el compañero de cada clasificado individual y, si un equipo tiene tres integrantes, la dupla que juega el 2v2. Esa información y los resultados de la final se publican en el cuadro del participante. Las clasificaciones figuran como provisorias mientras haya partidos pendientes.

Los rankings de ambas fases usan el roster y los cruces que el conductor publica en `velada/fixture`: Fase 1 muestra sus jugadores y Fase 2 sus equipos, incluidos los tres integrantes si corresponde. Si ese canal no está disponible, el participante utiliza el último roster guardado en el estado; un estado viejo no debe pisar el fixture actualizado. El cuadro final se incluye en el estado. Para ver el cambio en GitHub Pages hay que subir **`velada.html`, `participante.html` y `ensayo-guiado.js`** del mismo ZIP. Abrí el conductor con conexión para publicar el fixture actual; el celular lo recibe automáticamente.

En **Palabras a Tiempo**, sin cruce activado siguen disponibles «Nombres», «Editar mazo», «PIN», «Reiniciar todo» y «Jugar sin cruce asignado (manual)». El marcador, el VAR y la revelación de categorías esperan a que se active un cruce o se elija el modo manual. Con un cruce activado, los nombres quedan fijados por el fixture del conductor y el botón lo indica.

Las apuestas se validan en Firebase al guardarse: si la ronda ya se cerró, la elección no queda registrada. El celular distingue datos en vivo de datos guardados mientras está sin conexión. Para probarlo, publicá el fixture, activá un cruce, abrí el panel en otro dispositivo y comprobá la apuesta antes y después del cierre.
