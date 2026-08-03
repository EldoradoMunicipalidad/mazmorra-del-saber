/* ============================================================
   La Mazmorra del Saber — F1: tileset + primera habitación
   ------------------------------------------------------------
   - Carga el tileset
   - Lo corta en tiles de 16x16
   - Construye una habitación 12x10 tiles
     (4 paredes + 8x8 suelo + puerta de salida)
   - Renderiza el mapa estático
   ============================================================ */

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game',
  backgroundColor: '#0a0a1a',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: {
    preload: preload,
    create: create
  }
};

const TILE_SIZE = 16;
const SCALE = 3;        // cada tile se ve 3x (16 -> 48 px)
const MAP_COLS = 12;
const MAP_ROWS = 10;

// Layout del mapa:
//   # = pared
//   . = suelo
//   D = puerta (la marcamos como suelo, en F5 será interactiva)
const MAPA = [
  '############',
  '#..........#',
  '#..........#',
  '#..........#',
  '#..........#',
  '#..........#',
  '#..........#',
  '#..........#',
  '#..........D',
  '############'
];

function preload() {
  console.log('[F1] preload: cargando tileset');
  this.load.image('tileset', 'assets/tilesets/tileset.png');
}

function create() {
  console.log('[F1] create: construyendo habitación');

  // 1) Cortar el tileset en tiles individuales
  //    El tileset es 10x10 tiles de 16x16 cada uno
  //    Phaser puede cortar automáticamente con la config frames
  this.textures.addSpriteSheet('tiles', this.textures.get('tileset').getSourceImage(), {
    frameWidth: TILE_SIZE,
    frameHeight: TILE_SIZE
  });

  // 2) Generar la textura de pared y suelo a partir de los frames correctos
  //    Vamos a usar el frame (1,1) para pared y (2,2) para suelo
  const paredFrame = this.add.image(0, 0, 'tiles', getFrameIndex(1, 1))
    .setOrigin(0, 0).setVisible(false);
  const sueloFrame = this.add.image(0, 0, 'tiles', getFrameIndex(2, 2))
    .setOrigin(0, 0).setVisible(false);

  // 3) Construir el mapa iterando la matriz
  //    Cada tile se coloca en (col*TILE_SIZE*SCALE, row*TILE_SIZE*SCALE)
  const mundoAncho  = MAP_COLS * TILE_SIZE * SCALE;
  const mundoAlto   = MAP_ROWS * TILE_SIZE * SCALE;
  const offsetX = (this.cameras.main.width  - mundoAncho)  / 2;
  const offsetY = (this.cameras.main.height - mundoAlto)   / 2;

  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const cell = MAPA[row][col];
      const x = offsetX + col * TILE_SIZE * SCALE;
      const y = offsetY + row * TILE_SIZE * SCALE;

      if (cell === '#') {
        this.add.image(x, y, 'tiles', getFrameIndex(1, 1))
          .setOrigin(0, 0)
          .setScale(SCALE);
      } else {
        this.add.image(x, y, 'tiles', getFrameIndex(2, 2))
          .setOrigin(0, 0)
          .setScale(SCALE);
      }
    }
  }

  // 4) Borde decorativo: el nombre de la sala arriba
  this.add.text(
    this.cameras.main.width / 2,
    30,
    'Sala 1: Introducción',
    {
      fontFamily: 'Trebuchet MS',
      fontSize: '24px',
      color: '#ffd966',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }
  ).setOrigin(0.5);

  // 5) Etiqueta informativa abajo
  this.add.text(
    this.cameras.main.width / 2,
    this.cameras.main.height - 20,
    'F1 — Tileset + Habitación renderizada (estática)',
    {
      fontFamily: 'Trebuchet MS',
      fontSize: '14px',
      color: '#888888',
      align: 'center'
    }
  ).setOrigin(0.5);

  console.log(`[F1] habitación renderizada: ${MAP_COLS}x${MAP_ROWS} tiles, ${mundoAncho}x${mundoAlto} px`);
}

// Convierte coordenadas (row, col) del tileset a índice lineal de frame
// Asumimos grid 10x10: frame_index = row * 10 + col
function getFrameIndex(row, col) {
  return row * 10 + col;
}

// Boot
window.addEventListener('load', () => {
  new Phaser.Game(config);
});
