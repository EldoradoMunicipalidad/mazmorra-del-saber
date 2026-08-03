# La Mazmorra del Saber

Juego educativo de dungeon-crawler 2D donde el personaje debe resolver preguntas para avanzar por las salas. Cada sala es un tema educativo.

## Stack

- **Frontend:** Phaser 3 (HTML5 + JavaScript)
- **Assets:** 2D Pixel Dungeon Asset Pack v2.0 + Enemy Animations Set
- **Deploy:** Dokploy (Docker con nginx:alpine)

## Fases del proyecto

| Fase | Estado | Descripción |
|------|--------|-------------|
| F0 | ✅ | Bootstrap de Phaser + ventana con fondo y título |
| F1 | ✅ | Tileset cargado + primera habitación renderizada (12x10) |
| F2 | ✅ | Personaje + movimiento fluido WASD/flechas + colisiones con paredes |
| F3 | ✅ | Mapa 30x20 + cámara que sigue al jugador con suavizado |
| F4 | ✅ | Banco de preguntas JSON + priest interactivo + panel de diálogo |
| F5 | ✅ | Sistema de 3 llaves + puerta con collider + transición Sala 1→Sala 2 |
| F6 | ⏳ | UI/HUD + enemigos + deploy |

## Estructura

```
mazmorra-del-saber/
├── index.html              # Phaser por CDN
├── src/
│   └── game.js             # Lógica del juego
├── preguntas/              # Bancos de preguntas por tema
│   ├── matematicas.json    (10 preguntas - completo)
│   ├── espanol.json        (vacío)
│   ├── ciencias.json       (vacío)
│   ├── historia-cr.json    (vacío)
│   └── ingles.json         (vacío)
├── assets/                 # Sprites organizados
│   ├── tilesets/           # tileset del dungeon
│   ├── characters/         # personaje principal
│   ├── enemies/            # esqueletos, vampiro + animaciones
│   ├── items/              # pociones, llaves, cofres, monedas
│   ├── priests/            # NPCs que dan pistas/preguntas
│   └── ui/                 # paneles del HUD
├── Dockerfile
└── .dockerignore
```

## Cómo correr localmente

```bash
# Opción 1: servidor simple de Python
cd mazmorra-del-saber
python -m http.server 8000
# Abrir http://localhost:8000

# Opción 2: abrir directamente index.html (puede fallar con CORS en algunos browsers)
```

## Deploy

Igual que el juego de Preguntados:
1. Push a `EldoradoMunicipalidad/mazmorra-del-saber`
2. Dokploy → New Application
3. Port: 80
4. Dominio: `mazmorra.eldorado.gob.ar` (o el sslip.io temporal)
