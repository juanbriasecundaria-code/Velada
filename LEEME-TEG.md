# 🌍 TEG Express — La Velada del Año

Juego construido sobre el ZIP adjunto. Incluye splash, sala previa, conductor, mapa de 50 países, dados animados de 2,2 segundos, controles móviles, objetivos secretos y ronda única. Mario Party conserva el bloque de partidas consecutivas incorporado antes.

## Probar el juego ahora

1. Descomprimí el ZIP y abrí `teg.html`.
2. Tocá **Entrar al juego → Ensayar sin conexión**. También funciona `teg.html?demo=1` desde un servidor estático.
3. El ensayo usa los equipos disponibles; si no los hay, crea cuatro equipos de demostración solo para esta prueba. No publica nada en Firebase ni suma al ranking.
4. En la tarjeta de identidad, **Controlar equipo del turno** permite manejar cada equipo cuando le toca.
5. Usá la lista de países o tocá el mapa. El mapa permite desplazamiento y zoom. En móvil, la lista evita tener que acertar a territorios pequeños.
6. Colocá refuerzos con + y −; confirmá. Elegí origen y destino, tirá los dados y confirmá el avance si conquistaste. Después podés reagrupar o terminar el turno.

Para servirlo por HTTP: desde esta carpeta, `python3 -m http.server 8000`; abrí `http://localhost:8000/teg.html?demo=1`.

## Partida compartida

- El fixture incluye una sola ronda **🌍 TEG Express**, intercalada con las otras rondas comunes.
- **Activar ronda** envía los equipos existentes al evento `principal` del Firebase nuevo. No hay que cargarlos a mano en TEG.
- **Abrir conductor** abre `teg.html?mode=host`: entrada con `100` validada por el servicio incluido. Abre la sala y después **Iniciar partida** sortea territorios, turnos y objetivos y arranca los relojes.
- Los jugadores entran desde **HUB → Complementos → TEG Express**, eligen su nombre dentro de su equipo y comparten los controles. Las acciones simultáneas se validan por versión de tablero y turno.
- **Mapa en TV** abre `teg.html?mode=tv`. La TV general también muestra TEG al activarse su ronda y vuelve al ranking al activar otro juego.
- El conductor debe mantener su pestaña abierta. Si pierde conexión, las acciones se bloquean y los relojes visibles se congelan al vencer su señal de actividad. Al recuperar el control, el conductor reanuda la partida pausada. No hay un cronómetro independiente por celular.
- La elección libre de nombre sigue el recorrido de la velada: no acredita quién es físicamente esa persona.

## Reglas

- Máximo **15 minutos globales de juego**, incluidas animaciones. Las pausas detienen ambos relojes.
- Reparto de todos los países lo más parejo posible. Cada país comienza con 2 tropas; se agregan 8 por equipo y se compensan países sobrantes para que todos tengan igual cantidad total de tropas iniciales.
- **Hasta 1 minuto para refuerzos**. Mitad de los países, redondeada hacia abajo, mínimo 3 tropas. Bonus por continente completo: Asia 7; Norteamérica y Europa 5; Sudamérica y África 3; Oceanía 2. Los bonus deben colocarse en su continente.
- Con 2–10 equipos se mantiene el minuto completo. Con más de 10, el turno se acorta automáticamente para que entren todos en una vuelta de 15 minutos. La pantalla muestra el tiempo real.
- Confirmar refuerzos o dejar vencer el tiempo distribuye automáticamente los que faltan, priorizando los países con menos tropas.
- Ataque y reagrupación comparten hasta **30 segundos**. Máximo 2 tiradas por turno. Ataca un país con más de una tropa a un enemigo vecino. Los puentes cuentan como frontera.
- Hasta 3 dados de ataque (tropas menos una) y 3 de defensa (todas las tropas). Se ordenan; en empate gana el defensor. Cada dado perdedor retira una tropa. Una única tirada autoritativa se muestra en todos los dispositivos; la animación visual no vuelve a resolver el combate.
- Al conquistar se mueve una tropa automáticamente; podés avanzar hasta dos más. Siempre queda una en origen.
- Reagrupar permite trasladar tropas entre vecinos propios. No se puede atacar después ni trasladar de nuevo tropas recién recibidas en el mismo turno.
- Objetivos breves: expansión simultánea, dos conquistas acumuladas o campaña en un continente con frentes disponibles. Se calculan después del reparto y no empiezan cumplidos. Su cumplimiento se comprueba tras cada acción y termina la partida inmediatamente. Ser alcanzable no garantiza ganarlo: siguen influyendo los dados y los rivales.
- Si vence el reloj, gana por cantidad de países y luego tropas. Un empate exacto comparte victoria. Ganadores: **3 puntos**; demás: **0**. Sin tarjetas de países ni canjes.
- El juego publica su resultado, pero el conductor **lo revisa y confirma** desde el fixture (cargar → usar resultado publicado) o desde la revisión de resultados. Reemplazar la carga reemplaza los puntos; no los duplica.

## Conexión pendiente y alcance del ZIP

Este ZIP de partida todavía contiene conexiones antiguas en las otras pantallas de la velada. No contiene `firebase-config.js` con la configuración web nueva completa. No se certifica que la plataforma completa ya esté migrada o funcione en producción.

