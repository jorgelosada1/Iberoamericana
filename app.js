/* =========================================================
   Inscripción IBERO — lógica del formulario
   ========================================================= */

/* 1) PEGA AQUÍ la URL de tu Apps Script (Implementar > Aplicación web).
      Ver LEEME.md para los pasos. */
const SCRIPT_URL = '';

const BORRADOR = 'ibero-inscripcion-borrador';
const $ = id => document.getElementById(id);
const form = $('registroForm');
const pasos = [...document.querySelectorAll('.paso')];
const stepsEl = $('steps');
let actual = 0;

/* ---------- Utilidades de almacenamiento (pueden fallar en incógnito) ---------- */
const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } };
const leer = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const borrar = k => { try { localStorage.removeItem(k); } catch (e) { /* nada */ } };

/* ---------- Botones de opción (chips) a partir de <select> ---------- */
document.querySelectorAll('select[data-chips]').forEach(select => {
    const grupo = document.createElement('div');
    grupo.className = 'chips' + (select.dataset.chips === 'num' ? ' chips-num' : '');
    grupo.setAttribute('role', 'radiogroup');
    grupo.setAttribute('aria-labelledby', select.getAttribute('aria-labelledby'));
    const botones = [];
    [...select.options].filter(o => o.value).forEach(o => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip';
        b.dataset.value = o.value;
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', 'false');
        b.textContent = o.textContent;
        b.addEventListener('click', () => {
            select.value = o.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });
        b.addEventListener('keydown', e => {
            const i = botones.indexOf(b);
            const sig = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
            if (!sig) return;
            e.preventDefault();
            const n = botones[(i + sig + botones.length) % botones.length];
            n.focus();
            n.click();
        });
        botones.push(b);
        grupo.appendChild(b);
    });
    const pintar = () => {
        const hay = botones.some(b => b.dataset.value === select.value);
        botones.forEach((b, i) => {
            const on = b.dataset.value === select.value;
            b.classList.toggle('on', on);
            b.setAttribute('aria-checked', on ? 'true' : 'false');
            b.tabIndex = on || (!hay && i === 0) ? 0 : -1;
        });
    };
    select.addEventListener('change', pintar);
    select._pintar = pintar;
    pintar();
    select.after(grupo);
});

/* ---------- Reglas de los campos ---------- */
// Solo dígitos en teléfonos
document.querySelectorAll('[data-digitos]').forEach(inp => {
    inp.addEventListener('input', () => {
        let limpio = inp.value.replace(/\D/g, '');
        if (limpio.length > 10 && limpio.startsWith('57')) limpio = limpio.slice(2);
        limpio = limpio.slice(0, 10);
        if (limpio !== inp.value) inp.value = limpio;
    });
});

// Documento: numérico salvo pasaporte / PPT
const tipoDoc = $('tipoDocumento');
const numDoc = $('numeroDocumento');
function reglasDocumento() {
    const alfa = tipoDoc.value === 'Pasaporte' || tipoDoc.value === 'PPT';
    numDoc.pattern = alfa ? '[A-Za-z0-9]{5,15}' : '[0-9]{5,12}';
    numDoc.inputMode = alfa ? 'text' : 'numeric';
    limpiarDoc();
}
function limpiarDoc() {
    const alfa = tipoDoc.value === 'Pasaporte' || tipoDoc.value === 'PPT';
    const v = (alfa ? numDoc.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase() : numDoc.value.replace(/\D/g, '')).slice(0, alfa ? 15 : 12);
    if (v !== numDoc.value) numDoc.value = v;
}
tipoDoc.addEventListener('change', reglasDocumento);
numDoc.addEventListener('input', limpiarDoc);

// Fechas coherentes
const fNac = $('fechaNacimiento');
const fExp = $('fechaExpedicion');
const iso = d => d.toISOString().slice(0, 10);
const hoy = new Date();
const haceAnios = n => { const d = new Date(hoy); d.setFullYear(d.getFullYear() - n); return d; };
fNac.min = '1930-01-01';
fNac.max = iso(haceAnios(13));
fExp.min = '1950-01-01';
fExp.max = iso(hoy);
function reglasFechas() {
    fExp.setCustomValidity(fNac.value && fExp.value && fExp.value < fNac.value ? 'La expedición no puede ser antes del nacimiento' : '');
}
fNac.addEventListener('change', reglasFechas);
fExp.addEventListener('change', reglasFechas);

