/* ============================================================
   La Mazmorra del Saber — F2: personaje + movimiento + colisiones
   ------------------------------------------------------------
   - Carga el spritesheet del personaje (character_1.png, 16x16)
   - Crea un sprite animado en el centro de la sala
   - Movimiento fluido con WASD/flechas
   - 2 frames de animación (caminar/idle) — loop mientras se mueve
   - Colisiones con las paredes: el personaje NO puede atravesarlas
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
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const TILE_SIZE = 16;
const SCALE     = 3;
const MAP_COLS  = 12;
const MAP_ROWS  = 10;
const SPEED     = 120;   // pixeles por segundo del personaje

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
  console.log('[F2] preload: cargando tileset + personaje');
  this.load.image('tileset', 'assets/tilesets/tileset.png');
  this.load.image('personaje', 'assets/characters/character_1.png');
}

function create() {
  console.log('[F2] create: armando mundo, jugador, colisiones');

  // ---------- Mundo: tileset + cortar ----------
  this.textures.addSpriteSheet('tiles', this.textures.get('tileset').getSourceImage(), {
    frameWidth: TILE_SIZE,
    frameHeight: TILE_SIZE
  });

  const mundoAncho = MAP_COLS * TILE_SIZE * SCALE;
  const mundoAlto  = MAP_ROWS * TILE_SIZE * SCALE;
  const offsetX = (this.cameras.main.width  - mundoAncho) / 2;
  const offsetY = (this.cameras.main.height - mundoAlto)  / 2;

  // Construimos el mapa.
  // Paredes y suelo: registros de imagen para usarlos como sprites sueltos
  // que también sirven de hitbox para el jugador.
  this.paredes = [];   // referencia para el collider
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const cell = MAPA[row][col];
      const x = offsetX + col * TILE_SIZE * SCALE;
      const y = offsetY + row * TILE_SIZE * SCALE;

      if (cell === '#') {
        const pared = this.physics.add.staticImage(x, y, 'tiles', getFrameIndex(1, 1))
          .setOrigin(0, 0)
          .setScale(SCALE);
        // Forzar el body a tener el tamaño del sprite escalado
        pared.body.setSize(16, 16);
        pared.body.updateFromGameObject();
        this.paredes.push(pared);
      } else {
        this.add.image(x, y, 'tiles', getFrameIndex(2, 2))
          .setOrigin(0, 0)
          .setScale(SCALE);
      }
    }
  }

  // ---------- Spritesheet del personaje ----------
  // character_1.png es 112x64 = 7 columnas x 4 filas de frames 16x16.
  // Frames 0 y 1 = personaje azul, posición "front" (mirando al frente/abajo).
  // Frames 2 y 3 = mismo personaje con animación de caminata (cambia ligeramente).
  this.textures.addSpriteSheet('char', this.textures.get('personaje').getSourceImage(), {
    frameWidth: 16,
    frameHeight: 16
  });

  // Posición inicial: centro de la sala
  const startX = offsetX + 5 * TILE_SIZE * SCALE + TILE_SIZE * SCALE / 2;
  const startY = offsetY + 4 * TILE_SIZE * SCALE + TILE_SIZE * SCALE / 2;

  this.jugador = this.physics.add.sprite(startX, startY, 'char', 0)
    .setScale(SCALE)
    .setCollideWorldBounds(false);   // nosotros controlamos los límites

  // Animación idle (mismo frame 0 estático — no es loop)
  // Animación walk: alterna frames 0 y 1 a 6 fps
  this.anims.create({
    key: 'idle',
    frames: [{ key: 'char', frame: 0 }],
    frameRate: 1
  });
  this.anims.create({
    key: 'walk',
    frames: [
      { key: 'char', frame: 0 },
      { key: 'char', frame: 1 }
    ],
    frameRate: 6,
    repeat: -1
  });
  this.jugador.play('idle');

  // ---------- Colisiones ----------
  // Phaser Arcade Physics: el jugador choca con cada pared.
  this.physics.add.collider(this.jugador, this.paredes);

  // ---------- Input ----------
  this.cursors = this.input.keyboard.createCursorKeys();
  this.teclas = this.input.keyboard.addKeys({
    W: Phaser.Input.Keyboard.KeyCodes.W,
    A: Phaser.Input.Keyboard.KeyCodes.A,
    S: Phaser.Input.Keyboard.KeyCodes.S,
    D: Phaser.Input.Keyboard.KeyCodes.D
  });

  // ---------- UI: título + hint ----------
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

  this.hint = this.add.text(
    this.cameras.main.width / 2,
    this.cameras.main.height - 20,
    'F2 — Mover con WASD o flechas',
    {
      fontFamily: 'Trebuchet MS',
      fontSize: '14px',
      color: '#888888',
      align: 'center'
    }
  ).setOrigin(0.5);

  console.log(`[F2] mundo: ${mundoAncho}x${mundoAlto}, jugador en (${startX}, ${startY})`);
}

function update(time, delta) {
  // Resetear velocidad cada frame
  this.jugador.setVelocity(0);

  let moviendose = false;

  if (this.cursors.left.isDown || this.teclas.A.isDown) {
    this.jugador.setVelocityX(-SPEED);
    moviendose = true;
  } else if (this.cursors.right.isDown || this.teclas.D.isDown) {
    this.jugador.setVelocityX(SPEED);
    moviendose = true;
  }

  if (this.cursors.up.isDown || this.teclas.W.isDown) {
    this.jugador.setVelocityY(-SPEED);
    moviendose = true;
  } else if (this.cursors.down.isDown || this.teclas.S.isDown) {
    this.jugador.setVelocityY(SPEED);
    moviendose = true;
  }

  // Normalizar velocidad en diagonales: si se mueve en X e Y, la magnitud
  // sería sqrt(2) * SPEED. Para mantener la misma velocidad en todas
  // las direcciones, ajustamos.
  if (this.jugador.body.velocity.x !== 0 && this.jugador.body.velocity.y !== 0) {
    this.jugador.body.velocity.normalize().scale(SPEED);
  }

  // Cambiar animación según si se está moviendo o no
  if (moviendose && this.jugador.anims.currentAnim.key !== 'walk') {
    this.jugador.play('walk', true);
  } else if (!moviendose && this.jugador.anims.currentAnim.key !== 'idle') {
    this.jugador.play('idle', true);
  }
}

function getFrameIndex(row, col) {
  return row * 10 + col;
}

window.addEventListener('load', () => {
  window.game = new Phaser.Game(config);
});
