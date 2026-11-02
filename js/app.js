/**
 * ============================================================================
 * COPACI Granjas Guadalupe - Controlador Principal de la Aplicación
 * Archivo: js/app.js
 * ============================================================================
 * Coordina la inicialización, enrutamiento interno, modales, actualización
 * del DOM según el estado de la sesión, envío de formularios y eventos globales.
 * ============================================================================
 */

(function (window) {
  'use strict';

  const App = {
    /**
     * Inicialización principal al cargar el DOM
     */
    init: async function () {
      console.log('Iniciando Sistema de Control Ciudadano COPACI Granjas Guadalupe...');

      // 1. Inicializar autenticación y cuentas demo
      if (window.CopaciAuth) {
        await window.CopaciAuth.init();
      }

      // 2. Inicializar accesibilidad
      if (window.CopaciAccesibilidad) {
        window.CopaciAccesibilidad.init();
      }

      // 3. Establecer años dinámicos
      this.actualizarFechasDinamicas();

      // 4. Vincular navegación y botones de autenticación
      this.actualizarUIAutenticacion();

      // 5. Vincular eventos de formularios
      this.vincularFormularios();

      // 6. Escuchar cambios de autenticación y de datos
      window.addEventListener('copaci_auth_changed', () => {
        this.actualizarUIAutenticacion();
        if (window.CopaciAuth.isAdmin()) {
          this.mostrarSeccionAdminSiAplica();
        }
      });

      window.addEventListener('copaci_data_updated', (e) => {
        if (window.CopaciAuth.isAdmin()) {
          window.CopaciAdmin.renderPanel('contenedor-admin');
        }
      });

      // 7. Configurar menú móvil
      this.configurarMenuMovil();

      // 8. Configurar pestañas de reportes urbanos
      this.configurarPestanasReportes();

      // 9. Configurar cierre de modales al hacer clic en el fondo oscuro
      document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            this.cerrarModales();
          }
        });
      });

      console.log('Sistema COPACI inicializado correctamente.');
    },

    /**
     * Actualiza años dinámicos en copyright y documentos
     */
    actualizarFechasDinamicas: function () {
      const anioActual = new Date().getFullYear();

      // En el pie de página
      const copyrightSpan = document.getElementById('anio-copyright');
      if (copyrightSpan) copyrightSpan.textContent = anioActual;

      // Input de fecha de reporte en luminarias (default hoy)
      const inputFechaLum = document.getElementById('lum-fecha');
      if (inputFechaLum) {
        inputFechaLum.value = new Date().toISOString().split('T')[0];
      }
    },

    /**
     * Actualiza la interfaz del encabezado según si hay usuario activo y su rol
     */
    actualizarUIAutenticacion: function () {
      const sesion = window.CopaciAuth ? window.CopaciAuth.getSession() : null;
      const navContenedorAuth = document.getElementById('nav-auth-acciones');
      const seccionAdmin = document.getElementById('panel-administrador') || document.getElementById('seccion-panel-admin');
      const bannerBienvenida = document.getElementById('banner-usuario-activo');

      if (!navContenedorAuth) return;

      if (sesion) {
        const esAdmin = sesion.rol === 'admin';

        // Renderizar opciones de usuario logueado en la barra de navegación
        navContenedorAuth.innerHTML = `
          <div class="usuario-sesion-badge">
            <span class="usuario-avatar"><i class="fa-solid ${esAdmin ? 'fa-shield-halved' : 'fa-user'}"></i></span>
            <div class="usuario-info-nav">
              <span class="usuario-nombre-nav">${this.escaparHTML(sesion.nombre)}</span>
              <span class="usuario-rol-nav">${esAdmin ? 'Mesa Directiva' : 'Vecino'}</span>
            </div>
          </div>
          ${!esAdmin ? `
            <button class="boton boton-secundario-nav" id="btn-mis-tramites">
              <i class="fa-solid fa-folder-open" aria-hidden="true"></i> Mis Trámites
            </button>
          ` : `
            <a href="#panel-administrador" class="boton boton-secundario-nav">
              <i class="fa-solid fa-gauge-high" aria-hidden="true"></i> Panel Admin
            </a>
          `}
          <button class="boton boton-cerrar-sesion" id="btn-logout" title="Cerrar sesión actual">
            <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i> Salir
          </button>
        `;

        // Eventos
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
          btnLogout.addEventListener('click', () => {
            window.CopaciAuth.logout();
            this.mostrarNotificacion('Has cerrado sesión correctamente. ¡Hasta pronto!', 'info');
          });
        }

        const btnMisTramites = document.getElementById('btn-mis-tramites');
        if (btnMisTramites) {
          btnMisTramites.addEventListener('click', () => {
            this.abrirModalMisTramites();
          });
        }

        // Mostrar u ocultar sección del panel admin
        if (seccionAdmin) {
          if (esAdmin) {
            seccionAdmin.style.display = 'block';
            window.CopaciAdmin.renderPanel('contenedor-admin');
          } else {
            seccionAdmin.style.display = 'none';
          }
        }

        // Banner informativo en Hero
        if (bannerBienvenida) {
          bannerBienvenida.style.display = 'block';
          bannerBienvenida.innerHTML = `
            <div class="banner-bienvenida-contenido">
              <span>¡Bienvenido(a), <strong>${this.escaparHTML(sesion.nombre)}</strong>! (${esAdmin ? 'Mesa Directiva COPACI' : 'Vecino de Granjas Guadalupe'})</span>
              ${!esAdmin ? `<button class="btn-banner-link" onclick="CopaciApp.abrirModalMisTramites()"><i class="fa-solid fa-eye"></i> Ver mis trámites y reportes</button>` : `<a href="#panel-administrador" class="btn-banner-link"><i class="fa-solid fa-sliders"></i> Ir al Panel de Administración</a>`}
            </div>
          `;
        }

      } else {
        // Visitante no autenticado
        navContenedorAuth.innerHTML = `
          <button class="boton boton-login-nav" id="btn-abrir-login">
            <i class="fa-solid fa-arrow-right-to-bracket" aria-hidden="true"></i> Iniciar Sesión
          </button>
          <button class="boton boton-registro-nav" id="btn-abrir-registro">
            <i class="fa-solid fa-user-plus" aria-hidden="true"></i> Registrarme
          </button>
        `;

        const btnLogin = document.getElementById('btn-abrir-login');
        if (btnLogin) btnLogin.addEventListener('click', () => this.abrirModalLogin());

        const btnRegistro = document.getElementById('btn-abrir-registro');
        if (btnRegistro) btnRegistro.addEventListener('click', () => this.abrirModalRegistro());

        if (seccionAdmin) seccionAdmin.style.display = 'none';
        if (bannerBienvenida) bannerBienvenida.style.display = 'none';
      }
    },

    mostrarSeccionAdminSiAplica: function () {
      const seccionAdmin = document.getElementById('panel-administrador') || document.getElementById('seccion-panel-admin');
      if (seccionAdmin && window.CopaciAuth && window.CopaciAuth.isAdmin()) {
        seccionAdmin.style.display = 'block';
        window.CopaciAdmin.renderPanel('contenedor-admin');
      }
    },

    /**
     * Vinculación de formularios
     */
    vincularFormularios: function () {
      // 1. Formulario de Inicio de Sesión
      const formLogin = document.getElementById('form-login');
      if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
          e.preventDefault();
          const correo = document.getElementById('login-correo').value;
          const pass = document.getElementById('login-password').value;
          const msgError = document.getElementById('login-error-msg');
          msgError.textContent = '';
          msgError.style.display = 'none';

          try {
            const user = await window.CopaciAuth.login(correo, pass);
            this.cerrarModales();
            formLogin.reset();
            this.mostrarNotificacion(`✅ Bienvenido(a) al portal, ${user.nombre}.`, 'exito');
            if (user.rol === 'admin') {
              const panel = document.getElementById('panel-administrador');
              if (panel) panel.scrollIntoView({ behavior: 'smooth' });
            }
          } catch (err) {
            msgError.textContent = err.message;
            msgError.style.display = 'block';
          }
        });
      }

      // 2. Formulario de Registro
      const formRegistro = document.getElementById('form-registro');
      if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
          e.preventDefault();
          const nombre = document.getElementById('reg-nombre').value;
          const direccion = document.getElementById('reg-direccion').value;
          const correo = document.getElementById('reg-correo').value;
          const pass = document.getElementById('reg-password').value;
          const passConfirm = document.getElementById('reg-password-confirm').value;
          const msgError = document.getElementById('reg-error-msg');
          msgError.textContent = '';
          msgError.style.display = 'none';

          if (pass !== passConfirm) {
            msgError.textContent = 'Las contraseñas no coinciden. Por favor verifícalas.';
            msgError.style.display = 'block';
            return;
          }

          try {
            const nuevoVecino = await window.CopaciAuth.registerVecino({
              nombre, direccion, correo, password: pass
            });
            this.cerrarModales();
            formRegistro.reset();
            this.mostrarNotificacion(`🎉 ¡Registro exitoso! Bienvenido(a) ${nuevoVecino.nombre}. Tu cuenta de vecino está activa.`, 'exito');
          } catch (err) {
            msgError.textContent = err.message;
            msgError.style.display = 'block';
          }
        });
      }

      // 3. Formulario de Constancias
      const formConstancia = document.getElementById('form-constancia');
      if (formConstancia) {
        formConstancia.addEventListener('submit', (e) => {
          e.preventDefault();
          const sesion = window.CopaciAuth.getSession();
          if (!sesion) {
            this.mostrarNotificacion('⚠️ Para solicitar una constancia debes iniciar sesión o registrarte primero.', 'advertencia');
            this.abrirModalLogin();
            return;
          }

          const nombre = document.getElementById('const-nombre').value;
          const direccion = document.getElementById('const-direccion').value;
          const telefono = document.getElementById('const-telefono').value;
          const motivo = document.getElementById('const-motivo').value;
          const tiempoResidencia = document.getElementById('const-tiempo').value;

          try {
            const nueva = window.CopaciConstancias.crearSolicitud({
              nombre, direccion, telefono, motivo, tiempoResidencia
            }, sesion);

            this.cerrarModales();
            formConstancia.reset();
            this.mostrarNotificacion(`✅ Solicitud registrada con éxito. Folio asignado: ${nueva.folio}`, 'exito');
            // Abrir vista previa del comprobante digital automáticamente
            this.mostrarModalComprobante(nueva);
          } catch (err) {
            this.mostrarNotificacion(`❌ ${err.message}`, 'error');
          }
        });
      }

      // 4. Formulario de Reporte de Luminarias
      const formLuminaria = document.getElementById('form-reporte-luminaria');
      if (formLuminaria) {
        formLuminaria.addEventListener('submit', (e) => {
          e.preventDefault();
          const sesion = window.CopaciAuth.getSession();
          if (!sesion) {
            this.mostrarNotificacion('⚠️ Debes iniciar sesión para levantar un reporte de luminarias.', 'advertencia');
            this.abrirModalLogin();
            return;
          }

          const calle = document.getElementById('lum-calle').value;
          const entreCalles = document.getElementById('lum-entre').value;
          const descripcion = document.getElementById('lum-descripcion').value;
          const fechaReporte = document.getElementById('lum-fecha').value;

          try {
            const rep = window.CopaciReportes.crearReporteLuminaria({
              calle, entreCalles, descripcion, fechaReporte
            }, sesion);

            formLuminaria.reset();
            this.actualizarFechasDinamicas();
            this.mostrarModalConfirmacionFolio({
              titulo: 'Reporte de Luminaria Registrado',
              folio: rep.folio,
              tipo: 'Falla de Alumbrado Público',
              ubicacion: `${rep.calle} (entre ${rep.entreCalles})`,
              mensaje: 'Tu reporte ha sido canalizado a la cuadrilla de alumbrado público del COPACI. Puedes consultar su estado en cualquier momento con tu folio.'
            });
          } catch (err) {
            this.mostrarNotificacion(`❌ ${err.message}`, 'error');
          }
        });
      }

      // 5. Formulario de Reporte de Bacheo
      const formBacheo = document.getElementById('form-reporte-bacheo');
      if (formBacheo) {
        formBacheo.addEventListener('submit', (e) => {
          e.preventDefault();
          const sesion = window.CopaciAuth.getSession();
          if (!sesion) {
            this.mostrarNotificacion('⚠️ Debes iniciar sesión para reportar un bache.', 'advertencia');
            this.abrirModalLogin();
            return;
          }

          const ubicacion = document.getElementById('bac-ubicacion').value;
          const gravedad = document.getElementById('bac-gravedad').value;
          const descripcion = document.getElementById('bac-descripcion').value;

          try {
            const rep = window.CopaciReportes.crearReporteBacheo({
              ubicacion, gravedad, descripcion
            }, sesion);

            formBacheo.reset();
            this.mostrarModalConfirmacionFolio({
              titulo: 'Reporte de Bacheo Registrado',
              folio: rep.folio,
              tipo: `Bacheo y Pavimentación (Gravedad: ${rep.gravedad})`,
              ubicacion: rep.ubicacion,
              mensaje: 'El daño vial ha sido integrado al programa de bacheo y mantenimiento de calles del COPACI Granjas Guadalupe.'
            });
          } catch (err) {
            this.mostrarNotificacion(`❌ ${err.message}`, 'error');
          }
        });
      }

      // 6. Buscador Universal de Folio
      const formBuscador = document.getElementById('form-buscador-folio');
      if (formBuscador) {
        formBuscador.addEventListener('submit', (e) => {
          e.preventDefault();
          const folioInput = document.getElementById('input-folio-buscar');
          const folio = folioInput ? folioInput.value.trim() : '';

          if (!folio) {
            this.mostrarNotificacion('⚠️ Por favor ingresa un número de folio.', 'advertencia');
            return;
          }

          const resultado = window.CopaciReportes.buscarPorFolio(folio);
          this.mostrarModalResultadoFolio(folio, resultado);
        });
      }

      // 7. Buzón Ciudadano (Preservado de la versión original con retroalimentación accesible)
      const formBuzon = document.querySelector('.formulario-buzon');
      if (formBuzon) {
        formBuzon.addEventListener('submit', function (e) {
          e.preventDefault();
          const mensaje = document.getElementById('mensaje-buzon').value.trim();
          if (mensaje) {
            alert(
              '✅ ¡Mensaje enviado al Buzón Ciudadano!\n\n' +
              'Gracias por tu participación. Tu sugerencia u opinión ha sido remitida a la Mesa Directiva del COPACI Granjas Guadalupe.'
            );
            this.reset();
          } else {
            alert('⚠️ Por favor escribe tu mensaje o sugerencia antes de presionar enviar.');
          }
        });
      }

      // 8. Botón en Hero y botón de trámites para abrir formulario de constancias
      const btnIniciarTramiteHero = document.getElementById('btn-iniciar-tramite-hero');
      if (btnIniciarTramiteHero) {
        btnIniciarTramiteHero.addEventListener('click', (e) => {
          e.preventDefault();
          this.abrirModalConstancia();
        });
      }

      const enlaceTramiteConstancia = document.getElementById('enlace-tramite-constancia');
      if (enlaceTramiteConstancia) {
        enlaceTramiteConstancia.addEventListener('click', (e) => {
          e.preventDefault();
          this.abrirModalConstancia();
        });
      }
    },

    /**
     * Pestañas para alternar entre Luminarias y Bacheo en la sección de reportes
     */
    configurarPestanasReportes: function () {
      const tabs = document.querySelectorAll('.pestana-reporte-btn');
      tabs.forEach(tab => {
        tab.addEventListener('click', function () {
          tabs.forEach(t => {
            t.classList.remove('activa');
            t.setAttribute('aria-selected', 'false');
          });
          document.querySelectorAll('.panel-reporte-formulario').forEach(p => p.classList.remove('visible'));

          this.classList.add('activa');
          this.setAttribute('aria-selected', 'true');
          const targetId = this.getAttribute('data-formulario');
          const target = document.getElementById(targetId);
          if (target) target.classList.add('visible');
        });
      });
    },

    /**
     * Menú hamburguesa responsivo
     */
    configurarMenuMovil: function () {
      const menuBtn = document.querySelector('.menu-hamburguesa');
      const navMenu = document.querySelector('.nav-menu');

      if (!menuBtn || !navMenu) return;

      menuBtn.addEventListener('click', function () {
        const estaAbierto = menuBtn.getAttribute('aria-expanded') === 'true';
        menuBtn.setAttribute('aria-expanded', !estaAbierto);
        navMenu.classList.toggle('nav-activo');
        menuBtn.classList.toggle('hamburguesa-activa');
      });

      document.querySelectorAll('.nav-menu a').forEach(function (enlace) {
        enlace.addEventListener('click', function () {
          navMenu.classList.remove('nav-activo');
          menuBtn.classList.remove('hamburguesa-activa');
          menuBtn.setAttribute('aria-expanded', 'false');
        });
      });
    },

    /**
     * ========================================================================
     * GESTIÓN DE MODALES
     * ========================================================================
     */
    cerrarModales: function () {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('abierto'));
      document.body.classList.remove('modal-bloqueado');
    },

    abrirModal: function (modalId) {
      this.cerrarModales();
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('abierto');
        document.body.classList.add('modal-bloqueado');
        // Enfocar el primer input o botón
        const primerElemento = modal.querySelector('input, button:not(.btn-cerrar-modal)');
        if (primerElemento) primerElemento.focus();
      }
    },

    abrirModalLogin: function () {
      this.abrirModal('modal-login');
    },

    abrirModalRegistro: function () {
      this.abrirModal('modal-registro');
    },

    abrirModalConstancia: function () {
      const sesion = window.CopaciAuth.getSession();
      if (!sesion) {
        this.mostrarNotificacion('⚠️ Por favor inicia sesión o crea tu cuenta de vecino para solicitar tu constancia.', 'advertencia');
        this.abrirModalLogin();
        return;
      }

      // Prellenar con datos conocidos del vecino
      const inputNombre = document.getElementById('const-nombre');
      const inputDireccion = document.getElementById('const-direccion');
      if (inputNombre && !inputNombre.value) inputNombre.value = sesion.nombre;
      if (inputDireccion && !inputDireccion.value) inputDireccion.value = sesion.direccion;

      this.abrirModal('modal-constancia');
    },

    abrirModalMisTramites: function () {
      const sesion = window.CopaciAuth.getSession();
      if (!sesion) {
        this.abrirModalLogin();
        return;
      }

      const contenedor = document.getElementById('contenido-mis-tramites');
      if (!contenedor) return;

      const constancias = window.CopaciConstancias.obtenerPorUsuario(sesion.id);
      const luminarias = window.CopaciReportes.obtenerLuminariasPorUsuario(sesion.id);
      const bacheo = window.CopaciReportes.obtenerBacheoPorUsuario(sesion.id);

      const total = constancias.length + luminarias.length + bacheo.length;

      let html = `
        <div class="mis-tramites-header">
          <h3><i class="fa-solid fa-folder-open"></i> Trámites y Reportes de ${this.escaparHTML(sesion.nombre)}</h3>
          <p>Consulta el estado y seguimiento de todas tus solicitudes en Granjas Guadalupe.</p>
        </div>
      `;

      if (total === 0) {
        html += `
          <div class="alerta-vacia">
            <i class="fa-solid fa-file-circle-question fa-2x"></i>
            <p>Aún no has registrado ninguna solicitud de constancia o reporte urbano.</p>
            <div class="acciones-vacia">
              <button class="boton boton-primario" onclick="CopaciApp.cerrarModales(); CopaciApp.abrirModalConstancia();">
                <i class="fa-solid fa-file-certificate"></i> Solicitar Constancia
              </button>
            </div>
          </div>
        `;
      } else {
        html += `<div class="lista-mis-tramites">`;

        // 1. Constancias del vecino
        constancias.forEach(c => {
          let badge = 'badge-pendiente';
          let icono = 'fa-clock';
          if (c.estatus === 'Atendido') { badge = 'badge-atendido'; icono = 'fa-circle-check'; }
          else if (c.estatus === 'En proceso' || c.estatus === 'En revisión') { badge = 'badge-proceso'; icono = 'fa-arrows-rotate'; }
          else if (c.estatus === 'Rechazado') { badge = 'badge-rechazado'; icono = 'fa-circle-xmark'; }

          html += `
            <div class="tarjeta-mi-tramite">
              <div class="tramite-top">
                <span class="tipo-tag tag-constancia"><i class="fa-solid fa-file-signature"></i> Constancia de Residencia</span>
                <span class="estatus-pill ${badge}"><i class="fa-solid ${icono}"></i> ${c.estatus}</span>
              </div>
              <h4>Folio: <strong>${c.folio}</strong></h4>
              <p><strong>Motivo:</strong> ${this.escaparHTML(c.motivo)}</p>
              <p><strong>Fecha de solicitud:</strong> ${c.fechaFormateada}</p>
              <p class="observacion-admin-box"><i class="fa-solid fa-comment-dots"></i> <em>Nota COPACI:</em> ${this.escaparHTML(c.observacionesAdmin || 'En revisión por la directiva.')}</p>
              <div class="tramite-acciones">
                <button class="boton boton-secundario-outline" onclick="CopaciApp.verComprobantePorFolio('${c.folio}')">
                  <i class="fa-solid fa-file-pdf"></i> Ver Comprobante Digital
                </button>
              </div>
            </div>
          `;
        });

        // 2. Luminarias del vecino
        luminarias.forEach(l => {
          let badge = 'badge-pendiente';
          let icono = 'fa-clock';
          if (l.estatus === 'Atendido') { badge = 'badge-atendido'; icono = 'fa-circle-check'; }
          else if (l.estatus === 'En proceso' || l.estatus === 'En revisión') { badge = 'badge-proceso'; icono = 'fa-arrows-rotate'; }
          else if (l.estatus === 'Rechazado') { badge = 'badge-rechazado'; icono = 'fa-circle-xmark'; }

          html += `
            <div class="tarjeta-mi-tramite">
              <div class="tramite-top">
                <span class="tipo-tag tag-luminaria"><i class="fa-solid fa-lightbulb"></i> Reporte de Luminaria</span>
                <span class="estatus-pill ${badge}"><i class="fa-solid ${icono}"></i> ${l.estatus}</span>
              </div>
              <h4>Folio: <strong>${l.folio}</strong></h4>
              <p><strong>Ubicación:</strong> ${this.escaparHTML(l.calle)} (Entre: ${this.escaparHTML(l.entreCalles)})</p>
              <p><strong>Falla:</strong> ${this.escaparHTML(l.descripcion)}</p>
              <p><strong>Fecha del reporte:</strong> ${l.fechaReporte}</p>
              <p class="observacion-admin-box"><i class="fa-solid fa-comment-dots"></i> <em>Nota COPACI:</em> ${this.escaparHTML(l.observacionesAdmin || 'Canalizado para inspección técnica.')}</p>
            </div>
          `;
        });

        // 3. Bacheo del vecino
        bacheo.forEach(b => {
          let badge = 'badge-pendiente';
          let icono = 'fa-clock';
          if (b.estatus === 'Atendido') { badge = 'badge-atendido'; icono = 'fa-circle-check'; }
          else if (b.estatus === 'En proceso' || b.estatus === 'En revisión') { badge = 'badge-proceso'; icono = 'fa-arrows-rotate'; }
          else if (b.estatus === 'Rechazado') { badge = 'badge-rechazado'; icono = 'fa-circle-xmark'; }

          html += `
            <div class="tarjeta-mi-tramite">
              <div class="tramite-top">
                <span class="tipo-tag tag-bacheo"><i class="fa-solid fa-road"></i> Reporte de Bacheo (${b.gravedad})</span>
                <span class="estatus-pill ${badge}"><i class="fa-solid ${icono}"></i> ${b.estatus}</span>
              </div>
              <h4>Folio: <strong>${b.folio}</strong></h4>
              <p><strong>Ubicación:</strong> ${this.escaparHTML(b.ubicacion)}</p>
              <p><strong>Descripción:</strong> ${this.escaparHTML(b.descripcion)}</p>
              <p><strong>Fecha:</strong> ${b.fechaFormateada || b.fechaRegistro.split('T')[0]}</p>
              <p class="observacion-admin-box"><i class="fa-solid fa-comment-dots"></i> <em>Nota COPACI:</em> ${this.escaparHTML(b.observacionesAdmin || 'Programado para bacheo.')}</p>
            </div>
          `;
        });

        html += `</div>`;
      }

      contenedor.innerHTML = html;
      this.abrirModal('modal-mis-tramites');
    },

    verComprobantePorFolio: function (folio) {
      const constancia = window.CopaciConstancias.obtenerPorFolio(folio);
      if (constancia) {
        this.mostrarModalComprobante(constancia);
      }
    },

    mostrarModalComprobante: function (constancia) {
      const contenedor = document.getElementById('comprobante-render-area');
      if (!contenedor) return;

      contenedor.innerHTML = window.CopaciConstancias.generarComprobanteHTML(constancia);
      this.abrirModal('modal-comprobante');
    },

    imprimirComprobante: function () {
      window.print();
    },

    mostrarModalConfirmacionFolio: function (detalles) {
      const contenedor = document.getElementById('contenido-confirmacion-folio');
      if (!contenedor) return;

      contenedor.innerHTML = `
        <div class="confirmacion-folio-box">
          <div class="icono-exito-animado"><i class="fa-solid fa-circle-check"></i></div>
          <h3>${detalles.titulo}</h3>
          <p class="mensaje-folio-intro">${detalles.mensaje}</p>
          <div class="caja-folio-destacado">
            <span>TU NÚMERO DE FOLIO:</span>
            <strong>${detalles.folio}</strong>
          </div>
          <div class="detalles-resumen-folio">
            <p><strong>Tipo:</strong> ${detalles.tipo}</p>
            <p><strong>Ubicación:</strong> ${detalles.ubicacion}</p>
            <p><strong>Estado:</strong> <span class="badge-pendiente"><i class="fa-solid fa-clock"></i> Pendiente</span></p>
          </div>
          <div class="acciones-modal-confirmacion">
            <button class="boton boton-primario" onclick="CopaciApp.cerrarModales()">
              <i class="fa-solid fa-check"></i> Entendido y Aceptar
            </button>
          </div>
        </div>
      `;
      this.abrirModal('modal-confirmacion-folio');
    },

    mostrarModalResultadoFolio: function (folioBuscado, resultado) {
      const contenedor = document.getElementById('contenido-resultado-folio');
      if (!contenedor) return;

      if (!resultado) {
        contenedor.innerHTML = `
          <div class="resultado-folio-vacio">
            <i class="fa-solid fa-magnifying-glass-chart fa-3x" style="color: var(--naranja-coral);"></i>
            <h3>Folio No Encontrado</h3>
            <p>No se encontró ningún trámite o reporte registrado con el folio: <strong>"${this.escaparHTML(folioBuscado)}"</strong>.</p>
            <p><small>Verifica que esté escrito correctamente, incluyendo guiones y el año (ejemplo: <code>CR-${new Date().getFullYear()}-1234</code>).</small></p>
            <button class="boton boton-primario" onclick="CopaciApp.cerrarModales()">Cerrar</button>
          </div>
        `;
      } else {
        let badge = 'badge-pendiente';
        let icono = 'fa-clock';
        if (resultado.estatus === 'Atendido') { badge = 'badge-atendido'; icono = 'fa-circle-check'; }
        else if (resultado.estatus === 'En proceso' || resultado.estatus === 'En revisión') { badge = 'badge-proceso'; icono = 'fa-arrows-rotate'; }
        else if (resultado.estatus === 'Rechazado') { badge = 'badge-rechazado'; icono = 'fa-circle-xmark'; }

        contenedor.innerHTML = `
          <div class="resultado-folio-card">
            <div class="resultado-folio-header">
              <span class="categoria-pill">${resultado.categoria}</span>
              <span class="estatus-pill ${badge}"><i class="fa-solid ${icono}"></i> ${resultado.estatus}</span>
            </div>
            <h3>Folio: ${resultado.folio}</h3>
            <h4>${resultado.tipo}</h4>
            <div class="resultado-detalles-grid">
              <div><strong>Ciudadano Solicitante:</strong> <span>${this.escaparHTML(resultado.solicitante)}</span></div>
              <div><strong>Fecha de Registro:</strong> <span>${resultado.fecha}</span></div>
              <div class="detalle-ancho-completo"><strong>Detalles:</strong> <span>${this.escaparHTML(resultado.detalle)}</span></div>
              <div class="detalle-ancho-completo observacion-admin-box">
                <strong><i class="fa-solid fa-clipboard-check"></i> Estatus / Seguimiento COPACI:</strong>
                <p>${this.escaparHTML(resultado.observaciones || 'En proceso de atención ordinaria.')}</p>
              </div>
            </div>
            <div class="resultado-acciones">
              ${resultado.categoria === 'Constancia Comunitaria' ? `
                <button class="boton boton-primario" onclick="CopaciApp.verComprobantePorFolio('${resultado.folio}')">
                  <i class="fa-solid fa-file-pdf"></i> Ver Comprobante Digital
                </button>
              ` : ''}
              <button class="boton boton-secundario-outline" onclick="CopaciApp.cerrarModales()">Cerrar Consulta</button>
            </div>
          </div>
        `;
      }

      this.abrirModal('modal-resultado-folio');
    },

    /**
     * Sistema de Notificaciones Accesible (Toast con aria-live)
     */
    mostrarNotificacion: function (mensaje, tipo = 'info') {
      let toast = document.getElementById('copaci-toast-notificacion');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'copaci-toast-notificacion';
        toast.className = 'toast-notificacion';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        document.body.appendChild(toast);
      }

      toast.className = `toast-notificacion toast-${tipo} visible`;
      toast.innerHTML = `<span>${mensaje}</span>`;

      if (window.CopaciAccesibilidad && window.CopaciAccesibilidad.anunciarLector) {
        window.CopaciAccesibilidad.anunciarLector(mensaje);
      }

      setTimeout(() => {
        toast.classList.remove('visible');
      }, 4500);
    },

    escaparHTML: function (str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };

  // Exponer al ámbito global
  window.CopaciApp = App;

  // Iniciar al cargar el DOM
  document.addEventListener('DOMContentLoaded', function () {
    window.CopaciApp.init();
  });
})(window);
