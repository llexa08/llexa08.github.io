/**
 * ============================================================================
 * COPACI Granjas Guadalupe - Módulo de Reportes Urbanos (Luminarias y Bacheo)
 * Archivo: js/reportes.js
 * ============================================================================
 * Maneja los formularios e historiales independientes para:
 * 1. Reportes de Luminarias (alumbrado público)
 * 2. Reportes de Bacheo y Pavimentación
 * 3. Buscador universal de folios en tiempo real
 * ============================================================================
 */

(function (window) {
  'use strict';

  const STORAGE_LUMINARIAS = 'copaci_reportes_luminarias';
  const STORAGE_BACHEO = 'copaci_reportes_bacheo';

  const ReportesStore = {
    getLuminarias: function () {
      try {
        const data = localStorage.getItem(STORAGE_LUMINARIAS);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        return [];
      }
    },
    saveLuminarias: function (list) {
      try {
        localStorage.setItem(STORAGE_LUMINARIAS, JSON.stringify(list));
      } catch (e) {}
    },
    getBacheo: function () {
      try {
        const data = localStorage.getItem(STORAGE_BACHEO);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        return [];
      }
    },
    saveBacheo: function (list) {
      try {
        localStorage.setItem(STORAGE_BACHEO, JSON.stringify(list));
      } catch (e) {}
    }
  };

  const Reportes = {
    /**
     * Genera un folio dinámico con el año actual
     */
    generarFolioLuminaria: function () {
      const anio = new Date().getFullYear();
      const num = String(Math.floor(1000 + Math.random() * 9000));
      return `LUM-${anio}-${num}`;
    },

    generarFolioBacheo: function () {
      const anio = new Date().getFullYear();
      const num = String(Math.floor(1000 + Math.random() * 9000));
      return `BAC-${anio}-${num}`;
    },

    /**
     * ========================================================================
     * REPORTES DE LUMINARIAS
     * ========================================================================
     */
    crearReporteLuminaria: function (datos, usuarioActual) {
      if (!usuarioActual) {
        throw new Error('Debes iniciar sesión como vecino para registrar un reporte.');
      }

      const { calle, entreCalles, descripcion, fechaReporte } = datos;

      if (!calle || !calle.trim()) throw new Error('Por favor indica la calle o ubicación de la luminaria.');
      if (!entreCalles || !entreCalles.trim()) throw new Error('Por favor indica entre qué calles se ubica la luminaria.');
      if (!descripcion || !descripcion.trim()) throw new Error('Por favor describe la falla observada (apagada, parpadea, poste dañado, etc.).');

      const luminarias = ReportesStore.getLuminarias();
      const folio = this.generarFolioLuminaria();
      const ahora = new Date();

      const nuevoReporte = {
        folio: folio,
        tipo: 'Reporte de Luminaria',
        usuarioId: usuarioActual.id,
        ciudadanoNombre: usuarioActual.nombre,
        ciudadanoCorreo: usuarioActual.correo,
        calle: calle.trim(),
        entreCalles: entreCalles.trim(),
        descripcion: descripcion.trim(),
        fechaReporte: fechaReporte || ahora.toISOString().split('T')[0],
        fechaRegistro: ahora.toISOString(),
        estatus: 'Pendiente', // Pendiente | En revisión | En proceso | Atendido | Rechazado
        observacionesAdmin: 'Reporte canalizado a la cuadrilla de alumbrado público.'
      };

      luminarias.unshift(nuevoReporte);
      ReportesStore.saveLuminarias(luminarias);

      window.dispatchEvent(new CustomEvent('copaci_data_updated', { detail: { tipo: 'luminaria', item: nuevoReporte } }));
      return nuevoReporte;
    },

    obtenerLuminariasPorUsuario: function (usuarioId) {
      const todas = ReportesStore.getLuminarias();
      if (!usuarioId) return todas;
      return todas.filter(r => r.usuarioId === usuarioId);
    },

    actualizarEstatusLuminaria: function (folio, nuevoEstatus, observaciones) {
      const todas = ReportesStore.getLuminarias();
      const index = todas.findIndex(r => r.folio === folio);
      if (index === -1) throw new Error('Reporte de luminaria no encontrado.');

      todas[index].estatus = nuevoEstatus;
      if (observaciones !== undefined) todas[index].observacionesAdmin = observaciones;
      todas[index].fechaActualizacion = new Date().toISOString();

      ReportesStore.saveLuminarias(todas);
      window.dispatchEvent(new CustomEvent('copaci_data_updated', { detail: { tipo: 'luminaria', item: todas[index] } }));
      return todas[index];
    },

    /**
     * ========================================================================
     * REPORTES DE BACHEO
     * ========================================================================
     */
    crearReporteBacheo: function (datos, usuarioActual) {
      if (!usuarioActual) {
        throw new Error('Debes iniciar sesión como vecino para registrar un reporte.');
      }

      const { ubicacion, gravedad, descripcion } = datos;

      if (!ubicacion || !ubicacion.trim()) throw new Error('Por favor indica la calle o dirección exacta del bache.');
      if (!gravedad || !['Bajo', 'Medio', 'Alto'].includes(gravedad)) {
        throw new Error('Selecciona un nivel de gravedad válido (Bajo, Medio o Alto).');
      }
      if (!descripcion || !descripcion.trim()) throw new Error('Por favor describe la afectación del bache o daño en la vialidad.');

      const baches = ReportesStore.getBacheo();
      const folio = this.generarFolioBacheo();
      const ahora = new Date();

      const nuevoReporte = {
        folio: folio,
        tipo: 'Reporte de Bacheo',
        usuarioId: usuarioActual.id,
        ciudadanoNombre: usuarioActual.nombre,
        ciudadanoCorreo: usuarioActual.correo,
        ubicacion: ubicacion.trim(),
        gravedad: gravedad,
        descripcion: descripcion.trim(),
        fechaRegistro: ahora.toISOString(),
        fechaFormateada: ahora.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        estatus: 'Pendiente', // Pendiente | En revisión | En proceso | Atendido | Rechazado
        observacionesAdmin: 'Reporte en programación para bacheo y reencarpetamiento.'
      };

      baches.unshift(nuevoReporte);
      ReportesStore.saveBacheo(baches);

      window.dispatchEvent(new CustomEvent('copaci_data_updated', { detail: { tipo: 'bacheo', item: nuevoReporte } }));
      return nuevoReporte;
    },

    obtenerBacheoPorUsuario: function (usuarioId) {
      const todas = ReportesStore.getBacheo();
      if (!usuarioId) return todas;
      return todas.filter(r => r.usuarioId === usuarioId);
    },

    actualizarEstatusBacheo: function (folio, nuevoEstatus, observaciones) {
      const todas = ReportesStore.getBacheo();
      const index = todas.findIndex(r => r.folio === folio);
      if (index === -1) throw new Error('Reporte de bacheo no encontrado.');

      todas[index].estatus = nuevoEstatus;
      if (observaciones !== undefined) todas[index].observacionesAdmin = observaciones;
      todas[index].fechaActualizacion = new Date().toISOString();

      ReportesStore.saveBacheo(todas);
      window.dispatchEvent(new CustomEvent('copaci_data_updated', { detail: { tipo: 'bacheo', item: todas[index] } }));
      return todas[index];
    },

    /**
     * ========================================================================
     * BÚSQUEDA UNIVERSAL DE FOLIO
     * ========================================================================
     */
    buscarPorFolio: function (folio) {
      if (!folio || !folio.trim()) return null;
      const cleanFolio = folio.trim().toUpperCase();

      // 1. Buscar en Constancias
      if (window.CopaciConstancias) {
        const constancia = window.CopaciConstancias.obtenerPorFolio(cleanFolio);
        if (constancia) {
          return {
            categoria: 'Constancia Comunitaria',
            tipo: constancia.tipo,
            folio: constancia.folio,
            solicitante: constancia.ciudadanoNombre,
            detalle: `Motivo: ${constancia.motivo} | Domicilio: ${constancia.direccion}`,
            fecha: constancia.fechaFormateada,
            estatus: constancia.estatus,
            observaciones: constancia.observacionesAdmin,
            objetoOriginal: constancia
          };
        }
      }

      // 2. Buscar en Luminarias
      const lum = ReportesStore.getLuminarias().find(l => l.folio.toUpperCase() === cleanFolio);
      if (lum) {
        return {
          categoria: 'Servicios Públicos',
          tipo: 'Reporte de Luminaria',
          folio: lum.folio,
          solicitante: lum.ciudadanoNombre,
          detalle: `Ubicación: ${lum.calle} (Entre: ${lum.entreCalles}) — Falla: ${lum.descripcion}`,
          fecha: lum.fechaReporte,
          estatus: lum.estatus,
          observaciones: lum.observacionesAdmin,
          objetoOriginal: lum
        };
      }

      // 3. Buscar en Bacheo
      const bac = ReportesStore.getBacheo().find(b => b.folio.toUpperCase() === cleanFolio);
      if (bac) {
        return {
          categoria: 'Infraestructura Vial',
          tipo: 'Reporte de Bacheo',
          folio: bac.folio,
          solicitante: bac.ciudadanoNombre,
          detalle: `Ubicación: ${bac.ubicacion} — Gravedad: ${bac.gravedad} — Falla: ${bac.descripcion}`,
          fecha: bac.fechaFormateada || bac.fechaRegistro.split('T')[0],
          estatus: bac.estatus,
          observaciones: bac.observacionesAdmin,
          objetoOriginal: bac
        };
      }

      return null;
    }
  };

  window.CopaciReportes = Reportes;
})(window);
