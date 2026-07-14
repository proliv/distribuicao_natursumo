// ═══════════════════════════════════════════════════════════
//  NATUR SUMO — Distribuição — Servidor
// ═══════════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const crypto  = require('crypto');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const SESSION_COOKIE = 'natur_sumo_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback_secret_muda_isto';


// ─────────────────────────────────────────────────────────────
//  LISTA DE CLIENTES
//
//  Cada entrada é um array de localizações.
//  1 localização → 1 card    |    2+ localizações → N cards lado a lado
//
//  Campos:
//    nome   → Nome Comercial (aparece em grande no card)
//    fat    → Nome de Faturação (aparece em baixo, mais discreto)
//    lat    → Latitude (decimal)
//    lng    → Longitude (decimal)
//    notas  → Aviso operacional (ex: "Só abre às 8:30h"). Deixa '' se não houver.
// ─────────────────────────────────────────────────────────────
const CLIENTES = {

  "4":     [{ nome: 'BATEIRA CARDOSO E BATEIRA LDA',                  fat: 'BATEIRA CARDOSO E BATEIRA LDA',                        lat: 41.144635217107506,  lng: -8.606326283340753,  notas: '' }],
  "18":    [{ nome: 'Confeitaria Imperio, Lda.',                       fat: 'Confeitaria Imperio, Lda.',                             lat: 41.14764221335715,   lng: -8.607036503194276,  notas: '' }],
  "25":    [{ nome: 'Confeitaria Mengos',                              fat: 'Alves & Bateira Lda',                                   lat: 41.14762248316297,   lng: -8.606693029404743,  notas: '' }],
  "183":   [{ nome: 'Padaria & Conf. St. Alexandrina, Lda.',           fat: 'Padaria & Conf. St. Alexandrina, Lda.',                 lat: 41.15015496336941,   lng: -8.607639982710959,  notas: '' }],
  "445":   [{ nome: 'THE YEATMAN HOTEL, LDA.',                        fat: 'THE YEATMAN HOTEL, LDA.',                               lat: 41.133345016557925,  lng: -8.613010884872237,  notas: '' }],
  "514":   [{ nome: 'MARES DO ATERRO HOTELARIA E SERVIÇOS LDA',       fat: 'MARES DO ATERRO HOTELARIA E SERVIÇOS LDA',              lat: 41.2083807410677,    lng: -8.715321485742065,  notas: '' }],

  "524": [
    { nome: 'Hospital STº António — Bar Refeitório',                   fat: 'MEETING POINT III',                                    lat: 41.147162413239045,  lng: -8.618260803194316,  notas: '' },
    { nome: 'Hospital STº António — Maternidade',                      fat: 'MEETING POINT III',                                    lat: 41.15154,            lng: -8.62472,            notas: '' },
  ],

  "533": [
    { nome: 'Hotel NH Collection Porto Batalha',                       fat: 'Palácio Batalha Hotel - Utilidades Turísticas, Lda',   lat: 41.14504352724424,   lng: -8.606571995619975,  notas: '' },
    { nome: 'Hotel NH Porto Jardim',                                   fat: 'Palácio Batalha Hotel - Utilidades Turísticas, Lda',   lat: 41.143527355395044,  lng: -8.605055739219205,  notas: '' },
  ],

  "534":   [{ nome: 'Porto Palácio Hotel',                             fat: 'Porto Palácio Hotel - Exploração Hoteleira, S.A',      lat: 41.15928560996635,   lng: -8.63881155866134,   notas: '' }],
  "543":   [{ nome: 'HDP PORTO — HOTEIS DE PORTUGAL, SA',             fat: 'HDP PORTO - HOTEIS DE PORTUGAL, SA',                   lat: 41.16122324543131,   lng: -8.640525102615069,  notas: '' }],
  "547":   [{ nome: 'CARRISLAND PORTUGAL .SA',                        fat: 'CARRISLAND PORTUGAL .SA',                              lat: 41.141291526453735,  lng: -8.613518479341497,  notas: '' }],

  "552": [
    { nome: 'MOOV BATALHA',                                            fat: 'ENDUTEX HOTEIS SOC UNIP LDA',                          lat: 41.145718445368644,  lng: -8.606787162483725,  notas: '' },
    { nome: 'MOOV NORTE',                                              fat: 'ENDUTEX HOTEIS SOC UNIP LDA',                          lat: 41.1802619602593,    lng: -8.653041495898378,  notas: '' },
  ],

  "553": [
    { nome: 'Nata Flores',                                             fat: 'Invasão Canela Lda',                                   lat: 41.14491623166881,   lng: -8.611807571679233,  notas: '' },
    { nome: 'Nata Sta. Catarina II',                                   fat: 'Invasão Canela Lda',                                   lat: 41.150619882201156,  lng: -8.605390117728243,  notas: '' },
  ],

  "560":   [{ nome: 'Namorar o Tejo',                                  fat: 'Namorar o Tejo - Atividades hoteleiras unip., Lda',    lat: 41.150045807796594,  lng: -8.620754672144304,  notas: '' }],

  "564": [
    { nome: 'Hospital CUF Porto — PISO 0',                             fat: 'SABORES DAS 7 BICAS - RESTAURAÇÃO LDA',                lat: 41.176230715169616,  lng: -8.669210672378636,  notas: '' },
    { nome: 'Instituto CUF',                                           fat: 'SABORES DAS 7 BICAS - RESTAURAÇÃO LDA',                lat: 41.18179985915705,   lng: -8.6509990032734,    notas: '' },
  ],

  "565":   [{ nome: 'First Class Wine Bar',                            fat: 'First Class Wine Bar',                                 lat: 41.237145703856505,  lng: -8.671554396129244,  notas: '' }],
  "574":   [{ nome: 'Fábrica da Nata',                                 fat: 'Fábrica da Nata',                                      lat: 41.14913871372577,   lng: -8.606168603194229,  notas: '' }],
  "575":   [{ nome: 'Sole Y Stelle Hoteis Lda',                        fat: 'Sole Y Stelle Hoteis Lda',                             lat: 41.14683084577009,   lng: -8.609752079856802,  notas: '' }],
  "576":   [{ nome: 'SOUNDWICH, LDA',                                  fat: 'SOUNDWICH, LDA',                                       lat: 41.170362208303445,  lng: -8.671454915846224,  notas: '' }],

  "582": [
    { nome: 'Hotel Vincci Porto',                                      fat: 'Lusovincci Unipessoal Lda',                            lat: 41.14701615583508,   lng: -8.632260827917747,  notas: '' },
    { nome: 'Hotel Vincci Porto (2ª localização)',                     fat: 'Lusovincci Unipessoal Lda',                            lat: 41.152410394957926,  lng: -8.60821889878248,   notas: '' },
    { nome: 'Hotel Vincci Ponde de Ferro',                             fat: 'Lusovincci Unipessoal Lda',                            lat: 41.13851556970125,   lng: -8.60877006374751,   notas: '' },
    { nome: 'Hotel Vincci Bonjardim',                                  fat: 'Lusovincci Unipessoal Lda',                            lat: 41.15106,            lng: -8.60780,            notas: '' },
  ],

  "591":   [{ nome: 'Hotel Project Porto, Lda',                        fat: 'Hotel Project Porto, Lda',                             lat: 41.16464413932751,   lng: -8.58332241739441,   notas: '' }],
  "606":   [{ nome: 'Confeitaria PETÚLIA',                             fat: 'Ilídio Borges Pinto, Lda',                             lat: 41.155431187300685,  lng: -8.627509117126849,  notas: '' }],
  "611":   [{ nome: 'InterContinental Porto',                          fat: 'Solitaire - Empreendimentos Hoteleiros, SA',            lat: 41.14586945808935,   lng: -8.611541502216335,  notas: '' }],
  "612":   [{ nome: 'Confeitaria Duvália',                             fat: 'Confeitaria Duvália - Borges, Pinto e Ferreira, Lda',  lat: 41.152708434741456,  lng: -8.636264518209796,  notas: '' }],

  "613": [
    { nome: 'Arcádia Boavista',                                        fat: 'Coffe Box Cafetaria S.A',                              lat: 41.18117989647535,   lng: -8.654323832028965,  notas: '' },
    { nome: 'Arcádia Matosinhos',                                      fat: 'Coffe Box Cafetaria S.A',                              lat: 41.176368190066555,  lng: -8.68921180128433,   notas: '' },
    { nome: 'Arcádia Velasquez',                                       fat: 'Coffe Box Cafetaria S.A',                              lat: 41.15921728836315,   lng: -8.636139638292782,  notas: '' },
  ],

  "616":   [{ nome: 'Doce Giesta',                                     fat: 'Receita da Cidade - Unipessoal, Lda',                  lat: 41.15268285377757,   lng: -8.610119732111022,  notas: '' }],
  "619":   [{ nome: 'Pastelaria Aloma',                                fat: 'Gomes & Rocha Lda',                                    lat: 41.125631349369286,  lng: -8.604806359406917,  notas: '' }],
  "624":   [{ nome: 'Hoteis Moon & Sun',                               fat: 'Mesquita de Sousa Hoteis & Resorts, Lda',              lat: 41.14859127059875,   lng: -8.614944712217047,  notas: '' }],
  "630":   [{ nome: 'Fábrica da Nata II',                              fat: 'Fábrica da Nata II',                                   lat: 41.14568597868189,   lng: -8.610898494721036,  notas: '' }],
  "631":   [{ nome: 'Legendary Porto Hotel',                           fat: 'Ermida & CA, Lda',                                     lat: 41.14572912140284,   lng: -8.607414645273542,  notas: '' }],
  "637":   [{ nome: 'DISTINCTABILITY, S.A.',                          fat: 'DISTINCTABILITY, S.A.',                                lat: 41.14380026459314,   lng: -8.614199364969146,  notas: '' }],
  "642":   [{ nome: 'CORAL JASMIM LDA',                               fat: 'CORAL JASMIM LDA',                                     lat: 41.18131429638758,   lng: -8.693549059369326,  notas: '' }],
  "643":   [{ nome: 'LAZY',                                            fat: 'MARE DE SONHO - LDA',                                  lat: 41.149592210969246,  lng: -8.614791373988655,  notas: 'Só abre às 8:30h' }],
  "647":   [{ nome: 'AERO-FOOD - RESTAURAÇÃO LDA',                    fat: 'AERO-FOOD - RESTAURAÇÃO LDA',                          lat: 41.237145703856505,  lng: -8.671554396129244,  notas: '' }],
  "652":   [{ nome: 'HOTEL DOS ARCOS LDA',                            fat: 'HOTEL DOS ARCOS LDA',                                  lat: 41.85104133557573,   lng: -8.417505560104697,  notas: '' }],
  "657":   [{ nome: 'Hotel Eurostars Aliados',                         fat: 'SOCIEDADE HOTELEIRA DA RUA DO CASTILHO UNIPESSOAL',    lat: 41.148928087909326,  lng: -8.611449082619469,  notas: '' }],

  "658": [
    { nome: 'Restaurante Blind — Torel Palace Porto',                  fat: 'DOULATERAL RESTAURAÇÃO, LDA',                         lat: 41.145571545031785,  lng: -8.622743302574111,  notas: '' },
    { nome: 'Hotel Torel Avantgarde — Restaurante Digby',              fat: 'DOULATERAL RESTAURAÇÃO, LDA',                         lat: 41.145187846929126,  lng: -8.605871228559542,  notas: '' },
    { nome: 'Bartolomeu Bistro & Wine',                                fat: 'DOULATERAL RESTAURAÇÃO, LDA',                         lat: 41.1437102611312,    lng: -8.612689694205377,  notas: '' },
  ],

  "659": [
    { nome: 'Pur Oporto Boutique Hotel',                               fat: 'FG ACTA PORTUGAL SOCIEDADE UNIPESSOAL LDA',            lat: 41.15452791179653,   lng: -8.604630406711554,  notas: '' },
    { nome: 'Acta the Clover',                                         fat: 'FG ACTA PORTUGAL SOCIEDADE UNIPESSOAL LDA',            lat: 41.153697145289414,  lng: -8.607026275731814,  notas: '' },
    { nome: 'Acta the Avenue',                                         fat: 'FG ACTA PORTUGAL SOCIEDADE UNIPESSOAL LDA',            lat: 41.151731755121446,  lng: -8.597168299120387,  notas: '' },
  ],

  "661":   [{ nome: 'SERRA LUMINOSA LDA',                             fat: 'SERRA LUMINOSA LDA',                                   lat: 41.15294312100275,   lng: -8.62261304263632,   notas: '' }],
  "664":   [{ nome: 'LQP BAIXA UNIPESSOAL LDA',                       fat: 'LQP BAIXA UNIPESSOAL LDA',                             lat: 41.147722963288174,  lng: -8.61493132341469,   notas: '' }],
  "665":   [{ nome: 'MERCADO BOM SUCESSO',                            fat: 'LQP MBS UNIPESSOAL LDA',                               lat: 41.1554855550289,    lng: -8.629202794971429,  notas: '' }],
  "672":   [{ nome: 'Confeitaria Giesta',                             fat: 'SURPRESA IDEAL LDA',                                   lat: 41.19038180938719,   lng: -8.580048995182205,  notas: '' }],
  "686":   [{ nome: 'HOTEL D.HENRIQUE',                               fat: 'SOC GESTORA INICIATIVAS FINANCEIRAS SOGIN SA',         lat: 41.15226359263881,   lng: -8.607091412366056,  notas: '' }],
  "689":   [{ nome: 'HOTEL CIDADE DE ÉVORA',                          fat: 'HOTEL CIDADE DE ÉVORA, UNIPESSOAL LD',                 lat: 41.44649643120495,   lng: -8.29639619468428,   notas: '' }],
  "708":   [{ nome: 'Caqui Brunch Bar',                               fat: 'FAROL AMBRINO - UNIPESSOAL LDA',                       lat: 41.199428126118285,  lng: -8.710711974355819,  notas: '' }],
  "711":   [{ nome: 'CLEARCODE LDA',                                  fat: 'CLEARCODE LDA',                                        lat: 41.147844515978214,  lng: -8.614921334992854,  notas: '' }],
  "715":   [{ nome: 'POSSIVEL PANORAMA, LDA',                         fat: 'POSSIVEL PANORAMA, LDA',                               lat: 41.17122110199001,   lng: -8.681929167885002,  notas: '' }],
  "718":   [{ nome: 'HOTEL PORTO LAPA',                               fat: 'MERCAN PROPERTIES, S.A.',                              lat: 41.15850314338113,   lng: -8.614334696088868,  notas: '' }],
  "722":   [{ nome: 'HOTEL DAS VIRTUDES',                             fat: 'I.M.E. - IMÓVEIS E EMPREENDIMENTOS HOTELEIROS, S.A.',  lat: 41.14380792090179,   lng: -8.619683625012943,  notas: '' }],
  "725":   [{ nome: 'The House Of Sandeman',                          fat: 'INDEPENDENTE HOTELS, S.A.',                            lat: 41.13764897537281,   lng: -8.612399908197867,  notas: '' }],
  "729":   [{ nome: 'LQP BOLHÃO UNIPESSOAL LDA',                      fat: 'LQP BOLHÃO UNIPESSOAL LDA',                            lat: 41.1493820387825,    lng: -8.607123476404336,  notas: '' }],
  "755":   [{ nome: 'PHOENIX OPT OPERATIONS UNIPESSOAL LDA',          fat: 'PHOENIX OPT OPERATIONS UNIPESSOAL LDA',                lat: 41.15369830128906,   lng: -8.60808059064799,   notas: '' }],
  "756":   [{ nome: 'BOLHÃO AGOSTO',                                  fat: 'BATEIRA E FILHOS LDA',                                 lat: 41.1493820387825,    lng: -8.607123476404336,  notas: '' }],
  "758":   [{ nome: 'HOLY ANGELS, INVESTMENT PARTNERSHIP, S.A.',      fat: 'HOLY ANGELS, INVESTMENT PARTNERSHIP, S.A.',            lat: 41.552578985902535,  lng: -8.404984400316419,  notas: '' }],
  "763":   [{ nome: 'PONTO 2',                                        fat: 'SONIA LERMA UNIPESSOAL LDA',                           lat: 41.16069970849237,   lng: -8.628072303761606,  notas: '' }],
  "768":   [{ nome: 'TROCA CERTA LDA',                                fat: 'TROCA CERTA LDA',                                      lat: 41.1520371589841,    lng: -8.677593900195328,  notas: '' }],
  "769":   [{ nome: 'BessaHotel Boavista',                            fat: 'BessaHotel Boavista',                                  lat: 41.16236965822079,   lng: -8.644997782383529,  notas: '' }],
  "774":   [{ nome: 'Rodrigues, Costa & Pereira, Lda',                fat: 'Rodrigues, Costa & Pereira, Lda',                      lat: 41.1493820387825,    lng: -8.607123476404336,  notas: '' }],
  "779":   [{ nome: '7 Gaia Roaster Apartments Lda',                  fat: '7 Gaia Roaster Apartments Lda',                        lat: 41.136960372741825,  lng: -8.613912559667163,  notas: '' }],


  "512": [
    { nome: 'Escolas Fontes Pereira de Melo',                          fat: 'Agrupamento de Escolas Fontes Pereira de Melo',        lat: 41.16410911137412,   lng: -8.643245926728076,  notas: '' },
    { nome: 'Escola M. Lamas',                                         fat: 'Agrupamento de Escolas Fontes Pereira de Melo',        lat: 41.16980968785941,   lng: -8.63342871724944,   notas: '' },
  ],

  // ── Novos clientes adicionados ──────────────────────────────
  "474":   [{ nome: 'Hospital Pedro Hispano',                          fat: 'Meeting Point II',                                     lat: 41.18176633626702,   lng: -8.662729636264036,  notas: '' }],
  "626":   [{ nome: 'Verdade Café',                                    fat: 'Maison Gourmet',                                       lat: 41.18041123333308,   lng: -8.604160578235815,  notas: '' }],
  "674":   [{ nome: 'Sheraton Matosinhos',                             fat: 'MERCAN PROPERTIES, S.A. - Mercan Properties',          lat: 41.17647845955644,   lng: -8.688490032694451,  notas: '' }],
  "761":   [{ nome: 'Mercan Properties-Hotel Origine Porto Gaia',      fat: 'MERCAN PROPERTY PANORAMIC, LDA',                       lat: 41.13701924885161,   lng: -8.611026215877402,  notas: '' }],
  "566":   [{ nome: 'Exe Almada Porto',                                fat: 'Sociedade Hoteleira da Rua do Rosário Lda',            lat: 41.15014586146454,   lng: -8.612197992412966,  notas: '' }],

};
// ─────────────────────────────────────────────────────────────


