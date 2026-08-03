/* ============================================================
   La Mazmorra del Saber — F4: banco de preguntas + priest interactivo
   ------------------------------------------------------------
   - Carga preguntas/matematicas.json
   - Coloca un priest en una celda fija de la sala
   - Cuando el jugador se acerca, aparece el prompt "E para hablar"
   - Al apretar E, abre un panel con la pregunta y 4 opciones
   - Si acierta: gana 1 llave, feedback verde
   - Si falla: feedback rojo, no avanza
   - Tecla Q cierra el panel
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
const INTERACT_KEY = 'E';

const MAPA = [
  '##############################',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#...........P.................#',
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

// Estado del juego
const game = {
  preguntas: [],
  preguntaActual: null,
  llaves: 0,
  totalRespondidas: 0,
  panelAbierto: false,
  cercaDelPriest: false
};

function preload() {
  console.log('[F4] preload');
  this.load.image('tileset', 'assets/tilesets/tileset.png');
  this.load.image('personaje', 'assets/characters/character_1.png');
  this.load.image('priest', 'assets/priests/priest1/v1/priest1_v1_1.png');
  this.load.image('llave', 'assets/items/keys/keys_1_1.png');
  this.load.json('preguntas', 'preguntas/matematicas.json');
}

function create() {
  console.log('[F4] create');

  // ---------- Cargar preguntas ----------
  game.preguntas = this.cache.json.get('preguntas').preguntas;
  console.log(`[F4] cargadas ${game.preguntas.length} preguntas`);

  // ---------- Mundo ----------
  this.textures.addSpriteSheet('tiles', this.textures.get('tileset').getSourceImage(), {
    frameWidth: TILE_SIZE,
    frameHeight: TILE_SIZE
  });

  const mundoAncho = MAP_COLS * TILE_SIZE * SCALE;
  const mundoAlto  = MAP_ROWS * TILE_SIZE * SCALE;

  this.paredes = [];
  let priestX = 0, priestY = 0;
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const cell = MAPA[row][col];
      const x = col * TILE_SIZE * SCALE;
      const y = row * TILE_SIZE * SCALE;

      if (cell === '#') {
        const pared = this.physics.add.staticImage(x, y, 'tiles', getFrameIndex(1, 1))
          .setOrigin(0, 0).setScale(SCALE);
        pared.body.setSize(16, 16);
        pared.body.updateFromGameObject();
        this.paredes.push(pared);
      } else if (cell === 'P') {
        this.add.image(x, y, 'tiles', getFrameIndex(2, 2)).setOrigin(0, 0).setScale(SCALE);
        priestX = x + (TILE_SIZE * SCALE) / 2;
        priestY = y + (TILE_SIZE * SCALE) / 2;
      } else {
        this.add.image(x, y, 'tiles', getFrameIndex(2, 2)).setOrigin(0, 0).setScale(SCALE);
      }
    }
  }

  // ---------- Personaje ----------
  this.textures.addSpriteSheet('char', this.textures.get('personaje').getSourceImage(), {
    frameWidth: 16, frameHeight: 16
  });

  // Posición inicial: 4 tiles a la izquierda del priest
  const startX = (priestX / (TILE_SIZE * SCALE) - 4) * TILE_SIZE * SCALE;
  const startY = priestY;

  this.jugador = this.physics.add.sprite(startX, startY, 'char', 0)
    .setScale(SCALE);
  this.jugador.body.setSize(12, 12);  // hitbox un poco menor que el sprite

  this.anims.create({
    key: 'idle',
    frames: [{ key: 'char', frame: 0 }],
    frameRate: 1
  });
  this.anims.create({
    key: 'walk',
    frames: [{ key: 'char', frame: 0 }, { key: 'char', frame: 1 }],
    frameRate: 6, repeat: -1
  });
  this.jugador.play('idle');

  this.physics.add.collider(this.jugador, this.paredes);

  // ---------- Priest NPC ----------
  this.priest = this.add.sprite(priestX, priestY, 'priest').setScale(SCALE);

  // Trigger zone: cuando el jugador entra, mostramos el prompt
  // (es un rectángulo invisible alrededor del priest)
  // 4 tiles = 192px (más generoso vertical y horizontalmente)
  const triggerSize = TILE_SIZE * SCALE * 4;
  this.priestTrigger = this.add.zone(priestX, priestY, triggerSize, triggerSize);
  this.physics.add.existing(this.priestTrigger);
  this.priestTrigger.body.setSize(triggerSize, triggerSize);

  // --- Detección de proximidad ---
  this.physics.add.overlap(this.jugador, this.priestTrigger, () => {
    game.cercaDelPriest = true;
  }, null, this);
  // Además, chequeo manual por distancia como backup (el callback de overlap
  // puede fallar por timing de física si el body se mueve rápido)
  this.cercaDistancia = 80; // px

  // ---------- Cámara ----------
  this.cameras.main.setBounds(0, 0, mundoAncho, mundoAlto);
  this.physics.world.setBounds(0, 0, mundoAncho, mundoAlto);
  this.cameras.main.startFollow(this.jugador, true);
  this.cameras.main.setLerp(0.1, 0.1);

  // ---------- Input ----------
  this.cursors = this.input.keyboard.createCursorKeys();
  this.teclas = this.input.keyboard.addKeys({
    W: Phaser.Input.Keyboard.KeyCodes.W,
    A: Phaser.Input.Keyboard.KeyCodes.A,
    S: Phaser.Input.Keyboard.KeyCodes.S,
    D: Phaser.Input.Keyboard.KeyCodes.D,
    E: Phaser.Input.Keyboard.KeyCodes.E,
    Q: Phaser.Input.Keyboard.KeyCodes.Q
  });

  // ---------- HUD: prompt + llave + progreso ----------
  this.promptText = this.add.text(0, 0, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '18px',
    color: '#ffd966',
    backgroundColor: '#000000',
    padding: { x: 10, y: 6 },
    stroke: '#000000', strokeThickness: 2
  }).setScrollFactor(0).setVisible(false);

  this.hudLlaves = this.add.text(10, 10, '🔑 0', {
    fontFamily: 'Trebuchet MS',
    fontSize: '20px',
    color: '#ffd966',
    backgroundColor: '#000000',
    padding: { x: 10, y: 6 }
  }).setScrollFactor(0);

  this.hudProgreso = this.add.text(10, 50, 'Pregunta 0/0', {
    fontFamily: 'Trebuchet MS',
    fontSize: '14px',
    color: '#aaaaaa',
    backgroundColor: '#000000',
    padding: { x: 10, y: 4 }
  }).setScrollFactor(0);

  this.hudTitulo = this.add.text(this.cameras.main.width / 2, 30, 'Sala 1: Aritmética', {
    fontFamily: 'Trebuchet MS',
    fontSize: '24px',
    color: '#ffd966',
    align: 'center',
    stroke: '#000000', strokeThickness: 3
  }).setOrigin(0.5).setScrollFactor(0);

  // ---------- Panel de diálogo (oculto al inicio) ----------
  this.panel = crearPanelDialogo(this);
  this.panel.setVisible(false);
}

function crearPanelDialogo(scene) {
  // Container centrado en la pantalla (fijo a la cámara con setScrollFactor 0)
  const cx = scene.cameras.main.width / 2;
  const cy = scene.cameras.main.height / 2;
  const W  = 700;
  const H  = 420;

  const c = scene.add.container(cx, cy).setScrollFactor(0).setDepth(100);

  // Fondo
  const bg = scene.add.rectangle(0, 0, W, H, 0x1a1a2e, 0.97)
    .setStrokeStyle(3, 0xffd966);
  c.add(bg);

  // Título del panel
  const titulo = scene.add.text(0, -H/2 + 30, 'PREGUNTA', {
    fontFamily: 'Trebuchet MS',
    fontSize: '20px', color: '#ffd966', align: 'center',
    stroke: '#000000', strokeThickness: 2
  }).setOrigin(0.5);
  c.add(titulo);

  // Texto de la pregunta (lo llenamos al abrir)
  const pregunta = scene.add.text(0, -H/2 + 80, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '22px', color: '#ffffff', align: 'center',
    wordWrap: { width: W - 60 }
  }).setOrigin(0.5);
  c.add(pregunta);

  // 4 botones de opción
  const opciones = [];
  const OY = 30;
  const OH = 50;
  const OW = W - 80;
  for (let i = 0; i < 4; i++) {
    const oy = OY + i * (OH + 10);
    const rect = scene.add.rectangle(0, oy, OW, OH, 0x3a3a4e, 1)
      .setStrokeStyle(2, 0xffd966)
      .setInteractive({ useHandCursor: true });
    const txt = scene.add.text(0, oy, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '18px', color: '#ffffff', align: 'center'
    }).setOrigin(0.5);
    rect.on('pointerover', () => rect.setFillStyle(0x4a4a6e, 1));
    rect.on('pointerout',  () => rect.setFillStyle(0x3a3a4e, 1));
    rect.on('pointerdown', () => {
      if (game.panelAbierto) {
        responderPregunta(scene, i);
      }
    });
    c.add([rect, txt]);
    opciones.push({ rect, txt, idx: i });
  }

  // Footer
  const footer = scene.add.text(0, H/2 - 25, 'Q para cerrar', {
    fontFamily: 'Trebuchet MS',
    fontSize: '12px', color: '#888888', align: 'center'
  }).setOrigin(0.5);
  c.add(footer);

  c.setData('pregunta', pregunta);
  c.setData('opciones', opciones);
  return c;
}

function abrirPanel(scene) {
  if (game.preguntas.length === 0) return;
  // Elegir pregunta aleatoria
  const idx = Math.floor(Math.random() * game.preguntas.length);
  game.preguntaActual = game.preguntas[idx];

  // Llenar textos
  const pregunta = scene.panel.getData('pregunta');
  pregunta.setText(game.preguntaActual.pregunta);

  const opciones = scene.panel.getData('opciones');
  game.preguntaActual.opciones.forEach((opcion, i) => {
    opciones[i].txt.setText(`${String.fromCharCode(65 + i)}) ${opcion}`);
    opciones[i].rect.setFillStyle(0x3a3a4e, 1);  // reset color
  });

  scene.panel.setVisible(true);
  game.panelAbierto = true;
}

function cerrarPanel(scene) {
  scene.panel.setVisible(false);
  game.panelAbierto = false;
  game.preguntaActual = null;
}

function responderPregunta(scene, idxElegido) {
  const correcta = game.preguntaActual.respuesta;
  const opciones = scene.panel.getData('opciones');

  if (idxElegido === correcta) {
    opciones[idxElegido].rect.setFillStyle(0x28a745, 1);  // verde
    game.llaves += 1;
    game.totalRespondidas += 1;
    scene.hudLlaves.setText(`🔑 ${game.llaves}`);
    scene.hudProgreso.setText(`Aciertos: ${game.llaves} | Total: ${game.totalRespondidas}`);
  } else {
    opciones[idxElegido].rect.setFillStyle(0xdc3545, 1);   // rojo
    opciones[correcta].rect.setFillStyle(0x28a745, 1);      // verde: marcar la correcta
    game.totalRespondidas += 1;
    scene.hudProgreso.setText(`Aciertos: ${game.llaves} | Total: ${game.totalRespondidas}`);
  }

  // Cerrar panel después de 1.5 segundos
  scene.time.delayedCall(1500, () => cerrarPanel(scene));
}

function update(time, delta) {
  // Resetear velocidad
  this.jugador.setVelocity(0);
  let moviendose = false;

  // Si el panel está abierto, no nos movemos
  if (!game.panelAbierto) {
    if (this.cursors.left.isDown || this.teclas.A.isDown) {
      this.jugador.setVelocityX(-SPEED); moviendose = true;
    } else if (this.cursors.right.isDown || this.teclas.D.isDown) {
      this.jugador.setVelocityX(SPEED); moviendose = true;
    }
    if (this.cursors.up.isDown || this.teclas.W.isDown) {
      this.jugador.setVelocityY(-SPEED); moviendose = true;
    } else if (this.cursors.down.isDown || this.teclas.S.isDown) {
      this.jugador.setVelocityY(SPEED); moviendose = true;
    }
    if (this.jugador.body.velocity.x !== 0 && this.jugador.body.velocity.y !== 0) {
      this.jugador.body.velocity.normalize().scale(SPEED);
    }
  }

  if (moviendose && this.jugador.anims.currentAnim.key !== 'walk') {
    this.jugador.play('walk', true);
  } else if (!moviendose && this.jugador.anims.currentAnim.key !== 'idle') {
    this.jugador.play('idle', true);
  }

  // --- Detección de proximidad con priest ---
  // Combinamos el callback de overlap (más preciso con zonas) con un check
  // por distancia (más robusto contra timing de física).
  const distAlPriest = Math.hypot(this.jugador.x - this.priest.x, this.jugador.y - this.priest.y);
  if (game.cercaDelPriest || distAlPriest < this.cercaDistancia) {
    this.promptText.setText(`Apreta ${INTERACT_KEY} para hablar con el sacerdote`);
    this.promptText.setPosition(
      this.cameras.main.width / 2 - this.promptText.width / 2,
      this.cameras.main.height - 80
    );
    this.promptText.setVisible(true);
  } else {
    this.promptText.setVisible(false);
  }

  // Reset del flag de proximidad (lo re-activa el overlap cada frame)
  game.cercaDelPriest = false;

  // --- Tecla E: abrir panel ---
  if (Phaser.Input.Keyboard.JustDown(this.teclas.E) && !game.panelAbierto) {
    if (this.promptText.visible) {
      abrirPanel(this);
    }
  }

  // --- Tecla Q: cerrar panel ---
  if (Phaser.Input.Keyboard.JustDown(this.teclas.Q) && game.panelAbierto) {
    cerrarPanel(this);
  }
}

function getFrameIndex(row, col) {
  return row * 10 + col;
}

window.addEventListener('load', () => {
  window.game = new Phaser.Game(config);
});