// Discapacidad "Otra" → ¿cuál?
const disc = $('discapacidad');
function reglasDisc() {
    const otra = disc.value === 'Otra';
    $('discCualRow').hidden = !otra;
    $('discapacidadCual').required = otra;
}
disc.addEventListener('change', reglasDisc);

// Nombres en formato título al salir del campo
const minusculas = ['de', 'del', 'la', 'las', 'los', 'y', 'e', 'da', 'do', 'dos', 'van', 'von'];
document.querySelectorAll('[data-titulo]').forEach(inp => {
    inp.addEventListener('blur', () => {
        inp.value = inp.value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es')
            .split(' ')
            .map((p, i) => (i > 0 && minusculas.includes(p)) ? p : p.replace(/(^|[.\-'])(\p{L})/gu, (m, a, l) => a + l.toLocaleUpperCase('es')))
            .join(' ');
        guardarBorrador();
    });
});
$('email').addEventListener('blur', e => { e.target.value = e.target.value.trim().toLowerCase(); });

/* ---------- Pasos ---------- */
pasos.forEach((p, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button"><span class="st-n"><span class="num">${i + 1}</span></span><span class="st-t"><b>${p.dataset.titulo}</b><small>${p.dataset.sub || ''}</small></span></button>`;
    li.querySelector('button').addEventListener('click', () => irA(i));
    stepsEl.appendChild(li);
});

function activo(el, paso) {
    if (el.disabled) return false;
    for (let n = el.parentElement; n && n !== paso; n = n.parentElement) if (n.hidden) return false;
    return true;
}
const camposDe = i => [...pasos[i].querySelectorAll('input, select, textarea')].filter(el => activo(el, pasos[i]) && el.willValidate);
const faltantes = i => camposDe(i).filter(el => !el.checkValidity());
const completo = i => faltantes(i).length === 0;
const caja = el => el.closest('.consent') || el.closest('.choice') || el.closest('.field') || el;

function pintarErrores(i) {
    camposDe(i).forEach(el => caja(el).classList.toggle('bad', !el.checkValidity()));
}
function limpiarErrores() {
    document.querySelectorAll('.bad').forEach(n => n.classList.remove('bad'));
    pasos.forEach(p => p.classList.remove('intentado'));
}

function mostrar(i, dir) {
    const antes = actual;
    actual = i;
    pasos.forEach((p, k) => {
        p.hidden = k !== i;
        p.classList.remove('entra-der', 'entra-izq');
    });
    pasos[i].classList.add((dir ?? (i >= antes ? 1 : -1)) > 0 ? 'entra-der' : 'entra-izq');
    if (i === pasos.length - 1) armarResumen();

    const hechos = pasos.map((_, k) => k !== i && completo(k));
    [...stepsEl.children].forEach((li, k) => {
        li.classList.toggle('activo', k === i);
        li.classList.toggle('hecho', hechos[k]);
        li.querySelector('.st-n').innerHTML = hechos[k]
            ? '<span class="material-symbols-rounded">check</span>'
            : `<span class="num">${k + 1}</span>`;
        const b = li.querySelector('button');
        if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    const pct = Math.round(pasos.filter((_, k) => completo(k)).length / pasos.length * 100);
    $('progressBar').style.width = Math.max(pct, (i / pasos.length) * 100) + '%';
    $('pctTxt').textContent = pct + '%';

    $('btnPrev').classList.toggle('oculto', i === 0);
    const ultimo = i === pasos.length - 1;
    $('btnNext').hidden = ultimo;
    $('btnSubmit').hidden = !ultimo;
    guardar(BORRADOR + '-paso', String(i));
}

function marcarErrores(i) {
    const malos = faltantes(i);
    pasos[i].classList.toggle('intentado', malos.length > 0);
    pintarErrores(i);
    if (malos.length) {
        const c = malos[0];
        const cj = caja(c);
        cj.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
            if (c.classList.contains('sr-select')) {
                const chip = cj.querySelector('.chip[tabindex="0"]') || cj.querySelector('.chip');
                if (chip) chip.focus({ preventScroll: true });
            } else c.focus({ preventScroll: true });
        }, 380);
        pasos[i].classList.remove('sacude'); void pasos[i].offsetWidth; pasos[i].classList.add('sacude');
    }
    return malos.length === 0;
}

function irA(i) {
    if (i <= actual) { mostrar(i, -1); subir(); return; }
    for (let k = actual; k < i; k++) {
        if (!completo(k)) { if (k !== actual) mostrar(k, 1); marcarErrores(k); return; }
    }
    mostrar(i, 1);
    subir();
}
function subir() {
    const top = form.getBoundingClientRect().top + window.scrollY - 14;
    if (Math.abs(window.scrollY - top) > 40) window.scrollTo({ top, behavior: 'smooth' });
}

$('btnNext').addEventListener('click', () => irA(actual + 1));
$('btnPrev').addEventListener('click', () => irA(Math.max(0, actual - 1)));
form.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && actual < pasos.length - 1) {
        e.preventDefault();
        irA(actual + 1);
    }
});
const revalidar = () => {
    if (pasos[actual].classList.contains('intentado')) {
        pintarErrores(actual);
        pasos[actual].classList.toggle('intentado', !completo(actual));
    }
    guardarBorrador();
};
form.addEventListener('input', revalidar);
form.addEventListener('change', revalidar);

/* ---------- Resumen ---------- */
const val = id => ($(id).value || '').trim();
const textoDe = id => {
    const el = $(id);
    if (el.tagName === 'SELECT') return el.selectedOptions[0] && el.value ? el.selectedOptions[0].textContent : '';
    return el.value.trim();
};
const fechaLarga = s => {
    if (!s) return '';
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
};

function armarResumen() {
    const grupos = [
        [0, 'Datos personales', [
            ['Nombres completos', textoDe('nombres')],
            ['Documento', [val('tipoDocumento'), val('numeroDocumento')].filter(Boolean).join(' ')],
            ['Fecha de expedición', fechaLarga(val('fechaExpedicion'))],
            ['Fecha de nacimiento', fechaLarga(val('fechaNacimiento'))],
            ['Estado civil', textoDe('estadoCivil')]
        ]],
        [1, 'Contacto', [
            ['Celular', val('celular') ? '+57 ' + val('celular') : ''],
            ['Teléfono fijo', val('telefonoFijo')],
            ['Correo', val('email')],
            ['Ciudad', val('ciudad')],
            ['Dirección', val('direccion')],
            ['Barrio', val('barrio')]
        ]],
        [2, 'Perfil', [
            ['EPS', val('eps')],
            ['Estrato', val('estrato')],
            ['Personas a cargo', val('personasACargo')],
            ['Grupo étnico', textoDe('grupoEtnico')],
            ['Discapacidad', val('discapacidad') === 'Otra' ? 'Otra: ' + val('discapacidadCual') : val('discapacidad')]
        ]],
        [3, 'Familiar de contacto', [
            ['Nombre', val('contactoNombre')],
            ['Parentesco', val('contactoParentesco')],
            ['Número', val('contactoTelefono') ? '+57 ' + val('contactoTelefono') : '']
        ]]
    ];
    const r = $('resumen');
    r.innerHTML = '';
    grupos.forEach(([paso, titulo, filas]) => {
        const card = document.createElement('div');
        card.className = 'res-card';
        card.innerHTML = `<div class="res-head"><h4><i>${paso + 1}</i></h4><button type="button" class="res-edit"><span class="material-symbols-rounded">edit</span> Editar</button></div><dl></dl>`;
        card.querySelector('h4').append(titulo);
        card.querySelector('.res-edit').addEventListener('click', () => { mostrar(paso, -1); subir(); });
        const dl = card.querySelector('dl');
        filas.forEach(([k, v]) => {
            const div = document.createElement('div');
            const dt = document.createElement('dt'); dt.textContent = k;
            const dd = document.createElement('dd'); dd.textContent = v || '—';
            if (!v) dd.className = 'vacio';
            div.append(dt, dd);
            dl.appendChild(div);
        });
        r.appendChild(card);
    });
}

/* ---------- Borrador local ---------- */
const CAMPOS = ['nombres', 'tipoDocumento', 'numeroDocumento', 'fechaExpedicion', 'fechaNacimiento', 'estadoCivil',
    'celular', 'telefonoFijo', 'email', 'ciudad', 'direccion', 'barrio',
    'eps', 'estrato', 'personasACargo', 'grupoEtnico', 'discapacidad', 'discapacidadCual',
    'contactoNombre', 'contactoParentesco', 'contactoTelefono'];

function guardarBorrador() {
    const d = {};
    CAMPOS.forEach(id => { d[id] = $(id).value; });
    guardar(BORRADOR, JSON.stringify(d));
}
function cargarBorrador() {
    let d = null;
    try { d = JSON.parse(leer(BORRADOR) || 'null'); } catch (e) { d = null; }
    if (!d) return false;
    CAMPOS.forEach(id => { if (d[id] != null) $(id).value = d[id]; });
    document.querySelectorAll('select[data-chips]').forEach(s => s._pintar());
    reglasDocumento(); reglasFechas(); reglasDisc();
    return CAMPOS.some(id => d[id]);
}

/* ---------- Envío ---------- */
function showToast(message, tipo) {
    const toast = document.createElement('div');
    toast.className = 'toast ' + (tipo || '');
    toast.textContent = message;
    $('toastContainer').appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 5000);
}

