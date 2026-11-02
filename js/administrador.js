/**
 * ============================================================================
 * COPACI Granjas Guadalupe - Módulo del Panel Administrativo
 * Archivo: js/administrador.js
 * ============================================================================
 * Panel de gestión exclusivo para la Mesa Directiva del COPACI.
 * Permite:
 * 1. Consultar el padrón de usuarios registrados.
 * 2. Visualizar y gestionar solicitudes de constancias comunitarias.
 * 3. Visualizar y gestionar reportes de luminarias.
 * 4. Visualizar y gestionar reportes de bacheo.
 * 5. Cambiar los estatus en tiempo real con persistencia en localStorage.
 * ============================================================================
 */

(function (window) {
  'use strict';

  const AdminPanel = {
    /**
     * Renderiza todo el contenido del panel administrativo dentro de su contenedor
     */
    renderPanel: function (containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      if (!window.CopaciAuth || !window.CopaciAuth.isAdmin()) {
        container.innerHTML = `
          <div class="alerta-no-acceso" role="alert">
            <i class="fa-solid fa-lock" aria-hidden="true"></i>
            <h3>Acceso Restringido</h3>
            <p>Este panel es exclusivo para los miembros de la Mesa Directiva del COPACI Granjas Guadalupe.</p>
            <button class="boton boton-primario" onclick="CopaciApp.abrirModalLogin()">
              <i class="fa-solid fa-right-to-bracket" aria-hidden="true"></i> Iniciar Sesión como Administrador
            </button>
          </div>
        `;
        return;
      }

      // Obtener datos
      const usuarios = window.CopaciAuth.getAllUsers();
      const constancias = window.CopaciConstancias.obtenerPorUsuario(null);
      const luminarias = window.CopaciReportes.obtenerLuminariasPorUsuario(null);
      const bacheo = window.CopaciReportes.obtenerBacheoPorUsuario(null);

      // Métricas rápidas
      const totalUsuarios = usuarios.length;
      const constanciasPendientes = constancias.filter(c => c.estatus === 'Pendiente' || c.estatus === 'En revisión').length;
      const luminariasPendientes = luminarias.filter(l => l.estatus === 'Pendiente' || l.estatus === 'En proceso').length;
      const bacheoPendiente = bacheo.filter(b => b.estatus === 'Pendiente' || b.estatus === 'En proceso').length;

      container.innerHTML = `
        <div class="admin-dashboard">
          <!-- Encabezado del Dashboard -->
          <div class="admin-header-flex">
            <div>
              <h2><i class="fa-solid fa-gauge-high" aria-hidden="true"></i> Panel de Control de la Mesa Directiva</h2>
              <p>Gestión integral de trámites comunitarios, reportes de infraestructura y padrón vecinal.</p>
            </div>
            <div class="admin-badge-rol">
              <i class="fa-solid fa-user-shield" aria-hidden="true"></i> Rol: Administrador General
            </div>
          </div>

          <!-- Tarjetas de Resumen / Métricas -->
          <div class="grid-metricas-admin">
            <div class="tarjeta-metrica">
              <div class="metrica-icono icono-azul"><i class="fa-solid fa-users" aria-hidden="true"></i></div>
              <div class="metrica-info">
                <span class="metrica-valor">${totalUsuarios}</span>
                <span class="metrica-etiqueta">Vecinos Registrados</span>
              </div>
            </div>

            <div class="tarjeta-metrica">
              <div class="metrica-icono icono-verde"><i class="fa-solid fa-file-signature" aria-hidden="true"></i></div>
              <div class="metrica-info">
                <span class="metrica-valor">${constancias.length} <small>(${constanciasPendientes} por atender)</small></span>
                <span class="metrica-etiqueta">Constancias de Residencia</span>
              </div>
            </div>

            <div class="tarjeta-metrica">
              <div class="metrica-icono icono-amarillo"><i class="fa-solid fa-lightbulb" aria-hidden="true"></i></div>
              <div class="metrica-info">
                <span class="metrica-valor">${luminarias.length} <small>(${luminariasPendientes} pendientes)</small></span>
                <span class="metrica-etiqueta">Reportes de Luminarias</span>
              </div>
            </div>

            <div class="tarjeta-metrica">
              <div class="metrica-icono icono-naranja"><i class="fa-solid fa-road" aria-hidden="true"></i></div>
              <div class="metrica-info">
                <span class="metrica-valor">${bacheo.length} <small>(${bacheoPendiente} pendientes)</small></span>
                <span class="metrica-etiqueta">Reportes de Bacheo</span>
              </div>
            </div>
          </div>

          <!-- Pestañas del Administrador -->
          <div class="admin-pestanas" role="tablist" aria-label="Secciones del panel administrativo">
            <button class="admin-tab-btn activa" role="tab" aria-selected="true" data-seccion="admin-constancias">
              <i class="fa-solid fa-file-lines" aria-hidden="true"></i> Solicitudes de Constancias (${constancias.length})
            </button>
            <button class="admin-tab-btn" role="tab" aria-selected="false" data-seccion="admin-luminarias">
              <i class="fa-solid fa-lightbulb" aria-hidden="true"></i> Reportes de Luminarias (${luminarias.length})
            </button>
            <button class="admin-tab-btn" role="tab" aria-selected="false" data-seccion="admin-bacheo">
              <i class="fa-solid fa-road" aria-hidden="true"></i> Reportes de Bacheo (${bacheo.length})
            </button>
            <button class="admin-tab-btn" role="tab" aria-selected="false" data-seccion="admin-usuarios">
              <i class="fa-solid fa-users-gear" aria-hidden="true"></i> Padrón de Usuarios (${usuarios.length})
            </button>
          </div>

          <!-- Contenido de Pestaña: Constancias -->
          <div id="admin-constancias" class="admin-tab-contenido visible">
            <h3><i class="fa-solid fa-file-signature" aria-hidden="true"></i> Solicitudes de Constancias de Residencia</h3>
            <p class="admin-subtitulo">Revisa los datos de los vecinos, actualiza el estado del trámite y emite el comprobante digital.</p>
            ${this.renderTablaConstancias(constancias)}
          </div>

          <!-- Contenido de Pestaña: Luminarias -->
          <div id="admin-luminarias" class="admin-tab-contenido">
            <h3><i class="fa-solid fa-lightbulb" aria-hidden="true"></i> Reportes de Fallas en Luminarias</h3>
            <p class="admin-subtitulo">Supervisa y actualiza el avance de reparación del alumbrado público reportado por los ciudadanos.</p>
            ${this.renderTablaLuminarias(luminarias)}
          </div>

          <!-- Contenido de Pestaña: Bacheo -->
          <div id="admin-bacheo" class="admin-tab-contenido">
            <h3><i class="fa-solid fa-road" aria-hidden="true"></i> Reportes de Bacheo y Pavimentación</h3>
            <p class="admin-subtitulo">Control de baches según su nivel de gravedad y seguimiento de obras de bacheo.</p>
            ${this.renderTablaBacheo(bacheo)}
          </div>

          <!-- Contenido de Pestaña: Usuarios -->
          <div id="admin-usuarios" class="admin-tab-contenido">
            <h3><i class="fa-solid fa-users" aria-hidden="true"></i> Padrón Ciudadano Registrado</h3>
            <p class="admin-subtitulo">Vecinos dados de alta en el sistema para realizar trámites y reportes.</p>
            ${this.renderTablaUsuarios(usuarios)}
          </div>
        </div>
      `;

      this.asignarEventosPanel(container);
    },

    /**
     * Genera la tabla de Constancias
     */
    renderTablaConstancias: function (constancias) {
      if (constancias.length === 0) {
        return `<div class="tabla-vacia"><i class="fa-solid fa-inbox"></i> No hay solicitudes de constancias registradas aún.</div>`;
      }

      return `
        <div class="tabla-responsiva-contenedor">
          <table class="tabla-admin">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Ciudadano</th>
                <th>Dirección</th>
                <th>Motivo</th>
                <th>Estado Actual</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${constancias.map(c => `
                <tr>
                  <td><strong>${c.folio}</strong></td>
                  <td>${c.fechaFormateada || c.fechaSolicitud.split('T')[0]}</td>
                  <td>
                    <strong>${c.ciudadanoNombre}</strong><br>
                    <small class="texto-atenuado">${c.ciudadanoCorreo}</small>
                  </td>
                  <td>${c.direccion}</td>
                  <td><span class="etiqueta-motivo">${c.motivo}</span></td>
                  <td>
                    <select class="selector-estatus" data-folio="${c.folio}" data-tipo="constancia" aria-label="Cambiar estado de ${c.folio}">
                      ${this.renderOpcionesEstatus(c.estatus)}
                    </select>
                  </td>
                  <td>
                    <button class="boton-accion-admin btn-ver-comprobante" data-folio="${c.folio}" title="Ver vista previa digital">
                      <i class="fa-solid fa-file-pdf" aria-hidden="true"></i> Comprobante
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    },

    /**
     * Genera la tabla de Luminarias
     */
    renderTablaLuminarias: function (luminarias) {
      if (luminarias.length === 0) {
        return `<div class="tabla-vacia"><i class="fa-solid fa-inbox"></i> No hay reportes de luminarias registrados aún.</div>`;
      }

      return `
        <div class="tabla-responsiva-contenedor">
          <table class="tabla-admin">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Fecha Reporte</th>
                <th>Ciudadano</th>
                <th>Ubicación / Calle</th>
                <th>Entre Calles</th>
                <th>Descripción de la Falla</th>
                <th>Estado Actual</th>
              </tr>
            </thead>
            <tbody>
              ${luminarias.map(l => `
                <tr>
                  <td><strong>${l.folio}</strong></td>
                  <td>${l.fechaReporte}</td>
                  <td>
                    <strong>${l.ciudadanoNombre}</strong><br>
                    <small class="texto-atenuado">${l.ciudadanoCorreo}</small>
                  </td>
                  <td><strong>${l.calle}</strong></td>
                  <td>${l.entreCalles}</td>
                  <td><p class="tabla-descripcion-corta">${l.descripcion}</p></td>
                  <td>
                    <select class="selector-estatus" data-folio="${l.folio}" data-tipo="luminaria" aria-label="Cambiar estado de ${l.folio}">
                      ${this.renderOpcionesEstatus(l.estatus)}
                    </select>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    },

    /**
     * Genera la tabla de Bacheo
     */
    renderTablaBacheo: function (bacheo) {
      if (bacheo.length === 0) {
        return `<div class="tabla-vacia"><i class="fa-solid fa-inbox"></i> No hay reportes de bacheo registrados aún.</div>`;
      }

      return `
        <div class="tabla-responsiva-contenedor">
          <table class="tabla-admin">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Ciudadano</th>
                <th>Ubicación</th>
                <th>Gravedad</th>
                <th>Descripción</th>
                <th>Estado Actual</th>
              </tr>
            </thead>
            <tbody>
              ${bacheo.map(b => {
                let claseGravedad = 'gravedad-baja';
                if (b.gravedad === 'Medio') claseGravedad = 'gravedad-media';
                if (b.gravedad === 'Alto') claseGravedad = 'gravedad-alta';

                return `
                  <tr>
                    <td><strong>${b.folio}</strong></td>
                    <td>${b.fechaFormateada || b.fechaRegistro.split('T')[0]}</td>
                    <td>
                      <strong>${b.ciudadanoNombre}</strong><br>
                      <small class="texto-atenuado">${b.ciudadanoCorreo}</small>
                    </td>
                    <td><strong>${b.ubicacion}</strong></td>
                    <td>
                      <span class="badge-gravedad ${claseGravedad}">
                        <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> ${b.gravedad}
                      </span>
                    </td>
                    <td><p class="tabla-descripcion-corta">${b.descripcion}</p></td>
                    <td>
                      <select class="selector-estatus" data-folio="${b.folio}" data-tipo="bacheo" aria-label="Cambiar estado de ${b.folio}">
                        ${this.renderOpcionesEstatus(b.estatus)}
                      </select>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    },

    /**
     * Genera la tabla de Usuarios
     */
    renderTablaUsuarios: function (usuarios) {
      return `
        <div class="tabla-responsiva-contenedor">
          <table class="tabla-admin">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo Electrónico</th>
                <th>Dirección</th>
                <th>Rol</th>
                <th>Fecha de Registro</th>
              </tr>
            </thead>
            <tbody>
              ${usuarios.map(u => `
                <tr>
                  <td><strong>${u.nombre}</strong></td>
                  <td>${u.correo}</td>
                  <td>${u.direccion}</td>
                  <td>
                    <span class="badge-rol ${u.rol === 'admin' ? 'rol-admin' : 'rol-vecino'}">
                      <i class="fa-solid ${u.rol === 'admin' ? 'fa-shield-halved' : 'fa-user'}" aria-hidden="true"></i>
                      ${u.rol === 'admin' ? 'Mesa Directiva' : 'Vecino'}
                    </span>
                  </td>
                  <td>${new Date(u.fechaRegistro).toLocaleDateString('es-MX')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    },

    /**
     * Opciones para selector de estatus
     */
    renderOpcionesEstatus: function (estatusActual) {
      const estados = ['Pendiente', 'En revisión', 'En proceso', 'Atendido', 'Rechazado'];
      return estados.map(e => `
        <option value="${e}" ${e === estatusActual ? 'selected' : ''}>${e}</option>
      `).join('');
    },

    /**
     * Asigna eventos interactivos al panel
     */
    asignarEventosPanel: function (container) {
      // Manejo de pestañas
      const tabButtons = container.querySelectorAll('.admin-tab-btn');
      const tabContents = container.querySelectorAll('.admin-tab-contenido');

      tabButtons.forEach(btn => {
        btn.addEventListener('click', function () {
          tabButtons.forEach(b => {
            b.classList.remove('activa');
            b.setAttribute('aria-selected', 'false');
          });
          tabContents.forEach(c => c.classList.remove('visible'));

          this.classList.add('activa');
          this.setAttribute('aria-selected', 'true');
          const seccionId = this.getAttribute('data-seccion');
          const target = document.getElementById(seccionId);
          if (target) target.classList.add('visible');
        });
      });

      // Manejo de cambio de estatus en selects
      const selectores = container.querySelectorAll('.selector-estatus');
      selectores.forEach(sel => {
        sel.addEventListener('change', function () {
          const folio = this.getAttribute('data-folio');
          const tipo = this.getAttribute('data-tipo');
          const nuevoEstatus = this.value;

          try {
            if (tipo === 'constancia') {
              window.CopaciConstancias.actualizarEstatus(folio, nuevoEstatus);
            } else if (tipo === 'luminaria') {
              window.CopaciReportes.actualizarEstatusLuminaria(folio, nuevoEstatus);
            } else if (tipo === 'bacheo') {
              window.CopaciReportes.actualizarEstatusBacheo(folio, nuevoEstatus);
            }

            // Notificación accesible
            window.CopaciApp.mostrarNotificacion(`✅ Estado de ${folio} actualizado a: "${nuevoEstatus}"`, 'exito');
          } catch (err) {
            window.CopaciApp.mostrarNotificacion(`❌ Error al actualizar: ${err.message}`, 'error');
          }
        });
      });

      // Botón para ver comprobante desde la tabla
      const btnComprobantes = container.querySelectorAll('.btn-ver-comprobante');
      btnComprobantes.forEach(btn => {
        btn.addEventListener('click', function () {
          const folio = this.getAttribute('data-folio');
          const constancia = window.CopaciConstancias.obtenerPorFolio(folio);
          if (constancia) {
            window.CopaciApp.mostrarModalComprobante(constancia);
          }
        });
      });
    }
  };

  window.CopaciAdmin = AdminPanel;
})(window);
