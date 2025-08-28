// db.js
// Inicializa sql.js y abre la base (desde /data/residencial.db).
// Si no existe el archivo .db, crea una BD en memoria con datos de ejemplo.

export async function openDB() {
  // Carga el motor
  const SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}`
  });

  // Intenta descargar la base real
  let db;
  try {
    const res = await fetch('data/residencial.db', { cache: 'no-store' });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      db = new SQL.Database(new Uint8Array(buf));
    } else {
      db = new SQL.Database();
      db.exec(sampleSQL); // fallback
    }
  } catch {
    db = new SQL.Database();
    db.exec(sampleSQL); // fallback
  }
  return db;
}

// ======= Consultas =======

// Noticias: top N más recientes
export function getTopNoticias(db, limite = 3) {
  const stmt = db.prepare(`
    SELECT Fecha, Noticia
    FROM Noticias
    ORDER BY date(Fecha) DESC
    LIMIT ?;
  `);
  stmt.bind([limite]);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

// Eventos por mes/año (mes 1-12)
export function getEventosPorMes(db, mes, anio) {
  const mesStr = String(mes).padStart(2, '0');
  const anioStr = String(anio);
  const stmt = db.prepare(`
    SELECT Fecha, Titulo, Descripcion
    FROM Calendario
    WHERE strftime('%m', Fecha) = ? AND strftime('%Y', Fecha) = ?
    ORDER BY date(Fecha) ASC;
  `);
  stmt.bind([mesStr, anioStr]);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

// Buscar inquilino exacto según el formulario
export function findInquilino(db, { dpi, numeroCasa, nombre, apellido, fechaNac }) {
  const stmt = db.prepare(`
    SELECT DPI, PrimerNombre, PrimerApellido, FechaNacimiento, NumeroCasa
    FROM Inquilino
    WHERE DPI = ? AND NumeroCasa = ? AND UPPER(PrimerNombre) = UPPER(?)
      AND UPPER(PrimerApellido) = UPPER(?) AND FechaNacimiento = ?;
  `);
  stmt.bind([dpi, Number(numeroCasa), nombre, apellido, fechaNac]);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

// ¿Pago al día para un mes/año?
export function pagoAlDia(db, { numeroCasa, anio, mes }) {
  const stmt = db.prepare(`
    SELECT 1
    FROM PagoDeCuotas
    WHERE NumeroCasa = ? AND Año = ? AND Mes = ?
    LIMIT 1;
  `);
  stmt.bind([Number(numeroCasa), Number(anio), Number(mes)]);
  const ok = stmt.step();
  stmt.free();
  return ok;
}

// Historial de pagos por rango de fechas (FechaPago)
export function historialPagos(db, { numeroCasa, desde, hasta }) {
  const stmt = db.prepare(`
    SELECT Año, Mes, FechaPago
    FROM PagoDeCuotas
    WHERE NumeroCasa = ?
      AND date(FechaPago) BETWEEN date(?) AND date(?)
    ORDER BY date(FechaPago) DESC;
  `);
  stmt.bind([Number(numeroCasa), desde, hasta]);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

