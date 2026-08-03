/* ============================================================
   La Mazmorra del Saber — F3: cámara que sigue al personaje
   ------------------------------------------------------------
   - Mapa más grande (30x20) para tener espacio que la cámara recorra
   - Cámara sigue al jugador con suavizado (setLerp)
   - Bordes del mundo definidos: la cámara no sale del mapa
   - Jugador no puede salir del mundo (physics bounds)
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
const MAP_COLS  = 30;
const MAP_ROWS  = 20;
const SPEED     = 120;

// Layout del mapa 30x20.
//   # = pared
//   . = suelo
//   D = puerta (F5 la hará interactiva, F3 sólo la dibuja)
const MAPA = [
  '##############################',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................D',
  '##############################'
];

function preload() {
  console.log('[F3] preload');
  this.load.image('tileset', 'assets/tilesets/tileset.png');
  this.load.image('personaje', 'assets/characters/character_1.png');
}

function create() {
  console.log('[F3] create: mundo grande + cámara que sigue al jugador');

  // ---------- Mundo: tileset + cortar ----------
  this.textures.addSpriteSheet('tiles', this.textures.get('tileset').getSourceImage(), {
    frameWidth: TILE_SIZE,
    frameHeight: TILE_SIZE
  });

  const mundoAncho = MAP_COLS * TILE_SIZE * SCALE;
  const mundoAlto  = MAP_ROWS * TILE_SIZE * SCALE;

  // Construir el mapa. Las paredes son staticImage para colisiones.
  this.paredes = [];
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const cell = MAPA[row][col];
      const x = col * TILE_SIZE * SCALE;
      const y = row * TILE_SIZE * SCALE;

      if (cell === '#') {
        const pared = this.physics.add.staticImage(x, y, 'tiles', getFrameIndex(1, 1))
          .setOrigin(0, 0)
          .setScale(SCALE);
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
  this.textures.addSpriteSheet('char', this.textures.get('personaje').getSourceImage(), {
    frameWidth: 16,
    frameHeight: 16
  });

  // Posición inicial: centro del mapa
  const startX = (MAP_COLS / 2) * TILE_SIZE * SCALE;
  const startY = (MAP_ROWS / 2) * TILE_SIZE * SCALE;

  this.jugador = this.physics.add.sprite(startX, startY, 'char', 0)
    .setScale(SCALE)
    .setCollideWorldBounds(false);

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

  this.physics.add.collider(this.jugador, this.paredes);

  // ---------- Bordes del mundo (F3) ----------
  // La cámara no puede mostrar áreas fuera del mapa
  this.cameras.main.setBounds(0, 0, mundoAncho, mundoAlto);
  // El mundo físico tampoco (el jugador rebota en los límites)
  this.physics.world.setBounds(0, 0, mundoAncho, mundoAlto);

  // ---------- Cámara que sigue al jugador (F3) ----------
  this.cameras.main.startFollow(this.jugador, true);
  // setLerp(x, y): factor de suavizado. 0.1 = sigue con un poco de delay (suave).
  this.cameras.main.setLerp(0.1, 0.1);
  // Si querés que la cámara vaya más "pegada", subí este valor a 0.5 o 1.

  // ---------- Input ----------
  this.cursors = this.input.keyboard.createCursorKeys();
  this.teclas = this.input.keyboard.addKeys({
    W: Phaser.Input.Keyboard.KeyCodes.W,
    A: Phaser.Input.Keyboard.KeyCodes.A,
    S: Phaser.Input.Keyboard.KeyCodes.S,
    D: Phaser.Input.Keyboard.KeyCodes.D
  });

  // ---------- UI: título y hint ----------
  // El título queda anclado a la cámara para que se vea siempre
  this.add.text(mundoAncho / 2, 30, 'Sala 1: Introducción', {
    fontFamily: 'Trebuchet MS',
    fontSize: '24px',
    color: '#ffd966',
    align: 'center',
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(0.5).setScrollFactor(0);  // scrollFactor 0 = no se mueve con la cámara

  this.add.text(mundoAncho / 2, mundoAlto - 20, 'F3 — Cámara que sigue al jugador. WASD/flechas.', {
    fontFamily: 'Trebuchet MS',
    fontSize: '14px',
    color: '#888888',
    align: 'center'
  }).setOrigin(0.5).setScrollFactor(0);

  // Indicador de la posición del jugador (debug, también fijo a la cámara)
  this.posText = this.add.text(10, 10, '', {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#00ff00',
    backgroundColor: '#000000',
    padding: { x: 6, y: 4 }
  }).setScrollFactor(0);

  console.log(`[F3] mundo: ${mundoAncho}x${mundoAlto} px (${MAP_COLS}x${MAP_ROWS} tiles), jugador en (${startX}, ${startY})`);
}

function update(time, delta) {
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

  if (this.jugador.body.velocity.x !== 0 && this.jugador.body.velocity.y !== 0) {
    this.jugador.body.velocity.normalize().scale(SPEED);
  }

  if (moviendose && this.jugador.anims.currentAnim.key !== 'walk') {
    this.jugador.play('walk', true);
  } else if (!moviendose && this.jugador.anims.currentAnim.key !== 'idle') {
    this.jugador.play('idle', true);
  }

  // Actualizar texto de debug con la posición del jugador
  this.posText.setText(
    `x: ${Math.round(this.jugador.x)}  y: ${Math.round(this.jugador.y)}`
  );
}

function getFrameIndex(row, col) {
  return row * 10 + col;
}

window.addEventListener('load', () => {
  window.game = new Phaser.Game(config);
});
