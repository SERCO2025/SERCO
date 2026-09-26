const SUPABASE_URL = 'https://hlwxgetogjvieejcmttf.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';
const CONFIG_KEY = process.env.SERCO_CONFIG_KEY || '';
const BUCKET = 'serco-media';
const CONFIG_ID = 'default';

function send(res, status, body) {
  res.status(status).json(body);
}

function unauthorized(req) {
  if (!CONFIG_KEY) return false;
  const header = req.headers && (req.headers.authorization || req.headers.Authorization);
  const supplied = header && header.startsWith('Bearer ') ? header.slice(7) : '';
  return supplied !== CONFIG_KEY;
}

function requireSupabase() {
  if (!SUPABASE_SECRET_KEY) throw new Error('SUPABASE_SECRET_KEY no está configurada en Vercel.');
}

function supabaseHeaders(extra = {}) {
  requireSupabase();
  return {
    apikey: SUPABASE_SECRET_KEY,
    Accept: 'application/json',
    ...extra
  };
}

async function supabaseRequest(path, options = {}) {
  const r = await fetch(SUPABASE_URL + path, {
    ...options,
    headers: supabaseHeaders(options.headers || {})
  });
  const text = await r.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { raw: text }; }
  if (!r.ok) throw new Error(data.message || data.error || data.hint || ('Supabase HTTP ' + r.status));
  return data;
}

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

  safe.announcement.bgVisible = safe.announcement.bgVisible !== false;
  safe.announcement.bg = /^#[0-9a-fA-F]{6}$/.test(safe.announcement.bg || '') ? safe.announcement.bg : '#FFFFFF';
  safe.announcement.borderVisible = safe.announcement.borderVisible !== false;
  safe.announcement.border = /^#[0-9a-fA-F]{6}$/.test(safe.announcement.border || '') ? safe.announcement.border : '#009BFF';
  safe.announcement.radius = Number.isFinite(Number(safe.announcement.radius)) ? Number(safe.announcement.radius) : 20;
  safe.announcement.borderWidth = Number.isFinite(Number(safe.announcement.borderWidth)) ? Number(safe.announcement.borderWidth) : 2;
  safe.announcement.shadow = safe.announcement.shadow !== false;

  safe.announcement.title = safe.announcement.title || {};
  safe.announcement.title.text = String(safe.announcement.title.text || 'Título del comunicado');
  safe.announcement.title.color = /^#[0-9a-fA-F]{6}$/.test(safe.announcement.title.color || '') ? safe.announcement.title.color : '#111827';
  safe.announcement.title.size = Number.isFinite(Number(safe.announcement.title.size)) ? Number(safe.announcement.title.size) : 32;
  safe.announcement.title.bold = safe.announcement.title.bold !== false;
  safe.announcement.title.italic = safe.announcement.title.italic === true;
  safe.announcement.title.align = String(safe.announcement.title.align || 'center');
  safe.announcement.title.font = String(safe.announcement.title.font || 'Montserrat');

  safe.announcement.body = safe.announcement.body || {};
  safe.announcement.body.text = String(safe.announcement.body.text || 'Escribe aquí el texto principal del anuncio o comunicado.');
  safe.announcement.body.color = /^#[0-9a-fA-F]{6}$/.test(safe.announcement.body.color || '') ? safe.announcement.body.color : '#334155';
  safe.announcement.body.size = Number.isFinite(Number(safe.announcement.body.size)) ? Number(safe.announcement.body.size) : 18;
  safe.announcement.body.bold = safe.announcement.body.bold === true;
  safe.announcement.body.italic = safe.announcement.body.italic === true;
  safe.announcement.body.align = String(safe.announcement.body.align || 'center');
  safe.announcement.body.font = String(safe.announcement.body.font || 'Montserrat');

  safe.announcement.img = safe.announcement.img || {};
  safe.announcement.img.pos = String(safe.announcement.img.pos || 'behind');
  safe.announcement.img.size = Number.isFinite(Number(safe.announcement.img.size)) ? Number(safe.announcement.img.size) : 70;
  safe.announcement.img.rot = Number.isFinite(Number(safe.announcement.img.rot)) ? Number(safe.announcement.img.rot) : 0;
  safe.announcement.img.alpha = Number.isFinite(Number(safe.announcement.img.alpha)) ? Number(safe.announcement.img.alpha) : 100;
  safe.announcement.img.y = Number.isFinite(Number(safe.announcement.img.y)) ? Number(safe.announcement.img.y) : 50;

  return safe;
}

