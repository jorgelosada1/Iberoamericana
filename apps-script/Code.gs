/**
 * Inscripción IBERO → Google Sheets
 * Pega este código en: tu Google Sheet > Extensiones > Apps Script.
 * Luego: Implementar > Nueva implementación > Aplicación web
 *        Ejecutar como: Yo · Quién tiene acceso: Cualquier persona
 */

const NOMBRE_HOJA = 'Inscripciones';

// [clave que envía el formulario, título de la columna]
const COLUMNAS = [
  ['fechaRegistro', 'Fecha de registro'],
  ['nombres', 'Nombres completos'],
  ['tipoDocumento', 'Tipo de documento'],
  ['numeroDocumento', 'Número de documento'],
  ['fechaExpedicion', 'Fecha de expedición'],
  ['fechaNacimiento', 'Fecha de nacimiento'],
  ['estadoCivil', 'Estado civil'],
  ['celular', 'Celular'],
  ['telefonoFijo', 'Teléfono fijo'],
  ['email', 'Correo electrónico'],
  ['ciudad', 'Ciudad'],
  ['direccion', 'Dirección'],
  ['barrio', 'Barrio'],
  ['eps', 'EPS'],
  ['estrato', 'Estrato'],
  ['personasACargo', 'Personas a cargo'],
  ['grupoEtnico', 'Grupo étnico'],
  ['discapacidad', 'Discapacidad'],
  ['discapacidadCual', '¿Cuál discapacidad?'],
  ['contactoNombre', 'Familiar de contacto'],
  ['contactoParentesco', 'Parentesco'],
  ['contactoTelefono', 'Número del familiar'],
  ['autorizaDatos', 'Autoriza datos (Ley 1581)']
];

// Columnas que deben guardarse como texto (conservan ceros y no se vuelven notación científica)
const COMO_TEXTO = ['numeroDocumento', 'celular', 'telefonoFijo', 'contactoTelefono', 'fechaExpedicion', 'fechaNacimiento'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const data = JSON.parse(e.postData.contents);
    const hoja = obtenerHoja_();
    data.fechaRegistro = Utilities.formatDate(new Date(), 'America/Bogota', 'dd/MM/yyyy HH:mm:ss');

    const fila = COLUMNAS.map(([clave]) => {
      const v = data[clave] == null ? '' : String(data[clave]).trim();
      return COMO_TEXTO.includes(clave) && v ? "'" + v : v;
    });
    hoja.appendRow(fila);
    return respuesta_({ ok: true });
  } catch (err) {
    return respuesta_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return respuesta_({ ok: true, mensaje: 'Inscripción IBERO activa' });
}

function obtenerHoja_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = libro.getSheetByName(NOMBRE_HOJA) || libro.insertSheet(NOMBRE_HOJA);
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(COLUMNAS.map(c => c[1]));
    hoja.getRange(1, 1, 1, COLUMNAS.length)
      .setFontWeight('bold')
      .setBackground('#4A4848')
      .setFontColor('#FFFFFF');
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function respuesta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
