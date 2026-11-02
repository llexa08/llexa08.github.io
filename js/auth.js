/**
 * ============================================================================
 * COPACI Granjas Guadalupe - Módulo de Autenticación y Control de Accesos
 * Archivo: js/auth.js
 * ============================================================================
 * Implementación de autenticación segura del lado del cliente utilizando
 * la Web Crypto API nativa:
 * - PBKDF2 con SHA-256 y 100,000 iteraciones
 * - Salt criptográfico individual de 16 bytes por usuario
 * - NUNCA almacena contraseñas en texto plano
 * - Manejo de roles estricto: 'admin' (Mesa directiva) y 'vecino' (Ciudadano)
 * - Persistencia de usuarios y sesión activa en localStorage
 * ============================================================================
 */

(function (window) {
  'use strict';

  const STORAGE_USERS_KEY = 'copaci_usuarios';
  const STORAGE_SESSION_KEY = 'copaci_sesion_activa';
  const PBKDF2_ITERATIONS = 100000;

  /**
   * Utilidades criptográficas (Web Crypto API)
   */
  const CryptoUtils = {
    // Genera un salt criptográfico aleatorio en formato hexadecimal
    generateSalt: function () {
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      return Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    },

    // Convierte un string hexadecimal a Uint8Array
    hexToBytes: function (hex) {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
      }
      return bytes;
    },

    // Convierte un ArrayBuffer a string hexadecimal
    bufferToHex: function (buffer) {
      const bytes = new Uint8Array(buffer);
      return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    },

    // Deriva el hash de la contraseña usando PBKDF2 con SHA-256
    hashPassword: async function (password, saltHex) {
      const encoder = new TextEncoder();
      const passwordBytes = encoder.encode(password);
      const saltBytes = this.hexToBytes(saltHex);

      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        passwordBytes,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      const derivedBits = await window.crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: PBKDF2_ITERATIONS,
          hash: 'SHA-256'
        },
        keyMaterial,
        256 // 256 bits = 32 bytes
      );

      return this.bufferToHex(derivedBits);
    }
  };

  /**
   * Gestor del almacén de usuarios (localStorage)
   */
  const UserStore = {
    getUsers: function () {
      try {
        const data = localStorage.getItem(STORAGE_USERS_KEY);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        console.error('Error al leer usuarios de localStorage:', e);
        return [];
      }
    },

    saveUsers: function (users) {
      try {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
      } catch (e) {
        console.error('Error al guardar usuarios en localStorage:', e);
      }
    },

    findByEmail: function (email) {
      const users = this.getUsers();
      const normalizedEmail = email.trim().toLowerCase();
      return users.find(u => u.correo.toLowerCase() === normalizedEmail) || null;
    },

    addUser: function (user) {
      const users = this.getUsers();
      users.push(user);
      this.saveUsers(users);
    }
  };

  /**
   * Objeto principal de Autenticación
   */
  const Auth = {
    /**
     * Inicializa las cuentas de demostración requeridas si aún no existen
     */
    init: async function () {
      const users = UserStore.getUsers();

      // Verificar si existe el administrador
      const adminExists = users.some(u => u.correo.toLowerCase() === 'admin@copaci.com');
      if (!adminExists) {
        const saltAdmin = CryptoUtils.generateSalt();
        const hashAdmin = await CryptoUtils.hashPassword('AdminCopaci2024!', saltAdmin);
        users.push({
          id: 'usr_admin_' + Date.now(),
          nombre: 'Mesa Directiva COPACI',
          direccion: 'Oficinas COPACI, Granjas Guadalupe',
          correo: 'admin@copaci.com',
          rol: 'admin',
          salt: saltAdmin,
          passwordHash: hashAdmin,
          fechaRegistro: new Date().toISOString()
        });
      }

      // Verificar si existe el vecino de prueba
      const vecinoExists = users.some(u => u.correo.toLowerCase() === 'vecino@copaci.com');
      if (!vecinoExists) {
        const saltVecino = CryptoUtils.generateSalt();
        const hashVecino = await CryptoUtils.hashPassword('Vecino2024!', saltVecino);
        users.push({
          id: 'usr_vecino_' + (Date.now() + 1),
          nombre: 'María Dolores Rosales',
          direccion: 'Av. Las Granjas Mz. 14 Lote 8, Granjas Guadalupe',
          correo: 'vecino@copaci.com',
          rol: 'vecino',
          salt: saltVecino,
          passwordHash: hashVecino,
          fechaRegistro: new Date().toISOString()
        });
      }

      UserStore.saveUsers(users);
    },

    /**
     * Registro de un nuevo vecino
     * @param {Object} datos - { nombre, direccion, correo, password }
     */
    registerVecino: async function (datos) {
      const { nombre, direccion, correo, password } = datos;

      // Validaciones estrictas
      if (!nombre || !nombre.trim()) {
        throw new Error('Por favor escribe tu nombre completo.');
      }
      if (!direccion || !direccion.trim()) {
        throw new Error('Por favor proporciona tu dirección o calle en Granjas Guadalupe.');
      }
      if (!correo || !correo.trim()) {
        throw new Error('Por favor proporciona tu correo electrónico.');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo.trim())) {
        throw new Error('El formato del correo electrónico no es válido.');
      }

      if (UserStore.findByEmail(correo)) {
        throw new Error('Ya existe una cuenta registrada con este correo electrónico.');
      }

      if (!password || password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres.');
      }

      // Generar salt individual y hash PBKDF2
      const salt = CryptoUtils.generateSalt();
      const passwordHash = await CryptoUtils.hashPassword(password, salt);

      const nuevoVecino = {
        id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        correo: correo.trim().toLowerCase(),
        rol: 'vecino', // Forzado siempre a rol vecino
        salt: salt,
        passwordHash: passwordHash,
        fechaRegistro: new Date().toISOString()
      };

      UserStore.addUser(nuevoVecino);

      // Iniciar sesión automáticamente tras el registro
      this.setSession(nuevoVecino);
      return nuevoVecino;
    },

    /**
     * Inicio de sesión
     */
    login: async function (correo, password) {
      if (!correo || !correo.trim() || !password) {
        throw new Error('Por favor ingresa tu correo y contraseña.');
      }

      const user = UserStore.findByEmail(correo);
      if (!user) {
        throw new Error('Correo o contraseña incorrectos. Verifica tus datos.');
      }

      const inputHash = await CryptoUtils.hashPassword(password, user.salt);
      if (inputHash !== user.passwordHash) {
        throw new Error('Correo o contraseña incorrectos. Verifica tus datos.');
      }

      this.setSession(user);
      return user;
    },

    /**
     * Guarda la sesión activa en localStorage (sin hash ni salt)
     */
    setSession: function (user) {
      const sessionData = {
        id: user.id,
        nombre: user.nombre,
        direccion: user.direccion,
        correo: user.correo,
        rol: user.rol,
        fechaIngreso: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sessionData));
      window.dispatchEvent(new CustomEvent('copaci_auth_changed', { detail: sessionData }));
    },

    /**
     * Obtiene la sesión activa
     */
    getSession: function () {
      try {
        const data = localStorage.getItem(STORAGE_SESSION_KEY);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        return null;
      }
    },

    /**
     * Cierra la sesión activa
     */
    logout: function () {
      localStorage.removeItem(STORAGE_SESSION_KEY);
      window.dispatchEvent(new CustomEvent('copaci_auth_changed', { detail: null }));
    },

    /**
     * Verifica si el usuario actual es administrador
     */
    isAdmin: function () {
      const session = this.getSession();
      return session && session.rol === 'admin';
    },

    /**
     * Verifica si el usuario actual es vecino
     */
    isVecino: function () {
      const session = this.getSession();
      return session && session.rol === 'vecino';
    },

    /**
     * Obtiene el listado de todos los usuarios registrados (solo admin)
     */
    getAllUsers: function () {
      if (!this.isAdmin()) {
        throw new Error('Acceso no autorizado.');
      }
      return UserStore.getUsers().map(u => ({
        id: u.id,
        nombre: u.nombre,
        direccion: u.direccion,
        correo: u.correo,
        rol: u.rol,
        fechaRegistro: u.fechaRegistro
      }));
    }
  };

  // Exponer al ámbito global
  window.CopaciAuth = Auth;
})(window);
