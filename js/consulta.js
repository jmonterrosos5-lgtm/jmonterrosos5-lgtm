// consulta.js - Valida formulario, verifica pago del mes actual y muestra historial
import { openDB, findInquilino, pagoAlDia, historialPagos } from './db.js';

document.addEventListener('DOMContentLoaded', async () => {
  const db = await openDB();

  const frm = document.getElementById('frmConsulta');
  const msg = document.getElementById('msg');

  frm.addEventListener('submit', (e) => {
    e.preventDefault();
    ocultar(msg);

    const dpi  = get('#dpi').value.trim();
    const casa = get('#casa').value.trim();
    const nombre = get('#nombre').value.trim();
    const apellido = get('#apellido').value.trim();
    const nac = get('#nac').value.trim();

    // Validaciones
    const errores = [];
    if (!/^\d{13}$/.test(dpi)) errores.push('El DPI debe tener 13 dígitos.');
    if (!/^\d+$/.test(casa)) errores.push('El número de casa debe ser numérico.');
    if (nombre.length < 2) errores.push('Primer Nombre inválido.');
    if (apellido.length < 2) errores.push('Primer Apellido inválido.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nac)) errores.push('Fecha de nacimiento inválida.');

    if (errores.length) {
      mostrar(msg, errores.join(' '), 'err');
      return;
    }

    const inq = findInquilino(db, { dpi, numeroCasa: casa, nombre, apellido, fechaNac: nac });
    if (!inq) {
      mostrar(msg, 'Datos no coinciden con ningún inquilino. Verifique la información.', 'err');
      return;
    }

    // Mes y año actual (zona local del navegador)
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth() + 1;

    const ok = pagoAlDia(db, { numeroCasa: casa, anio, mes });
    if (ok) {
      mostrar(msg, 'Cuota de mantenimiento al día.', 'ok'); // Texto solicitado
    } else {
      mostrar(msg, 'Cuota de mantenimiento pendiente.', 'warn'); // Texto solicitado
    }
  });

  // Historial
  const frmH = document.getElementById('frmHistorial');
  const tabla = document.getElementById('tablaHistorial');

  frmH.addEventListener('submit', (e) => {
    e.preventDefault();
    tabla.innerHTML = '';

    const desde = get('#desde').value;
    const hasta = get('#hasta').value;
    const casa  = get('#casa').value.trim();

    if (!/^\d+$/.test(casa)) {
      tabla.innerHTML = `<div class="list-item">Ingrese primero un número de casa válido arriba.</div>`;
      return;
    }
    if (!(isISO(desde) && isISO(hasta) && desde <= hasta)) {
      tabla.innerHTML = `<div class="list-item">Rango de fechas inválido.</div>`;
      return;
    }

    const rows = historialPagos(db, { numeroCasa: casa, desde, hasta });
    if (rows.length === 0) {
      tabla.innerHTML = `<div class="list-item">Sin pagos en el rango indicado.</div>`;
      return;
    }

    tabla.innerHTML = rows.map(r => `
      <div class="list-item">
        <div><strong>${mesNombre(r.Mes)} ${r.Año}</strong></div>
        <div style="font-size:12px; color:#9ca3af;">Fecha de pago: ${fmtFecha(r.FechaPago)}</div>
      </div>
    `).join('');
  });
});

function get(sel){ return document.querySelector(sel); }
function mostrar(el, texto, tipo){ el.textContent = texto; el.className = `msg ${tipo}`; el.hidden = false; }
function ocultar(el){ el.hidden = true; el.textContent = ''; }
function isISO(s){ return /^\d{4}-\d{2}-\d{2}$/.test(s); }
function fmtFecha(iso){ const d = new Date(iso + 'T00:00:00'); return d.toLocaleDateString('es-GT',{year:'numeric',month:'long',day:'numeric'}); }
function mesNombre(m){ return ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][Number(m)] || m; }
