const GITHUB_API = 'https://api.github.com';
const OWNER = process.env.GITHUB_OWNER || 'SERCO2025';
const REPO = process.env.GITHUB_REPO || 'SERCO';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const TOKEN = process.env.GITHUB_TOKEN || '';
const CONFIG_KEY = process.env.SERCO_CONFIG_KEY || '';
const CONFIG_PATH = 'configuracion/site-config.json';
const MANIFEST_PATH = 'fotos/imagenes.json';

function send(res, status, body) {
  res.status(status).json(body);
}

function unauthorized(req) {
  if (!CONFIG_KEY) return false;
  const header = req.headers && (req.headers.authorization || req.headers.Authorization);
  const supplied = header && header.startsWith('Bearer ') ? header.slice(7) : '';
  return supplied !== CONFIG_KEY;
}

function githubHeaders() {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };
}

function githubUrl(path) {
  return `${GITHUB_API}/repos/${encodeURIComponent(OWNER)}/${encodeURIComponent(REPO)}/contents/${path}`;
}

async function githubGet(path) {
  const r = await fetch(`${githubUrl(path)}?ref=${encodeURIComponent(BRANCH)}`, {
    headers: githubHeaders()
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || `GitHub GET ${r.status}`);
  return data;
}

async function githubPut(path, contentBase64, message, sha) {
  const body = { message, content: contentBase64, branch: BRANCH };
  if (sha) body.sha = sha;
  const r = await fetch(githubUrl(path), {
    method: 'PUT',
    headers: githubHeaders(),
    body: JSON.stringify(body)
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || `GitHub PUT ${r.status}`);
  return data;
}

async function githubDelete(path, sha, message) {
  const r = await fetch(githubUrl(path), {
    method: 'DELETE',
    headers: githubHeaders(),
    body: JSON.stringify({ message, sha, branch: BRANCH })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || `GitHub DELETE ${r.status}`);
  return data;
}

function decodeBase64(value) {
  return Buffer.from(value.replace(/\n/g, ''), 'base64').toString('utf8');
}

function encodeUtf8(value) {
  return Buffer.from(value, 'utf8').toString('base64');
}

function hslToHex(h,s,l){h=((h%360)+360)%360;s=Math.max(0,Math.min(1,s));l=Math.max(0,Math.min(1,l));const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let r=0,g=0,b=0;if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}return '#'+[r,g,b].map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('').toUpperCase();}
function rgbToHsl(hex){const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255,max=Math.max(r,g,b),min=Math.min(r,g,b);let h=0,s=0,l=(max+min)/2;if(max!==min){const d=max-min;s=l>.5?d/(2-max-min):d/(max+min);if(max===r)h=((g-b)/d+(g<b?6:0))/6;else if(max===g)h=((b-r)/d+2)/6;else h=((r-g)/d+4)/6;}return [h*360,s,l];}
function buildColorRoutes(hex){const [h,s,l]=rgbToHsl(hex);return {a:{secondary:hslToHex(h+60,s,l),tertiary:hslToHex(h+30,s,l)},b:{secondary:hslToHex(h-60,s,l),tertiary:hslToHex(h-30,s,l)}};}
function normalizeConfig(input) {
  const safe = JSON.parse(JSON.stringify(input || {}));
  if (!/^#[0-9a-fA-F]{6}$/.test(safe.accent || '')) safe.accent = '#009BFF';
  const routes = buildColorRoutes(safe.accent);
  safe.secondaryChoice = safe.secondaryChoice === 'b' ? 'b' : 'a';
  safe.secondary = routes[safe.secondaryChoice].secondary;
  safe.tertiary = routes[safe.secondaryChoice].tertiary;
  if (!/^#[0-9a-fA-F]{6}$/.test(safe.siteBg || '')) safe.siteBg = '#0B1120';
  safe.announcement = safe.announcement || {};
  safe.announcement.visible = safe.announcement.visible === true;
  const allowedAfter = ['portada', 'servicios', 'galeria', 'cobertura', 'contacto'];
  if (!allowedAfter.includes(safe.announcement.after)) safe.announcement.after = 'portada';
  return safe;
}

async function saveConfig(config) {
  const current = await githubGet(CONFIG_PATH);
  const content = encodeUtf8(JSON.stringify(normalizeConfig(config), null, 2) + '\n');
  return githubPut(CONFIG_PATH, content, 'Actualizar configuración pública de SERCO', current.sha);
}

async function saveManifest(gallery) {
  const current = await githubGet(MANIFEST_PATH);
  const normalized = (Array.isArray(gallery) ? gallery : [])
    .map((p, index) => ({
      archivo: String(p.archivo || p.name || '').trim(),
      visible: p.visible !== false,
      orden: Math.max(1, Number(p.orden ?? p.order ?? index + 1) || index + 1)
    }))
    .filter(p => p.archivo && !p.archivo.includes('..') && !p.archivo.includes('/') && !p.archivo.includes('\\'))
    .sort((a, b) => a.orden - b.orden);
  const content = encodeUtf8(JSON.stringify(normalized, null, 2) + '\n');
  return githubPut(MANIFEST_PATH, content, 'Actualizar manifiesto de galería SERCO', current.sha);
}

function parseDataUrl(dataUrl) {
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(String(dataUrl || ''));
  if (!match) throw new Error('Formato de imagen no permitido. Use JPG, PNG, WEBP o GIF.');
  const mime = match[1];
  const base64 = match[2].replace(/\r?\n/g, '');
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length > 8 * 1024 * 1024) throw new Error('La imagen supera el límite de 8 MB.');
  return { mime, base64, bytes };
}

function safeImageName(name, mime) {
  let value = String(name || '').trim().replace(/[^A-Za-z0-9._-]/g, '_');
  if (!value) value = 'imagen';
  if (!/\.[A-Za-z0-9]{2,5}$/.test(value)) {
    const ext = mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1];
    value += `.${ext}`;
  }
  if (value.length > 120) value = value.slice(0, 120);
  return value;
}

async function uploadImage(name, data) {
  const parsed = parseDataUrl(data);
  const filename = safeImageName(name, parsed.mime);
  const path = `fotos/${filename}`;
  let sha = null;
  try {
    const existing = await githubGet(path);
    sha = existing.sha;
  } catch (e) {
    if (!String(e.message).toLowerCase().includes('not found')) throw e;
  }
  const result = await githubPut(path, parsed.base64, `Subir fotografía ${filename}`, sha || undefined);
  const manifest = await githubGet(MANIFEST_PATH);
  const currentGallery = JSON.parse(decodeBase64(manifest.content));
  const items = Array.isArray(currentGallery) ? currentGallery : [];
  if (!items.some(x => x.archivo === filename)) {
    const nextOrder = items.reduce((m, x) => Math.max(m, Number(x.orden) || 0), 0) + 1;
    items.push({ archivo: filename, visible: true, orden: nextOrder });
    await saveManifest(items);
  }
  return { filename, commit: result.commit && result.commit.sha };
}

async function deleteImage(name) {
  const filename = safeImageName(name, 'image/jpeg');
  const path = `fotos/${filename}`;
  const file = await githubGet(path);
  await githubDelete(path, file.sha, `Eliminar fotografía ${filename}`);
  const manifest = await githubGet(MANIFEST_PATH);
  const currentGallery = JSON.parse(decodeBase64(manifest.content));
  const filtered = (Array.isArray(currentGallery) ? currentGallery : []).filter(x => x.archivo !== filename);
  await saveManifest(filtered);
  return { filename };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'GET' && req.method !== 'POST') return send(res, 405, { error: 'Método no permitido.' });

  if (req.method === 'GET') {
    try {
      const file = await githubGet(CONFIG_PATH);
      const raw = decodeBase64(file.content).replace(/^\\uFEFF/, '').trim();
      if (!raw) {
        return send(res, 200, normalizeConfig({
          accent: '#009BFF',
          secondaryChoice: 'a',
          siteBg: '#0B1120',
          announcement: {
            visible: true,
            after: 'portada',
            bgVisible: true,
            bg: '#FFFFFF',
            borderVisible: true,
            border: '#009BFF',
            radius: 20,
            borderWidth: 2,
            shadow: true,
            title: { text: 'Título del comunicado', color: '#111827', size: 32, bold: true, italic: false, align: 'center', font: 'Montserrat' },
            body: { text: 'Escribe aquí el texto principal del anuncio o comunicado.', color: '#334155', size: 18, bold: false, italic: false, align: 'center', font: 'Montserrat' },
            img: { data: '', pos: 'behind', size: 70, rot: 0, alpha: 100, y: 50 }
          }
        }));
      }
      return send(res, 200, JSON.parse(raw));
    } catch (e) {
      return send(res, 500, { error: e.message || 'No se pudo leer la configuración.' });
    }
  }

  if (!TOKEN) return send(res, 503, { error: 'La conexión segura con GitHub aún no está configurada en Vercel.' });
  if (CONFIG_KEY && unauthorized(req)) return send(res, 401, { error: 'No autorizado.' });

  try {
    const body = req.body || {};
    if (body.action === 'save-config') return send(res, 200, await saveConfig(body.config));
    if (body.action === 'save-gallery') return send(res, 200, await saveManifest(body.gallery));
    if (body.action === 'upload-image') return send(res, 200, await uploadImage(body.name, body.data));
    if (body.action === 'delete-image') return send(res, 200, await deleteImage(body.name));
    return send(res, 400, { error: 'Acción no reconocida.' });
  } catch (e) {
    return send(res, 500, { error: e.message || 'Error interno al modificar GitHub.' });
  }
};
