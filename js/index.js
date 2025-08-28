// index.js - Carga y muestra las 3 noticias más recientes
import { openDB, getTopNoticias } from './db.js';

document.addEventListener('DOMContentLoaded', async () => {
  const lista = document.getElementById('lista-noticias');
  try {
    const db = await openDB();
    const noticias = getTopNoticias(db, 3);

    if (noticias.length === 0) {
      lista.innerHTML = `<div class="list-item">No hay noticias disponibles.</div>`;
      return;
    }

    lista.innerHTML = noticias.map(n => `
      <div class="list-item">
        <div style="font-size:12px; color:#9ca3af;">${fmtFecha(n.Fecha)}</div>
        <div>${escapeHTML(n.Noticia)}</div>
      </div>
    `).join('');
  } catch (e) {
    lista.innerHTML = `<div class="list-item">Error cargando noticias.</div>`;
    console.error(e);
  }
});

function fmtFecha(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
}
function escapeHTML(s) {
  return s?.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) ?? '';
}