const ddmmyyyy = s => { const p = (s || '').split('-'); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s; };

form.addEventListener('submit', event => {
    event.preventDefault();
    for (let k = 0; k < pasos.length; k++) {
        if (!completo(k)) { if (k !== actual) mostrar(k, -1); marcarErrores(k); return; }
    }
    if (!SCRIPT_URL) {
        showToast('El formulario aún no está conectado a Google Sheets. Avísale a tu asesor.', 'error');
        console.warn('Falta configurar SCRIPT_URL en app.js (ver LEEME.md).');
        return;
    }
    const boton = $('btnSubmit');
    if (boton.disabled) return;
    boton.disabled = true;
    $('loader').hidden = false;

    const data = {
        fechaRegistro: new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
        nombres: val('nombres'),
        tipoDocumento: val('tipoDocumento'),
        numeroDocumento: val('numeroDocumento'),
        fechaExpedicion: ddmmyyyy(val('fechaExpedicion')),
        fechaNacimiento: ddmmyyyy(val('fechaNacimiento')),
        estadoCivil: val('estadoCivil'),
        celular: val('celular'),
        telefonoFijo: val('telefonoFijo'),
        email: val('email').toLowerCase(),
        ciudad: val('ciudad'),
        direccion: val('direccion'),
        barrio: val('barrio'),
        eps: val('eps'),
        estrato: val('estrato'),
        personasACargo: val('personasACargo'),
        grupoEtnico: val('grupoEtnico'),
        discapacidad: val('discapacidad'),
        discapacidadCual: val('discapacidad') === 'Otra' ? val('discapacidadCual') : '',
        contactoNombre: val('contactoNombre'),
        contactoParentesco: val('contactoParentesco'),
        contactoTelefono: val('contactoTelefono'),
        autorizaDatos: $('autorizaDatos').checked ? 'Sí' : 'No'
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
    })
        .then(() => {
            $('loader').hidden = true;
            boton.disabled = false;
            borrar(BORRADOR); borrar(BORRADOR + '-paso');
            $('doneName').textContent = data.nombres.split(/\s+/)[0] || '';
            form.hidden = true;
            document.querySelector('.zona-head').hidden = true;
            $('done').hidden = false;
            lanzarConfeti();
            $('done').scrollIntoView({ behavior: 'smooth', block: 'center' });
            $('done').focus({ preventScroll: true });
        })
        .catch(error => {
            $('loader').hidden = true;
            boton.disabled = false;
            showToast('No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.', 'error');
            console.error(error);
        });
});