function hslToHex(h,s,l){h=((h%360)+360)%360;s=Math.max(0,Math.min(1,s));l=Math.max(0,Math.min(1,l));const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let r=0,g=0,b=0;if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}return '#'+[r,g,b].map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('').toUpperCase();}
function rgbToHsl(hex){const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255,max=Math.max(r,g,b),min=Math.min(r,g,b);let h=0,s=0,l=(max+min)/2;if(max!==min){const d=max-min;s=l>.5?d/(2-max-min):d/(max+min);if(max===r)h=((g-b)/d+(g<b?6:0)/6);else if(max===g)h=((b-r)/d+2)/6;else h=((r-g)/d+4)/6;h=h;}return [h*360,s,l];}
function buildColorRoutes(hex){const [h,s,l]=rgbToHsl(hex);return {a:{secondary:hslToHex(h+60,s,l),tertiary:hslToHex(h+30,s,l)},b:{secondary:hslToHex(h-60,s,l),tertiary:hslToHex(h-30,s,l)}};}

function rowToConfig(row) {
  return normalizeConfig({
    accent: row.accent,
    secondary: row.secondary,
    tertiary: row.tertiary,
    secondaryChoice: row.secondary_choice,
    siteBg: row.site_bg,
    announcement: {
      visible: row.announcement_visible,
      after: row.announcement_after,
      bgVisible: row.announcement_bg_visible,
      bg: row.announcement_bg,
      borderVisible: row.announcement_border_visible,
      border: row.announcement_border,
      radius: row.announcement_radius,
      borderWidth: row.announcement_border_width,
      shadow: row.announcement_shadow,
      title: {
        text: row.announcement_title_text,
        color: row.announcement_title_color,
        size: row.announcement_title_size,
        bold: row.announcement_title_bold,
        italic: row.announcement_title_italic,
        align: row.announcement_title_align,
        font: row.announcement_title_font
      },
      body: {
        text: row.announcement_body_text,
        color: row.announcement_body_color,
        size: row.announcement_body_size,
        bold: row.announcement_body_bold,
        italic: row.announcement_body_italic,
        align: row.announcement_body_align,
        font: row.announcement_body_font
      },
      img: {
        data: row.announcement_img_url || row.announcement_img_data || '',
        pos: row.announcement_img_pos,
        size: row.announcement_img_size,
        rot: row.announcement_img_rot,
        alpha: row.announcement_img_alpha,
        y: row.announcement_img_y
      }
    }
  });
}

function configToRow(config, imageUrl = null) {
  const c = normalizeConfig(config);
  const a = c.announcement;
  return {
    id: CONFIG_ID,
    accent: c.accent,
    secondary: c.secondary,
    tertiary: c.tertiary,
    secondary_choice: c.secondaryChoice,
    site_bg: c.siteBg,
    announcement_visible: a.visible,
    announcement_after: a.after,
    announcement_bg_visible: a.bgVisible,
    announcement_bg: a.bg,
    announcement_border_visible: a.borderVisible,
    announcement_border: a.border,
    announcement_radius: a.radius,
    announcement_border_width: a.borderWidth,
    announcement_shadow: a.shadow,
    announcement_title_text: a.title.text,
    announcement_title_color: a.title.color,
    announcement_title_size: a.title.size,
    announcement_title_bold: a.title.bold,
    announcement_title_italic: a.title.italic,
    announcement_title_align: a.title.align,
    announcement_title_font: a.title.font,
    announcement_body_text: a.body.text,
    announcement_body_color: a.body.color,
    announcement_body_size: a.body.size,
    announcement_body_bold: a.body.bold,
    announcement_body_italic: a.body.italic,
    announcement_body_align: a.body.align,
    announcement_body_font: a.body.font,
    announcement_img_url: imageUrl || (typeof a.img.data === 'string' && a.img.data.startsWith('http') ? a.img.data : null),
    announcement_img_data: null,
    announcement_img_pos: a.img.pos,
    announcement_img_size: a.img.size,
    announcement_img_rot: a.img.rot,
    announcement_img_alpha: a.img.alpha,
    announcement_img_y: a.img.y,
    updated_at: new Date().toISOString()
  };
}