// ── Middlewares ───────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


function toBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signValue(value) {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(value)
    .digest('base64url');
}

function createSessionToken(username) {
  const payload = JSON.stringify({
    sub: username,
    exp: Date.now() + SESSION_TTL_MS
  });
  const encodedPayload = toBase64Url(payload);
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token) {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const expectedSignature = signValue(encodedPayload);

  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedSignatureBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce((cookies, entry) => {
    const separatorIndex = entry.indexOf('=');
    if (separatorIndex === -1) return cookies;

    const key = entry.slice(0, separatorIndex).trim();
    const value = entry.slice(separatorIndex + 1).trim();
    cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function buildSessionCookie(token, maxAgeMs) {
  const attributes = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAgeMs / 1000))}`
  ];

  if (process.env.NODE_ENV === 'production') {
    attributes.push('Secure');
  }

  return attributes.join('; ');
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', buildSessionCookie('', 0));
}

function readSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[SESSION_COOKIE]);
}


// ── Proteger rotas ────────────────────────────────────────────
function requireLogin(req, res, next) {
  const sessionData = readSession(req);
  if (sessionData) {
    req.auth = sessionData;
    return next();
  }
  res.redirect('/');
}


// ── Rota principal ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// ── API: Login ────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === process.env.LOGIN_USER && pass === process.env.LOGIN_PASS) {
    const token = createSessionToken(user);
    res.setHeader('Set-Cookie', buildSessionCookie(token, SESSION_TTL_MS));
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, erro: 'Credenciais incorretas.' });
});


// ── API: Logout ───────────────────────────────────────────────
app.post('/api/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});


// ── API: Verificar sessão ─────────────────────────────────────
app.get('/api/sessao', (req, res) => {
  res.json({ loggedIn: !!readSession(req) });
});


// ── API: Pesquisar cliente ────────────────────────────────────
// Usa query param ?nr=XXX para suportar números como "512/1"
app.get('/api/cliente', requireLogin, (req, res) => {
  const nr = (req.query.nr || '').trim();

  if (!nr) {
    return res.status(400).json({ ok: false, erro: 'Parâmetro nr em falta.' });
  }

  const locais = CLIENTES[nr];

  if (!locais) {
    return res.status(404).json({ ok: false, erro: `Cliente nº ${nr} não encontrado.` });
  }

  return res.json({ ok: true, numero: nr, locais });
});


module.exports = app;

// ── Iniciar servidor ──────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n✅  Natur Sumo — Distribuição a correr em http://localhost:${PORT}\n`);
  });
}