**TEG no se conecta a los proyectos eliminados:** usa `la-velada-equipos` y la ruta `velada_v2/events/principal`. `teg-config.js` tiene el proyecto y la URL conocidos; `apiKey` y `appId` se dejan vacíos porque no fueron aportados en este ZIP. Pegá la configuración web real allí, o proporcioná `window.VELADA_FIREBASE` antes de cargar ese archivo. No uses una clave de otro proyecto ni una cuenta de servicio.

Para una velada realmente compartida, las otras pantallas también deben usar ese evento del proyecto nuevo. Este paquete agrega TEG a la versión adjunta; no reconstruye ni certifica la migración general anterior. Si ya tenés un ZIP migrado, las piezas nuevas son `teg*.js`, `teg.html`, `teg.css`, `teg-server/` y las integraciones identificadas aquí.

### Firebase para TEG

1. Completá la configuración web del proyecto `la-velada-equipos` en `teg-config.js`.
2. Habilitá **Authentication → Anonymous**. La autenticación es interna y transparente; no se pide Google ni registro.
3. En `teg-server/functions`, instalá las dependencias con `npm install`.
4. Desde `teg-server`, configurá el secreto con `firebase functions:secrets:set TEG_HOST_PASSWORD --project la-velada-equipos` y asigná **100**.
5. Desplegá la función con `firebase deploy --only functions:tegHostLogin --project la-velada-equipos`. Cloud Functions puede requerir facturación habilitada en el proyecto.
6. **Integrá** las ramas de `database.teg.rules.json` con las reglas existentes del evento. No reemplaces ciegamente las reglas de los otros juegos. El archivo es un ejemplo completo y restrictivo para un evento TEG aislado. No debe existir una autorización pública en un ancestro que permita leer las misiones o escribir el estado; en RTDB las concesiones de ancestros prevalecen.
7. Publicá las reglas integradas en el proyecto nuevo. El conductor autenticado puede gestionar TEG; cada participante solo envía comandos vinculados a su UID y lee su objetivo/respuesta; TV solo lee el mapa público.
8. Serví las páginas en HTTPS o un servidor de prueba y comprobá una partida con conductor, dos celulares y TV. No se requiere Storage para TEG.

La función valida la clave en el servidor y emite el rol `tegConductor`. No se incluye una clave administrativa en el navegador. Las reglas aíslan la sesión privada y las misiones del mapa público. La clave 100 es deliberadamente simple; no implica seguridad absoluta ni identidad física verificada.

## Archivos e integraciones

- `teg-map.js`: contornos originales, nombres, continentes y conexiones simétricas explícitas, incluidos puentes.
- `teg-engine.js`: reglas puras, objetivos, turnos, tiempos, dados, movimientos y resultado.
- `teg.html`, `teg.css`, `teg-app.js`: splash, conductor, celulares, TV y ensayo local.
- `teg-config.js`, `teg-cloud.js`: único proyecto nuevo para TEG, autenticación y conexión al evento compartido.
- `teg-fixture.js`: activación de la ronda y recepción del resultado; usa el Firebase nuevo.
- `teg-tv-bridge.js`: muestra TEG desde la TV existente según la ronda activa.
- `teg-server/`: función de autorización y reglas de acceso propuestas.
- `velada.html`: catálogo de 11 juegos, reglas, exclusión de TEG de los duelos y progreso de la noche.
- `common-rounds.js`, `puntos.js`: ronda común, revisión y reemplazo de puntos.
- `index.html`, `participante.html`: entrada desde Complementos y próxima ronda.
- `velada-rounds.js`: al activar otro juego, la TV sale de TEG.

## Verificación

**Automatizada:** todas las pruebas existentes y las nuevas `tests/teg.cjs` y `tests/teg-sync.cjs` aprobadas. Verifican 2–50 equipos, reparto, conexión del mapa, objetivos inicialmente incumplidos, dados, empates, bajas, conquistas, bonus, movimientos sin relevos, versiones obsoletas, pausa, vencimientos, final y reemplazo de puntos. La prueba de sincronización ejecuta las aplicaciones reales de conductor, dos celulares y TV con un transporte/DOM simulados: comprueba comandos simultáneos y que abrir TV no inicia ni reinicia una partida.

**Visual:** render estático del mapa SVG, contornos y etiquetas revisados. Se corrigieron conexiones que no tocaban en el SVG. Los puentes se verificaron con la imagen original. La ilustración de `docs/teg-mapa.png` corresponde al mapa real del ensayo.

**Pendiente:** navegador real y controles táctiles; sonido (esta versión no agrega audio); emulador de reglas; despliegue y acceso real en Firebase; sincronización y relojes en dispositivos reales. No se pudo instalar el navegador de pruebas en este entorno. Los tests simulados no acreditan estas comprobaciones.

### Créditos del mapa

SVG aportado: `margodth-TEG.svg`, autor declarado margodth, Openclipart. El archivo contiene declaración de dominio público y se conserva como `teg-map-original.svg`, con sus metadatos. La adaptación mantiene los contornos y puentes, reemplazando colores y etiquetas para la aplicación. TEG Express es una adaptación para la velada, sin afiliación declarada al juego comercial.
