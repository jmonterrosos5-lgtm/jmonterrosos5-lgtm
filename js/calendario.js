// calendario.js - Renderiza calendario por mes/año y muestra detalle del evento
import { openDB, getEventosPorMes } from './db.js';

const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

document.addEventListener('DOMContentLoaded', async () => {
  const selMes  = document.getElementById('selMes');
  const selAnio = document.getElementById('selAnio');
  const cal     = document.getElementById('calendar');

  // Llena selects
  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const anioActual = hoy.getFullYear();

  meses.forEach((m,i) => selMes.innerHTML += `<option value="${i+1}" ${i+1===mesActual?'selected':''}>${m}</option>`);
  for (let y = anioActual - 1; y <= anioActual + 1; y++) {
    selAnio.innerHTML += `<option value="${y}" ${y===anioActual?'selected':''}>${y}</option>`;
  }

  const db = await openDB();

  async function pintar() {
    const mes = Number(selMes.value);
    const anio = Number(selAnio.value);
    const eventos = getEventosPorMes(db, mes, anio);
    renderCalendar(cal, eventos, mes, anio);
  }

  selMes.addEventListener('change', pintar);
  selAnio.addEventListener('change', pintar);
  await pintar();
});

function renderCalendar(container, eventos, mes, anio) {
  container.innerHTML = '';
  const head = ['L','M','M','J','V','S','D'].map(d => `<div class="cal-head">${d}</div>`).join('');
  container.insertAdjacentHTML('beforeend', head);

  const primero = new Date(anio, mes - 1, 1);
  const inicioCol = (primero.getDay() + 6) % 7; // Lunes=0
  const diasMes = new Date(anio, mes, 0).getDate();

  // Índice de eventos por día
  const byDay = {};
  for (const ev of eventos) {
    const d = new Date(ev.Fecha + 'T00:00:00');
    const dia = d.getDate();
    (byDay[dia] ||= []).push(ev);
  }

  // Relleno en blanco
  for (let i=0; i<inicioCol; i++) container.insertAdjacentHTML('beforeend', `<div></div>`);

  // Días
  for (let dia=1; dia<=diasMes; dia++) {
    const evs = byDay[dia] || [];
    const items = evs.map(ev => `<div class="event" data-t="${escapeHTML(ev.Titulo)}" data-d="${escapeHTML(ev.Descripcion)}">${escapeHTML(ev.Titulo)}</div>`).join('');
    container.insertAdjacentHTML('beforeend', `
      <div class="cell">
        <div class="num">${dia}</div>
        <div>${items || '<span style="color:#9ca3af; font-size:12px;">—</span>'}</div>
      </div>
    `);
  }

  // Click en evento → muestra detalle
  container.querySelectorAll('.event').forEach(el => {
    el.addEventListener('click', () => {
      const t = document.getElementById('detalle-titulo');
      const d = document.getElementById('detalle-desc');
      const s = document.getElementById('detalle');
      t.textContent = el.dataset.t;
      d.textContent = el.dataset.d;
      s.hidden = false;
      s.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function escapeHTML(s) { return s?.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) ?? ''; }
