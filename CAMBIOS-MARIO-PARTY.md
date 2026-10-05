# Mario Party: ronda única

- Formato conservado: 2v2; máximo cuatro jugadores, dos representantes por equipo.
- Cantidad automática: techo(cantidad de equipos / 2). Ejemplos: 4 equipos → 2 partidas; 6 → 3; 8 → 4.
- Sorteo de rivales, orden de partidas y posición del bloque en el fixture.
- Todas las partidas de Mario Party están en una misma ronda exclusiva, sin otros juegos. Si sale ronda 5, se juegan todas en ese momento.
- La distribución se guarda y se conserva al recargar.
- Cantidad impar: un equipo sorteado repite en la última partida para que todos participen. El fixture lo indica. Se conserva el puntaje por partida del proyecto, incluida esa partida adicional.
- Cada partida conserva su carga individual de ganador, empate y bonus.
- Los cruces de Mario se cambian mediante Generar fixture; el editor manual no puede separarlos del bloque.
- Un fixture anterior sin resultados se regenera al detectar la distribución antigua. Con resultados cargados se conserva el fixture previo para no alterar puntajes; la nueva distribución se aplica a un torneo nuevo o reiniciado.

Validación: todas las pruebas del proyecto aprobadas. La prueba tests/mario-party.cjs verifica 2 a 20 equipos, cobertura, cantidad de partidas, exclusividad, casos impares, persistencia del orden y renderizado del bloque.
