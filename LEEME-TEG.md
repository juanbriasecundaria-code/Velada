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
- **Activar ronda** envía los equipos existentes al evento `principal` de guessmovie-905e2. No hay que cargarlos a mano en TEG.
- **Abrir conductor** abre `teg.html?mode=host`: entrada con `100` validada localmente en el navegador. Abre la sala y después **Iniciar partida** sortea territorios, turnos y objetivos y arranca los relojes.
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

## Conexión y alcance del ZIP

TEG está configurado para el proyecto existente `guessmovie-905e2`, con la configuración web completa recuperada del ZIP original, y usa la ruta propia `velada_v2/events/principal`. No hace falta completar `apiKey` ni `appId`.

Los demás juegos conservan sus conexiones originales a `guessmovie-905e2` y `cumple-598e7`, ambos confirmados como operativos por el organizador. No se migran sus rutas ni sus datos. El fixture continúa usando sus canales existentes y activa la partida en la ruta de TEG.

La configuración del cliente está lista; la partida compartida requiere habilitar autenticación anónima e integrar las reglas de TEG en el Firebase existente. Esta actualización no despliega ni verifica los servicios remotos.

### Firebase para TEG — sin Cloud Functions

1. La configuración web de `guessmovie-905e2` ya está incluida.
2. En Firebase → Authentication → Sign-in method, habilitá **Anónimo**. Los jugadores y el conductor se autentican automáticamente, sin registro.
3. En Firebase → Realtime Database → Reglas, pegá el contenido completo de `teg-server/database.teg.rules.json` y tocá **Publicar**. Este archivo integra las reglas que proporcionaste: mantiene lectura pública en las otras ramas y escrituras públicas en `velada` y `argentinos`; excluye TEG de la lectura global.
4. Publicá las páginas del ZIP en tu alojamiento habitual. Activá la ronda desde el fixture e ingresá **100**. Abrí el conductor, ingresá **100** e iniciá la partida; conectá celulares y TV.

No se requiere `tegHostLogin`, secretos, npm ni despliegue de Cloud Functions. El archivo `teg-server/firebase.json` configura únicamente las reglas de base de datos.

**Clave local y alcance:** `100` está incrustada en `teg-cloud.js`; controla la entrada de la interfaz y no otorga un rol seguro en Firebase. Las reglas permiten a cualquier usuario autenticado anónimamente gestionar TEG y consultar su sesión (incluidos objetivos). Las pantallas de jugadores y TV muestran solo lo que les corresponde, pero alguien que inspeccione el código o consulte directamente la base puede acceder a las misiones o modificar la partida. Es el modo entre amigos acordado. La concesión del conductor sigue usando la transacción, el UID y la señal de actividad para evitar dos conductores simultáneos en el recorrido normal.

Las reglas incluidas se prepararon a partir de las reglas enviadas por el organizador. Si las reglas remotas cambiaron después, integrá esas diferencias antes de publicar. No se verificó el acceso en Firebase real.

## Archivos e integraciones

- `teg-map.js`: contornos originales, nombres, continentes y conexiones simétricas explícitas, incluidos puentes.
- `teg-engine.js`: reglas puras, objetivos, turnos, tiempos, dados, movimientos y resultado.
- `teg.html`, `teg.css`, `teg-app.js`: splash, conductor, celulares, TV y ensayo local.
- `teg-config.js`, `teg-cloud.js`: proyecto guessmovie-905e2 para TEG, autenticación y conexión al evento compartido.
- `teg-fixture.js`: activación de la ronda y recepción del resultado; usa guessmovie-905e2.
- `teg-tv-bridge.js`: muestra TEG desde la TV existente según la ronda activa.
- `teg-server/`: reglas integradas y configuración de despliegue opcional de reglas.
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

## Corrección del control del conductor

Se mantiene una lectura de la sesión mientras está abierta la pestaña del conductor y se espera su carga antes de las transacciones. Si su señal vence sin que otro conductor haya tomado el control, el mismo conductor puede renovarla; una partida en curso queda pausada en el último instante confirmado para preservar el tiempo. La sala previa permite iniciar después de un retraso. Las pruebas simulan caché vacía, retraso en sala y partida, conservación del tablero y rechazo de un segundo conductor activo. No se verificó esta corrección en el Firebase remoto.

## Vista móvil y recuperación de partidas

- En horizontal el mapa completo se ajusta al ancho y alto disponibles, con tiempos y acción del turno visibles. En vertical se sugiere girar el celular.
- Zoom opcional con dos dedos o botones identificados como Zoom; «Ver mapa completo» vuelve al encuadre. Cuando está ampliado se puede desplazar el tablero con el dedo.
- Tocá un país para abrir sus controles. El panel se cierra con ×. «País / tropas» permite abrir el selector sin tocar territorios pequeños. Los refuerzos usan botones «− Tropa» y «+ Tropa», separados del zoom.
- Objetivo desplegable y controles de país aparecen sobre el tablero sin cambiar su tamaño. El resumen general y el historial se ocultan en móvil.
- La espera distingue entre el turno de otro equipo y la falta de conexión del conductor.
- Se corrige la recuperación de sesiones donde Firebase omite objetos vacíos, incluido `budget.continents`, que provocaba «Cannot convert undefined or null to object».

Pruebas: simulación de serialización Firebase, recuperación con refuerzos vencidos, mapa ajustado al ancho/alto, zoom y reinicio, gesto de dos dedos y envío de tropas. No se realizó QA visual ni prueba táctil en navegador real: el navegador no pudo instalarse en este entorno. Sigue pendiente comprobar la web publicada en los dispositivos reales.
