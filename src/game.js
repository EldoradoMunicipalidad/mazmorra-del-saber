/* ============================================================
   La Mazmorra del Saber — F0: bootstrap de Phaser
   ------------------------------------------------------------
   - Crea una ventana de 800x600
   - Pone un fondo negro azulado
   - Muestra un texto de bienvenida
   ============================================================ */

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game',
  backgroundColor: '#0a0a1a',
  pixelArt: true,             // mantener pixel art crujiente, sin antialias
  scale: {
    mode: Phaser.Scale.FIT,   // escala la ventana al tamaño del browser
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: {
    preload: preload,
    create: create
  }
};

function preload() {
  // F0: sin assets aún. En F1 cargaremos el tileset.
  console.log('[F0] preload: nada que cargar todavía');
}

function create() {
  console.log('[F0] create: escena inicializada');

  // Texto de bienvenida centrado
  this.add.text(
    this.cameras.main.width / 2,
    this.cameras.main.height / 2,
    'La Mazmorra del Saber',
    {
      fontFamily: 'Trebuchet MS',
      fontSize: '40px',
      color: '#ffd966',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4
    }
  ).setOrigin(0.5);

  this.add.text(
    this.cameras.main.width / 2,
    this.cameras.main.height / 2 + 50,
    'Fase 0 — Bootstrap OK',
    {
      fontFamily: 'Trebuchet MS',
      fontSize: '20px',
      color: '#cccccc',
      align: 'center'
    }
  ).setOrigin(0.5);
}

// Boot
window.addEventListener('load', () => {
  new Phaser.Game(config);
});
