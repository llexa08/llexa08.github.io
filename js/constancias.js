/**
 * ============================================================================
 * COPACI Granjas Guadalupe - Módulo de Trámites Comunitarios (Constancias)
 * Archivo: js/constancias.js
 * ============================================================================
 * Gestiona la solicitud de constancias de residencia, almacenamiento
 * en localStorage, generación de folio con año dinámico y creación
 * del comprobante/vista previa digital con espacio para firma y sello.
 * ============================================================================
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'copaci_constancias';

  const ConstanciasStore = {
    getAll: function () {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        console.error('Error al leer constancias:', e);
        return [];
      }
    },

    saveAll: function (constancias) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(constancias));
      } catch (e) {
        console.error('Error al guardar constancias:', e);
      }
    }
  };

  const Constancias = {
    /**
     * Genera un folio único con el año en curso dinámicamente
     */
    generarFolio: function () {
      const anio = new Date().getFullYear();
      const random = String(Math.floor(1000 + Math.random() * 9000));
      return `CR-${anio}-${random}`;
    },

    /**
     * Registra una nueva solicitud de constancia
     */
    crearSolicitud: function (datos, usuarioActual) {
      if (!usuarioActual) {
        throw new Error('Debes iniciar sesión como vecino para solicitar una constancia.');
      }

      const { nombre, direccion, telefono, motivo, tiempoResidencia } = datos;

      if (!nombre || !nombre.trim()) throw new Error('El nombre del solicitante es obligatorio.');
      if (!direccion || !direccion.trim()) throw new Error('La dirección en Granjas Guadalupe es obligatoria.');
      if (!motivo || !motivo.trim()) throw new Error('Por favor especifica el motivo o trámite para el que requieres la constancia.');

      const constancias = ConstanciasStore.getAll();
      const folio = this.generarFolio();
      const ahora = new Date();

      const nuevaConstancia = {
        folio: folio,
        tipo: 'Constancia de Residencia',
        usuarioId: usuarioActual.id,
        ciudadanoNombre: nombre.trim(),
        ciudadanoCorreo: usuarioActual.correo,
        direccion: direccion.trim(),
        telefono: telefono ? telefono.trim() : 'No proporcionado',
        motivo: motivo.trim(),
        tiempoResidencia: tiempoResidencia ? tiempoResidencia.trim() : 'No especificado',
        fechaSolicitud: ahora.toISOString(),
        fechaFormateada: ahora.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        estatus: 'Pendiente', // Pendiente | En revisión | En proceso | Atendido | Rechazado
        observacionesAdmin: 'Solicitud recibida en espera de revisión de comprobante.'
      };

      constancias.unshift(nuevaConstancia);
      ConstanciasStore.saveAll(constancias);

      window.dispatchEvent(new CustomEvent('copaci_data_updated', { detail: { tipo: 'constancia', item: nuevaConstancia } }));
      return nuevaConstancia;
    },

    /**
     * Obtiene las constancias del usuario activo o todas si es admin
     */
    obtenerPorUsuario: function (usuarioId) {
      const todas = ConstanciasStore.getAll();
      if (!usuarioId) return todas;
      return todas.filter(c => c.usuarioId === usuarioId);
    },

    /**
     * Obtiene una constancia por su folio
     */
    obtenerPorFolio: function (folio) {
      const todas = ConstanciasStore.getAll();
      const normalized = folio.trim().toUpperCase();
      return todas.find(c => c.folio.toUpperCase() === normalized) || null;
    },

    /**
     * Actualiza el estatus de una constancia (Función exclusiva de Admin)
     */
    actualizarEstatus: function (folio, nuevoEstatus, observaciones) {
      const todas = ConstanciasStore.getAll();
      const index = todas.findIndex(c => c.folio === folio);
      if (index === -1) {
        throw new Error('Constancia no encontrada.');
      }

      todas[index].estatus = nuevoEstatus;
      if (observaciones !== undefined) {
        todas[index].observacionesAdmin = observaciones;
      }
      todas[index].fechaActualizacion = new Date().toISOString();

      ConstanciasStore.saveAll(todas);
      window.dispatchEvent(new CustomEvent('copaci_data_updated', { detail: { tipo: 'constancia', item: todas[index] } }));
      return todas[index];
    },

    /**
     * Genera la estructura HTML del Comprobante / Vista Previa Digital
     */
    generarComprobanteHTML: function (constancia) {
      const anioActual = new Date().getFullYear();

      // Clase de badge según estatus
      let badgeClase = 'badge-pendiente';
      let icono = 'fa-clock';
      if (constancia.estatus === 'Atendido') {
        badgeClase = 'badge-atendido';
        icono = 'fa-circle-check';
      } else if (constancia.estatus === 'En proceso' || constancia.estatus === 'En revisión') {
        badgeClase = 'badge-proceso';
        icono = 'fa-arrows-rotate';
      } else if (constancia.estatus === 'Rechazado') {
        badgeClase = 'badge-rechazado';
        icono = 'fa-circle-xmark';
      }

      return `
        <div class="comprobante-documento" id="comprobante-impresion">
          <!-- Membrete Oficial -->
          <div class="comprobante-cabecera">
            <div class="comprobante-logo-copaci">
              <img src="compas.jpeg" alt="Escudo COPACI Granjas Guadalupe" class="comprobante-logo-img">
            </div>
            <div class="comprobante-institucion">
              <h3>CONSEJO DE PARTICIPACIÓN CIUDADANA (COPACI)</h3>
              <p><strong>COLONIA GRANJAS GUADALUPE</strong></p>
              <p>Cuautitlán Izcalli, Estado de México | Periodo 2024-2027</p>
              <div class="comprobante-tipo-doc">VISTA PREVIA DIGITAL — CONSTANCIA DE RESIDENCIA</div>
            </div>
          </div>

          <!-- Alerta de Documento Demostrativo -->
          <div class="alerta-demostrativa" role="note">
            <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
            <span><strong>AVISO IMPORTANTE:</strong> Este documento es un <em>comprobante digital de solicitud</em> con fines de demostración académica escolar. <u>Requiere la validación física, firma autógrafa y sello oficial</u> por parte de la Mesa Directiva del COPACI para surtir efectos legales oficiales.</span>
          </div>

          <!-- Metadatos del Trámite -->
          <div class="comprobante-meta-grid">
            <div class="meta-caja">
              <span class="meta-etiqueta">Folio Único:</span>
              <span class="meta-valor folio-destacado">${constancia.folio}</span>
            </div>
            <div class="meta-caja">
              <span class="meta-etiqueta">Fecha de Expedición/Solicitud:</span>
              <span class="meta-valor">${constancia.fechaFormateada}</span>
            </div>
            <div class="meta-caja">
              <span class="meta-etiqueta">Estado del Trámite:</span>
              <span class="meta-valor estatus-indicador ${badgeClase}">
                <i class="fa-solid ${icono}" aria-hidden="true"></i> ${constancia.estatus}
              </span>
            </div>
            <div class="meta-caja">
              <span class="meta-etiqueta">Vigencia Estimada:</span>
              <span class="meta-valor">90 días naturales posteriores a validación</span>
            </div>
          </div>

          <!-- Cuerpo de la Certificación -->
          <div class="comprobante-cuerpo">
            <p>
              Por medio del presente documento, la Mesa Directiva del Consejo de Participación Ciudadana (COPACI) de Granjas Guadalupe hace constar que el (la) C.:
            </p>
            <div class="comprobante-nombre-ciudadano">
              <strong>${constancia.ciudadanoNombre.toUpperCase()}</strong>
            </div>
            <p>
              Ha manifestado y acreditado tener su residencia habitual y domicilio en:
            </p>
            <div class="comprobante-direccion-box">
              <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
              <span>${constancia.direccion}</span>
            </div>
            <p>
              Con un tiempo de radicación en la colonia señalado de: <strong>${constancia.tiempoResidencia}</strong>.
            </p>
            <p>
              Se expide el presente comprobante a solicitud expresa de la parte interesada para los fines legales, administrativos o académicos que correspondan al motivo: <em>"${constancia.motivo}"</em>.
            </p>
          </div>

          <!-- Espacio para Firmas y Sellos -->
          <div class="comprobante-firmas-grid">
            <div class="caja-firma">
              <div class="linea-firma"></div>
              <strong>C. Presidente / Mesa Directiva</strong>
              <span>COPACI Granjas Guadalupe</span>
              <small>Firma y Aprobación</small>
            </div>
            <div class="caja-sello">
              <div class="circulo-sello">
                <i class="fa-solid fa-stamp" aria-hidden="true"></i>
                <span>SELLO OFICIAL COPACI</span>
                <small>${anioActual}</small>
              </div>
            </div>
            <div class="caja-firma">
              <div class="linea-firma"></div>
              <strong>${constancia.ciudadanoNombre}</strong>
              <span>Firma del Ciudadano Solicitante</span>
              <small>Aceptación bajo protesta de decir verdad</small>
            </div>
          </div>

          <!-- Pie del Comprobante -->
          <div class="comprobante-pie">
            <p>Portal Ciudadano COPACI Granjas Guadalupe • Módulo de Trámites Comunitarios Digitales</p>
            <p class="cadena-digital">Sello Digital Demo: SHA256-${btoa(constancia.folio + constancia.ciudadanoCorreo).substring(0, 32)}</p>
          </div>
        </div>
      `;
    }
  };

  window.CopaciConstancias = Constancias;
})(window);
