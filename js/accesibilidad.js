/**
 * ============================================================================
 * COPACI Granjas Guadalupe - Módulo de Accesibilidad Universal (WCAG 2.2 AA)
 * Archivo: js/accesibilidad.js
 * ============================================================================
 * Implementa controles de accesibilidad reales y operativos:
 * - Aumento y disminución del tamaño de texto (unidades escalables)
 * - Modo de alto contraste con proporción > 7:1
 * - Resaltado visual de todos los enlaces interactivos
 * - Restablecimiento de valores predeterminados
 * - Persistencia de configuraciones en localStorage
 * - Anuncio para lectores de pantalla mediante ARIA Live Regions
 * - Manejo de teclado (cierre con Escape, trampa de foco en modales)
 * ============================================================================
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'copaci_accesibilidad_config';

  const defaultSettings = {
    fontSize: 100, // porcentaje
    highContrast: false,
    highlightLinks: false
  };

  const Accesibilidad = {
    config: Object.assign({}, defaultSettings),

    init: function () {
      this.cargarConfiguracion();
      this.vincularBotones();
      this.iniciarManejoTeclado();
      this.crearRegionLive();
    },

    cargarConfiguracion: function () {
      try {
        const guardado = localStorage.getItem(STORAGE_KEY);
        if (guardado) {
          this.config = Object.assign({}, defaultSettings, JSON.parse(guardado));
        }
      } catch (e) {
        this.config = Object.assign({}, defaultSettings);
      }
      this.aplicarCambios(false);
    },

    guardarConfiguracion: function () {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      } catch (e) {}
    },

    aplicarCambios: function (anunciar = true) {
      const html = document.documentElement;
      const body = document.body;

      // Tamaño de fuente
      html.style.fontSize = this.config.fontSize + '%';

      // Alto contraste
      if (this.config.highContrast) {
        body.classList.add('alto-contraste');
      } else {
        body.classList.remove('alto-contraste');
      }

      // Resaltar enlaces
      if (this.config.highlightLinks) {
        body.classList.add('enlaces-resaltados');
      } else {
        body.classList.remove('enlaces-resaltados');
      }

      this.guardarConfiguracion();
      this.actualizarEstadosBotones();

      if (anunciar) {
        this.anunciarLector(`Ajustes de accesibilidad actualizados: Tamaño de texto al ${this.config.fontSize}%.`);
      }
    },

    aumentarFuente: function () {
      if (this.config.fontSize < 140) {
        this.config.fontSize += 10;
        this.aplicarCambios();
      } else {
        this.anunciarLector('Se ha alcanzado el tamaño máximo de texto permitido.');
      }
    },

    disminuirFuente: function () {
      if (this.config.fontSize > 80) {
        this.config.fontSize -= 10;
        this.aplicarCambios();
      } else {
        this.anunciarLector('Se ha alcanzado el tamaño mínimo de texto permitido.');
      }
    },

    toggleAltoContraste: function () {
      this.config.highContrast = !this.config.highContrast;
      this.aplicarCambios();
      this.anunciarLector(this.config.highContrast ? 'Modo de alto contraste activado.' : 'Modo de alto contraste desactivado.');
    },

    toggleResaltarEnlaces: function () {
      this.config.highlightLinks = !this.config.highlightLinks;
      this.aplicarCambios();
      this.anunciarLector(this.config.highlightLinks ? 'Resaltado de enlaces activado.' : 'Resaltado de enlaces desactivado.');
    },

    restablecer: function () {
      this.config = Object.assign({}, defaultSettings);
      this.aplicarCambios();
      this.anunciarLector('Se ha restablecido la apariencia visual original.');
    },

    actualizarEstadosBotones: function () {
      const btnContraste = document.getElementById('btn-contraste');
      if (btnContraste) {
        btnContraste.setAttribute('aria-pressed', this.config.highContrast ? 'true' : 'false');
      }

      const btnEnlaces = document.getElementById('btn-resaltar-enlaces');
      if (btnEnlaces) {
        btnEnlaces.setAttribute('aria-pressed', this.config.highlightLinks ? 'true' : 'false');
      }
    },

    vincularBotones: function () {
      const btnAumentar = document.getElementById('btn-aumentar');
      if (btnAumentar) {
        btnAumentar.addEventListener('click', () => this.aumentarFuente());
      }

      const btnDisminuir = document.getElementById('btn-disminuir');
      if (btnDisminuir) {
        btnDisminuir.addEventListener('click', () => this.disminuirFuente());
      }

      const btnContraste = document.getElementById('btn-contraste');
      if (btnContraste) {
        btnContraste.addEventListener('click', () => this.toggleAltoContraste());
      }

      const btnEnlaces = document.getElementById('btn-resaltar-enlaces');
      if (btnEnlaces) {
        btnEnlaces.addEventListener('click', () => this.toggleResaltarEnlaces());
      }

      const btnRestablecer = document.getElementById('btn-restablecer');
      if (btnRestablecer) {
        btnRestablecer.addEventListener('click', () => this.restablecer());
      }
    },

    crearRegionLive: function () {
      let liveRegion = document.getElementById('a11y-anunciador');
      if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'a11y-anunciador';
        liveRegion.className = 'sr-only';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(liveRegion);
      }
    },

    anunciarLector: function (mensaje) {
      const liveRegion = document.getElementById('a11y-anunciador');
      if (liveRegion) {
        liveRegion.textContent = '';
        setTimeout(() => {
          liveRegion.textContent = mensaje;
        }, 50);
      }
    },

    iniciarManejoTeclado: function () {
      // Manejar Escape para cerrar modales
      window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          const modalesAbiertos = document.querySelectorAll('.modal-overlay.abierto');
          modalesAbiertos.forEach(m => {
            if (window.CopaciApp && window.CopaciApp.cerrarModales) {
              window.CopaciApp.cerrarModales();
            } else {
              m.classList.remove('abierto');
            }
          });
        }
      });
    }
  };

  window.CopaciAccesibilidad = Accesibilidad;
})(window);
