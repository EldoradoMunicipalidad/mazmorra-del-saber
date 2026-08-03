/* ============================================================
   La Mazmorra del Saber — F5: llaves + puerta + multi-sala
   ------------------------------------------------------------
   - Puerta cerrada con collider (tile 3,8 — puerta con handle)
   - Al tener 3 llaves + apretar E cerca: puerta se abre
   - Puerta cambia a sprite "abierta" (tile 3,6 — arco sin puerta)
   - Al cruzar la puerta abierta: transición a Sala 2
   - Sala 2: nuevo tema, priest con preguntas de español
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
const LLAVES_PARA_SALIR = 3;

// ---------- Salas ----------
// Sala 1: Aritmética
const SALA_1 = {
  nombre: 'Sala 1: Aritmética',
  tema: 'matematicas',
  mapa: [
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
  ]
};

// Sala 2: Español
const SALA_2 = {
  nombre: 'Sala 2: Español',
  tema: 'espanol',
  mapa: [
    '##############################',
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
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '##############################'
  ]
};

// Estado del juego
const game = {
  salaActual: 1,
  preguntas: [],
  preguntasSala: [],  // preguntas de la sala actual
  preguntaActual: null,
  llaves: 0,
  totalRespondidas: 0,
  panelAbierto: false,
  cercaDelPriest: false,
  puertaAbierta: false,
  cercaDePuerta: false,
  salaCompletada: false
};

function preload() {
  console.log('[F5] preload start');
  this.load.image('tileset', 'assets/tilesets/tileset.png');
  this.load.image('personaje', 'assets/characters/character_1.png');
  this.load.image('priest', 'assets/priests/priest1/v1/priest1_v1_1.png');
  this.load.image('llave', 'assets/items/keys/keys_1_1.png');
  this.load.json('matematicas', 'preguntas/matematicas.json');
  this.load.json('espanol', 'preguntas/espanol.json');
  console.log('[F5] preload end');
}

function create() {
  console.log('[F5] create: sala ' + game.salaActual);
  console.log('[F5] step 1: cargar preguntas');

  // Cargar preguntas de la sala actual
  const sala = game.salaActual === 1 ? SALA_1 : SALA_2;
  const banco = this.cache.json.get(sala.tema);
  game.preguntasSala = banco.preguntas;
  game.preguntas = game.preguntasSala;
  console.log('[F5] preguntas cargadas:', game.preguntasSala.length);

  // ---------- Mundo ----------
  console.log('[F5] step 2: cortar tileset');
  this.textures.addSpriteSheet('tiles', this.textures.get('tileset').getSourceImage(), {
    frameWidth: TILE_SIZE,
    frameHeight: TILE_SIZE
  });

  const mundoAncho = MAP_COLS * TILE_SIZE * SCALE;
  const mundoAlto  = MAP_ROWS * TILE_SIZE * SCALE;

  this.paredes = [];
  this.sueloGroup = [];
  this.puertaGroup = null;
  let priestX = 0, priestY = 0;
  let puertaX = 0, puertaY = 0;

  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const cell = sala.mapa[row][col];
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
      } else if (cell === 'D') {
        this.add.image(x, y, 'tiles', getFrameIndex(2, 2)).setOrigin(0, 0).setScale(SCALE);
        puertaX = x;
        puertaY = y;
      } else {
        this.add.image(x, y, 'tiles', getFrameIndex(2, 2)).setOrigin(0, 0).setScale(SCALE);
      }
    }
  }

  // ---------- Puerta (sprite con collider) ----------
  // Tile 3,8 = puerta cerrada con handle
  // Tile 3,6 = puerta abierta (arco vacío)
  this.puertaSprite = this.physics.add.staticImage(puertaX, puertaY, 'tiles', getFrameIndex(3, 8))
    .setOrigin(0, 0).setScale(SCALE);
  this.puertaSprite.body.setSize(16, 16);
  this.puertaSprite.body.updateFromGameObject();
  this.puertaSprite.puedeAbrir = true;  // cuando está cerrada

  // ---------- Personaje ----------
  this.textures.addSpriteSheet('char', this.textures.get('personaje').getSourceImage(), {
    frameWidth: 16, frameHeight: 16
  });

  // Posición inicial: cerca del priest (si no hay priest, al centro)
  let startX, startY;
  if (priestX > 0) {
    startX = (priestX / (TILE_SIZE * SCALE) - 4) * TILE_SIZE * SCALE;
    startY = priestY;
  } else {
    console.warn('[F5] no se encontró priest en el mapa, arrancando al centro');
    startX = (MAP_COLS / 2) * TILE_SIZE * SCALE;
    startY = (MAP_ROWS / 2) * TILE_SIZE * SCALE;
  }

  this.jugador = this.physics.add.sprite(startX, startY, 'char', 0).setScale(SCALE);
  console.log('[F5] step 4: jugador creado en', startX, startY);
  this.jugador.body.setSize(12, 12);

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

  // Collider: jugador contra paredes
  this.physics.add.collider(this.jugador, this.paredes);
  // Collider: jugador contra puerta (también bloquea)
  this.physics.add.collider(this.jugador, this.puertaSprite);

  // ---------- Priest ----------
  if (priestX > 0) {
    this.priest = this.add.sprite(priestX, priestY, 'priest').setScale(SCALE);

    // ---------- Trigger zones ----------
    const triggerPriest = TILE_SIZE * SCALE * 4;
    this.priestTrigger = this.add.zone(priestX, priestY, triggerPriest, triggerPriest);
    this.physics.add.existing(this.priestTrigger);
    this.priestTrigger.body.setSize(triggerPriest, triggerPriest);
    this.physics.add.overlap(this.jugador, this.priestTrigger, () => {
      game.cercaDelPriest = true;
    }, null, this);
    this.cercaDistanciaPriest = 80;
  } else {
    this.priest = null;
    this.priestTrigger = null;
    this.cercaDistanciaPriest = 0;
  }

  // Puerta: 3 tiles (más generoso)
  const triggerPuerta = TILE_SIZE * SCALE * 3;
  this.puertaTrigger = this.add.zone(puertaX + (TILE_SIZE * SCALE) / 2, puertaY + (TILE_SIZE * SCALE) / 2, triggerPuerta, triggerPuerta);
  this.physics.add.existing(this.puertaTrigger);
  this.puertaTrigger.body.setSize(triggerPuerta, triggerPuerta);
  this.physics.add.overlap(this.jugador, this.puertaTrigger, () => {
    game.cercaDePuerta = true;
  }, null, this);
  this.cercaDistanciaPuerta = 80;

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

  // ---------- HUD ----------
  this.hudLlaves = this.add.text(10, 10, `🔑 ${game.llaves}/${LLAVES_PARA_SALIR}`, {
    fontFamily: 'Trebuchet MS',
    fontSize: '20px', color: '#ffd966',
    backgroundColor: '#000000',
    padding: { x: 10, y: 6 }
  }).setScrollFactor(0);

  this.hudProgreso = this.add.text(10, 50, `Aciertos: 0 | Total: 0`, {
    fontFamily: 'Trebuchet MS',
    fontSize: '14px', color: '#aaaaaa',
    backgroundColor: '#000000',
    padding: { x: 10, y: 4 }
  }).setScrollFactor(0);

  this.hudSala = this.add.text(this.cameras.main.width / 2, 30, sala.nombre, {
    fontFamily: 'Trebuchet MS',
    fontSize: '24px', color: '#ffd966', align: 'center',
    stroke: '#000000', strokeThickness: 3
  }).setOrigin(0.5).setScrollFactor(0);

  this.promptPriest = this.add.text(0, 0, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '16px', color: '#ffd966',
    backgroundColor: '#000000',
    padding: { x: 10, y: 6 }
  }).setScrollFactor(0).setVisible(false);

  this.promptPuerta = this.add.text(0, 0, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '16px', color: '#90ee90',
    backgroundColor: '#000000',
    padding: { x: 10, y: 6 }
  }).setScrollFactor(0).setVisible(false);

  // Banner de sala completada
  this.banner = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '48px', color: '#ffd966', align: 'center',
    stroke: '#000000', strokeThickness: 5
  }).setOrigin(0.5).setScrollFactor(0).setVisible(false);

  // ---------- Panel de diálogo ----------
  this.panel = crearPanelDialogo(this);
  this.panel.setVisible(false);
}

function crearPanelDialogo(scene) {
  const cx = scene.cameras.main.width / 2;
  const cy = scene.cameras.main.height / 2;
  const W = 700, H = 420;
  const c = scene.add.container(cx, cy).setScrollFactor(0).setDepth(100);

  const bg = scene.add.rectangle(0, 0, W, H, 0x1a1a2e, 0.97).setStrokeStyle(3, 0xffd966);
  c.add(bg);

  const titulo = scene.add.text(0, -H/2 + 30, 'PREGUNTA', {
    fontFamily: 'Trebuchet MS',
    fontSize: '20px', color: '#ffd966', align: 'center',
    stroke: '#000000', strokeThickness: 2
  }).setOrigin(0.5);
  c.add(titulo);

  const pregunta = scene.add.text(0, -H/2 + 80, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '22px', color: '#ffffff', align: 'center',
    wordWrap: { width: W - 60 }
  }).setOrigin(0.5);
  c.add(pregunta);

  const opciones = [];
  for (let i = 0; i < 4; i++) {
    const oy = 30 + i * 60;
    const rect = scene.add.rectangle(0, oy, W - 80, 50, 0x3a3a4e, 1)
      .setStrokeStyle(2, 0xffd966)
      .setInteractive({ useHandCursor: true });
    const txt = scene.add.text(0, oy, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '18px', color: '#ffffff', align: 'center'
    }).setOrigin(0.5);
    rect.on('pointerover', () => rect.setFillStyle(0x4a4a6e, 1));
    rect.on('pointerout',  () => rect.setFillStyle(0x3a3a4e, 1));
    rect.on('pointerdown', () => {
      if (game.panelAbierto) responderPregunta(scene, i);
    });
    c.add([rect, txt]);
    opciones.push({ rect, txt, idx: i });
  }

  const footer = scene.add.text(0, H/2 - 25, 'Q para cerrar', {
    fontFamily: 'Trebuchet MS',
    fontSize: '12px', color: '#888888'
  }).setOrigin(0.5);
  c.add(footer);

  c.setData('pregunta', pregunta);
  c.setData('opciones', opciones);
  return c;
}

function abrirPanel(scene) {
  if (game.preguntasSala.length === 0) return;
  const idx = Math.floor(Math.random() * game.preguntasSala.length);
  game.preguntaActual = game.preguntasSala[idx];

  const pregunta = scene.panel.getData('pregunta');
  pregunta.setText(game.preguntaActual.pregunta);

  const opciones = scene.panel.getData('opciones');
  game.preguntaActual.opciones.forEach((opcion, i) => {
    opciones[i].txt.setText(`${String.fromCharCode(65 + i)}) ${opcion}`);
    opciones[i].rect.setFillStyle(0x3a3a4e, 1);
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
    opciones[idxElegido].rect.setFillStyle(0x28a745, 1);
    game.llaves += 1;
    game.totalRespondidas += 1;
    scene.hudLlaves.setText(`🔑 ${game.llaves}/${LLAVES_PARA_SALIR}`);
    scene.hudProgreso.setText(`Aciertos: ${game.llaves} | Total: ${game.totalRespondidas}`);
  } else {
    opciones[idxElegido].rect.setFillStyle(0xdc3545, 1);
    opciones[correcta].rect.setFillStyle(0x28a745, 1);
    game.totalRespondidas += 1;
    scene.hudProgreso.setText(`Aciertos: ${game.llaves} | Total: ${game.totalRespondidas}`);
  }

  scene.time.delayedCall(1500, () => cerrarPanel(scene));
}

function intentarAbrirPuerta(scene) {
  if (game.puertaAbierta) return;
  if (game.llaves >= LLAVES_PARA_SALIR) {
    // Cambiar sprite a puerta abierta
    scene.puertaSprite.setFrame(getFrameIndex(3, 6));
    scene.puertaSprite.body.enable = false;  // desactiva collider
    game.puertaAbierta = true;
    game.salaCompletada = true;

    // Banner
    scene.banner.setText('¡SALA COMPLETADA!\nPasando a la siguiente...');
    scene.banner.setVisible(true);
    scene.time.delayedCall(2500, () => {
      scene.banner.setVisible(false);
      cargarSala(scene, game.salaActual + 1);
    });
  } else {
    // Mensaje "necesitas más llaves"
    const faltan = LLAVES_PARA_SALIR - game.llaves;
    scene.banner.setText(`Necesitas ${faltan} llave${faltan > 1 ? 's' : ''} más`);
    scene.banner.setStyle({ fontSize: '32px', color: '#dc3545' });
    scene.banner.setVisible(true);
    scene.time.delayedCall(1500, () => scene.banner.setVisible(false));
  }
}

function cargarSala(scene, numSala) {
  if (numSala > 2) {
    scene.banner.setText('¡MAZMORRA COMPLETA!');
    scene.banner.setStyle({ fontSize: '64px', color: '#ffd966' });
    scene.banner.setVisible(true);
    return;
  }
  // Reset estado
  game.salaActual = numSala;
  game.llaves = 0;
  game.puertaAbierta = false;
  game.salaCompletada = false;
  // Restart scene
  scene.scene.restart();
}

function update(time, delta) {
  this.jugador.setVelocity(0);
  let moviendose = false;

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

  // --- Prompt priest ---
  if (this.priest && (game.cercaDelPriest || Math.hypot(this.jugador.x - this.priest.x, this.jugador.y - this.priest.y) < this.cercaDistanciaPriest) && !game.panelAbierto) {
    this.promptPriest.setText(`Apreta ${INTERACT_KEY} para hablar con el sacerdote`);
    this.promptPriest.setPosition(
      this.cameras.main.width / 2 - this.promptPriest.width / 2,
      this.cameras.main.height - 80
    );
    this.promptPriest.setVisible(true);
  } else {
    this.promptPriest.setVisible(false);
  }
  game.cercaDelPriest = false;

  // --- Prompt puerta ---
  if (game.puertaAbierta) {
    this.promptPuerta.setVisible(false);
  } else {
    const puertaCx = this.puertaSprite.x + (TILE_SIZE * SCALE) / 2;
    const puertaCy = this.puertaSprite.y + (TILE_SIZE * SCALE) / 2;
    const distPuerta = Math.hypot(this.jugador.x - puertaCx, this.jugador.y - puertaCy);
    if (game.cercaDePuerta || distPuerta < this.cercaDistanciaPuerta) {
      this.promptPuerta.setText(`Apreta ${INTERACT_KEY} para abrir la puerta`);
      this.promptPuerta.setPosition(
        this.cameras.main.width / 2 - this.promptPuerta.width / 2,
        this.cameras.main.height - 110
      );
      this.promptPuerta.setVisible(true);
    } else {
      this.promptPuerta.setVisible(false);
    }
  }
  game.cercaDePuerta = false;

  // --- Tecla E: contexto-aware ---
  if (Phaser.Input.Keyboard.JustDown(this.teclas.E) && !game.panelAbierto) {
    if (this.promptPriest.visible) {
      abrirPanel(this);
    } else if (this.promptPuerta.visible && !game.puertaAbierta) {
      intentarAbrirPuerta(this);
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
  // Exponer el estado para debug/tests
  window.game.events.once('ready', () => {
    window._g_state = game;
  });
});