async function getConfig() {
  let rows = await supabaseRequest('/rest/v1/site_settings?select=*&id=eq.' + encodeURIComponent(CONFIG_ID));
  if (!Array.isArray(rows) || !rows[0]) return normalizeConfig({});
  const row = rows[0];

  if (typeof row.announcement_img_data === 'string' && row.announcement_img_data.startsWith('data:image/')) {
    const parsed = parseDataUrl(row.announcement_img_data);
    const ext = parsed.mime === 'image/jpeg' ? 'jpg' : parsed.mime.split('/')[1];
    const path = 'comunicados/anuncio-migrado-' + Date.now() + '.' + ext;
    await uploadStorage(path, parsed.bytes, parsed.mime);
    const url = SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + path.split('/').map(encodeURIComponent).join('/');
    await supabaseRequest('/rest/v1/site_settings?id=eq.' + encodeURIComponent(CONFIG_ID), {
      method: 'PATCH',
      headers: {'Content-Type':'application/json',Prefer:'return=minimal'},
      body: JSON.stringify({announcement_img_url:url, announcement_img_data:null, updated_at:new Date().toISOString()})
    });
    row.announcement_img_url = url;
    row.announcement_img_data = null;
  }

  return rowToConfig(row);
}

async function saveConfig(config) {
  const normalized = normalizeConfig(config);
  const imageData = normalized.announcement && normalized.announcement.img && normalized.announcement.img.data;
  let imageUrl = null;

  if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
    const parsed = parseDataUrl(imageData);
    const ext = parsed.mime === 'image/jpeg' ? 'jpg' : parsed.mime.split('/')[1];
    const filename = 'anuncio-' + Date.now() + '.' + ext;
    const path = 'comunicados/' + filename;
    await uploadStorage(path, parsed.bytes, parsed.mime);
    imageUrl = SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + path.split('/').map(encodeURIComponent).join('/');
  } else if (typeof imageData === 'string' && imageData.startsWith('http')) {
    imageUrl = imageData;
  }

  const row = configToRow(normalized, imageUrl);
  await supabaseRequest('/rest/v1/site_settings?on_conflict=id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(row)
  });
  return {ok:true};
}

async function getGallery() {
  const rows = await supabaseRequest('/rest/v1/gallery_items?select=visible,sort_order,media_files!inner(storage_path,original_name)&order=sort_order.asc');
  return (Array.isArray(rows) ? rows : []).map(x => ({
    archivo: x.media_files && (x.media_files.original_name || String(x.media_files.storage_path || '').split('/').pop()),
    visible: x.visible !== false,
    orden: Number(x.sort_order) || 999999,
    url: x.media_files ? SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + String(x.media_files.storage_path || '').split('/').map(encodeURIComponent).join('/') : ''
  }));
}

function safeImageName(name, mime = 'image/jpeg') {
  let value = String(name || '').trim().replace(/[^A-Za-z0-9._-]/g, '_');
  if (!value) value = 'imagen';
  if (!/\.[A-Za-z0-9]{2,5}$/.test(value)) value += '.' + (mime === 'image/jpeg' ? 'jpg' : (mime.split('/')[1] || 'bin'));
  if (value.length > 120) value = value.slice(0, 120);
  return value;
}

function parseDataUrl(dataUrl) {
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(String(dataUrl || ''));
  if (!match) throw new Error('Formato de imagen no permitido. Use JPG, PNG, WEBP o GIF.');
  const mime = match[1];
  const base64 = match[2].replace(/\r?\n/g, '');
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length > 8 * 1024 * 1024) throw new Error('La imagen supera el límite de 8 MB.');
  return {mime, base64, bytes};
}

async function uploadStorage(path, bytes, mime) {
  const r = await fetch(SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + path.split('/').map(encodeURIComponent).join('/'), {
    method: 'POST',
    headers: supabaseHeaders({'Content-Type': mime, 'x-upsert': 'true'}),
    body: bytes
  });
  const text = await r.text();
  if (!r.ok) {
    let d={}; try {d=JSON.parse(text)} catch(_){}
    throw new Error(d.message || ('Storage HTTP ' + r.status));
  }
}

async function deleteStorage(path) {
  const r = await fetch(SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + path.split('/').map(encodeURIComponent).join('/'), {
    method: 'DELETE',
    headers: supabaseHeaders()
  });
  const text = await r.text();
  if (!r.ok) {
    let d={}; try {d=JSON.parse(text)} catch(_){}
    throw new Error(d.message || ('Storage HTTP ' + r.status));
  }
}