function lanzarConfeti() {
    const c = document.querySelector('.confeti');
    c.innerHTML = '';
    const colores = ['#DFC14E', '#D0AB4B', '#4A4848', '#EEEDEB'];
    for (let i = 0; i < 44; i++) {
        const s = document.createElement('i');
        s.style.left = Math.random() * 100 + '%';
        s.style.background = colores[i % colores.length];
        s.style.animationDelay = (Math.random() * .6) + 's';
        s.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
        if (i % 3 === 0) s.style.borderRadius = '50%';
        c.appendChild(s);
    }
}

$('btnNuevo').addEventListener('click', () => {
    form.reset();
    limpiarErrores();
    document.querySelectorAll('select[data-chips]').forEach(s => s._pintar());
    reglasDocumento(); reglasFechas(); reglasDisc();
    $('done').hidden = true;
    document.querySelector('.zona-head').hidden = false;
    form.hidden = false;
    mostrar(0, -1);
    subir();
});

/* ---------- Inicio ---------- */
reglasDocumento();
if (cargarBorrador()) {
    const p = parseInt(leer(BORRADOR + '-paso') || '0', 10);
    let destino = 0;
    while (destino < Math.min(p, pasos.length - 1) && completo(destino)) destino++;
    mostrar(destino, 1);
    if (destino > 0) showToast('Recuperamos lo que llevabas. Puedes continuar donde ibas.');
} else {
    mostrar(0, 1);
}