async function upsertMedia(filename, mime, size) {
  const rows = await supabaseRequest('/rest/v1/media_files?on_conflict=storage_path', {
    method:'POST',
    headers:{'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=representation'},
    body:JSON.stringify([{
      bucket_id:BUCKET,
      storage_path:'fotos/' + filename,
      original_name:filename,
      mime_type:mime,
      size_bytes:size,
      media_type:'image',
      metadata:{source:'dashboard',source_path:'fotos/' + filename}
    }])
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

async function saveGallery(gallery) {
  const normalized = (Array.isArray(gallery) ? gallery : [])
    .map((p,index)=>({
      archivo:String(p.archivo || p.name || '').trim(),
      visible:p.visible !== false,
      orden:Math.max(1,Number(p.orden ?? p.order ?? index+1) || index+1)
    }))
    .filter(p=>p.archivo && !p.archivo.includes('..') && !p.archivo.includes('/') && !p.archivo.includes('\\'))
    .sort((a,b)=>a.orden-b.orden);

  const media = await supabaseRequest('/rest/v1/media_files?select=id,original_name,storage_path&media_type=eq.image');
  const byName = new Map((Array.isArray(media)?media:[]).map(m=>[m.original_name || String(m.storage_path).split('/').pop(),m]));

  for (const p of normalized) {
    const m=byName.get(p.archivo);
    if (!m) continue;
    await supabaseRequest('/rest/v1/gallery_items?on_conflict=media_id', {
      method:'POST',
      headers:{'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({media_id:m.id,visible:p.visible,sort_order:p.orden,updated_at:new Date().toISOString()})
    });
  }
  return {ok:true};
}

async function uploadImage(name, data) {
  const parsed=parseDataUrl(data);
  const filename=safeImageName(name,parsed.mime);
  const path='fotos/'+filename;
  await uploadStorage(path,parsed.bytes,parsed.mime);
  const media=await upsertMedia(filename,parsed.mime,parsed.bytes.length);
  const current=await getGallery();
  const existing=current.find(x=>x.archivo===filename);
  const nextOrder=existing ? existing.orden : current.reduce((m,x)=>Math.max(m,Number(x.orden)||0),0)+1;
  await supabaseRequest('/rest/v1/gallery_items?on_conflict=media_id', {
    method:'POST',
    headers:{'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},
    body:JSON.stringify({media_id:media.id,visible:true,sort_order:nextOrder,updated_at:new Date().toISOString()})
  });
  return {filename,path,url:SUPABASE_URL+'/storage/v1/object/public/'+BUCKET+'/'+path.split('/').map(encodeURIComponent).join('/')};
}

async function deleteImage(name) {
  const filename=safeImageName(name,'image/jpeg');
  const path='fotos/'+filename;
  const rows=await supabaseRequest('/rest/v1/media_files?select=id&storage_path=eq.'+encodeURIComponent(path));
  if(!Array.isArray(rows)||!rows[0]) throw new Error('La fotografía no existe en Supabase.');
  await deleteStorage(path);
  await supabaseRequest('/rest/v1/media_files?id=eq.'+encodeURIComponent(rows[0].id), {
    method:'DELETE',
    headers:{Prefer:'return=minimal'}
  });
  return {filename};
}

module.exports = async (req,res) => {
  res.setHeader('Cache-Control','no-store');
  if(req.method==='OPTIONS') return send(res,204,{});
  if(req.method!=='GET' && req.method!=='POST') return send(res,405,{error:'Método no permitido.'});
  try {
    requireSupabase();
    if(req.method==='GET') {
      const config=await getConfig();
      const gallery=await getGallery();
      return send(res,200,{...config,gallery});
    }
    if(CONFIG_KEY && unauthorized(req)) return send(res,401,{error:'No autorizado.'});
    const body=req.body||{};
    if(body.action==='save-config') return send(res,200,await saveConfig(body.config));
    if(body.action==='save-gallery') return send(res,200,await saveGallery(body.gallery));
    if(body.action==='upload-image') return send(res,200,await uploadImage(body.name,body.data));
    if(body.action==='delete-image') return send(res,200,await deleteImage(body.name));
    return send(res,400,{error:'Acción no reconocida.'});
  } catch(e) {
    return send(res,500,{error:e.message||'Error interno al trabajar con Supabase.'});
  }
};