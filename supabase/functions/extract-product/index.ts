import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BodySchema = z.object({
  url: z.string().url().max(2000),
});

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:127.0) Gecko/20100101 Firefox/127.0',
];

function isCaptchaOrBlocked(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    lower.includes('captcha') ||
    lower.includes('robot') ||
    lower.includes('automated access') ||
    lower.includes('api-services-support@amazon') ||
    lower.includes('type the characters you see') ||
    (lower.includes('sorry') && lower.includes('not a robot')) ||
    (html.length < 5000 && !lower.includes('productTitle') && !lower.includes('og:title'))
  );
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const ua = USER_AGENTS[attempt % USER_AGENTS.length];
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Chromium";v="126", "Google Chrome";v="126", "Not-A.Brand";v="8"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}`);
        await response.text(); // consume body
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        break;
      }

      const html = await response.text();

      if (isCaptchaOrBlocked(html)) {
        console.log(`Attempt ${attempt + 1}: CAPTCHA/block detected, retrying...`);
        lastError = new Error('CAPTCHA detected');
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
          continue;
        }
        // On last attempt, return whatever we got
        return html;
      }

      return html;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Failed after retries');
}

function normalizeBRPrice(raw: string): string {
  let p = raw.trim().replace(/[R$\s\u00a0]/g, '');
  if (!p) return '';
  
  if (p.includes('.') && p.includes(',')) return p;
  if (/,\d{2}$/.test(p) && !p.includes('.')) return p;
  if (/\.\d{2}$/.test(p) && !p.includes(',')) {
    const parts = p.split('.');
    if (parts[0].length > 3) {
      const num = parseFloat(p);
      return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return p.replace('.', ',');
  }
  if (/^\d+$/.test(p) && p.length > 0) {
    const num = parseInt(p);
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return p;
}

function extractPrice(html: string): string {
  // Amazon-specific: combine whole + fraction (most accurate)
  const wholeMatch = html.match(/class="a-price-whole"[^>]*>([^<]+)</);
  const fractionMatch = html.match(/class="a-price-fraction"[^>]*>([^<]+)</);
  if (wholeMatch?.[1]) {
    const whole = wholeMatch[1].trim().replace(/[^\d.]/g, '');
    const fraction = fractionMatch?.[1]?.trim().replace(/[^\d]/g, '') || '00';
    if (whole) return `${whole},${fraction}`;
  }

  // a-offscreen contains full price like "R$ 1.299,00"
  const offscreen = html.match(/class="a-offscreen"[^>]*>([^<]+)</);
  if (offscreen?.[1]) {
    const p = normalizeBRPrice(offscreen[1]);
    if (p) return p;
  }

  // Try structured data - look for price with cents
  const jsonLdPrice = html.match(/"price"\s*:\s*"?(\d+[\d.,]*\d*)"?/);
  if (jsonLdPrice?.[1]) {
    return normalizeBRPrice(jsonLdPrice[1]);
  }

  // Generic R$ pattern with cents
  const brFull = html.match(/R\$\s*([\d.]+,\d{2})/);
  if (brFull?.[1]) return normalizeBRPrice(brFull[1]);

  // R$ without comma
  const brSimple = html.match(/R\$\s*([\d.,]+)/);
  if (brSimple?.[1]) return normalizeBRPrice(brSimple[1]);

  // Fallback patterns
  const fallbacks = [
    /id="priceblock_ourprice"[^>]*>([^<]+)</,
    /id="priceblock_dealprice"[^>]*>([^<]+)</,
    /data-a-color="price"[^>]*>.*?<span[^>]*>([^<]+)</s,
  ];
  for (const pattern of fallbacks) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const p = normalizeBRPrice(match[1]);
      if (p) return p;
    }
  }
  return "";
}

function extractRating(html: string): string {
  const amazonRating = html.match(/class="a-icon-alt"[^>]*>([0-9.,]+)\s*(de|out of)\s*5/);
  if (amazonRating?.[1]) return amazonRating[1].replace('.', ',');

  const jsonLdRating = html.match(/"ratingValue"\s*:\s*"?([0-9.,]+)"?/);
  if (jsonLdRating?.[1]) return jsonLdRating[1].replace('.', ',');

  const metaRating = html.match(/itemprop="ratingValue"\s+content="([^"]+)"/);
  if (metaRating?.[1]) return metaRating[1].replace('.', ',');

  return "";
}

function extractTitle(html: string): string {
  const patterns = [
    /id="productTitle"[^>]*>\s*([^<]+)/,
    /id="title"[^>]*>\s*([^<]+)/,
    /property="og:title"\s+content="([^"]+)"/,
    /name="og:title"\s+content="([^"]+)"/,
    /name="title"\s+content="([^"]+)"/,
    /<title[^>]*>([^<]+)</,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      let title = match[1].trim();
      title = title.replace(/\s*[-|]\s*Amazon.*$/i, '').trim();
      // Skip if title is just the domain name
      if (title.length > 2 && !title.match(/^(amazon\.com|amazon\.com\.br|www\.)$/i)) return title;
    }
  }
  return "";
}

function extractImage(html: string): string {
  const patterns = [
    /id="landingImage"[^>]*src="([^"]+)"/,
    /id="imgBlkFront"[^>]*src="([^"]+)"/,
    /data-old-hires="([^"]+)"/,
    /"hiRes"\s*:\s*"([^"]+)"/,
    /"large"\s*:\s*"([^"]+)"/,
    /property="og:image"\s+content="([^"]+)"/,
    /name="og:image"\s+content="([^"]+)"/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1] && match[1].startsWith('http')) {
      return match[1];
    }
  }
  return "";
}

function guessCategory(title: string, html: string): string {
  const lower = title.toLowerCase();
  
  const breadcrumb = html.match(/class="a-link-normal a-color-tertiary"[^>]*>\s*([^<]+)/);
  const amazonCat = breadcrumb?.[1]?.trim().toLowerCase() || '';
  
  const department = html.match(/id="nav-subnav"[^>]*data-category="([^"]+)"/);
  const deptVal = department?.[1]?.toLowerCase() || '';
  
  const schemaCat = html.match(/"category"\s*:\s*"([^"]+)"/);
  const schemaVal = schemaCat?.[1]?.toLowerCase() || '';

  const allContext = `${lower} ${amazonCat} ${deptVal} ${schemaVal}`;

  const categories: Record<string, string[]> = {
    "Celulares e Smartphones": [
      "celular", "smartphone", "iphone", "samsung galaxy", "motorola", "xiaomi",
      "redmi", "poco", "realme", "phone", "telefone",
    ],
    "Computadores e Notebooks": [
      "notebook", "laptop", "computador", "pc gamer", "desktop", "chromebook",
      "macbook", "all in one", "workstation",
    ],
    "Games e Consoles": [
      "console", "playstation", "ps5", "ps4", "xbox", "nintendo", "switch",
      "gaming", "gamer", "joystick", "controle gamer", "headset gamer",
    ],
    "TV, Áudio e Vídeo": [
      "tv", "televisão", "televisao", "smart tv", "soundbar", "home theater",
      "projetor", "caixa de som", "speaker", "fone de ouvido", "headphone",
      "earbuds", "airpods", "echo", "alexa",
    ],
    "Eletrônicos e Informática": [
      "mouse", "teclado", "monitor", "tablet", "kindle", "câmera", "camera",
      "carregador", "cabo", "usb", "bluetooth", "ssd", "hd", "memória", "memoria",
      "placa", "processador", "gpu", "cpu", "impressora", "printer", "pendrive",
      "roteador", "router", "webcam", "microfone", "drone", "gopro",
      "fonte", "gabinete", "cooler", "adaptador", "hub", "eletrônico", "eletronico",
      "electronics", "informática", "informatica", "wireless", "wi-fi", "wifi",
      "lâmpada inteligente", "smart", "automação",
    ],
    "Moda Feminina": [
      "feminino", "feminina", "vestido", "saia", "blusa feminina", "legging",
      "sutiã", "sutia", "lingerie", "biquíni", "biquini", "maiô", "maio",
      "body", "cropped", "top feminino", "bustiê", "babylook",
    ],
    "Moda Masculina": [
      "masculino", "masculina", "camisa", "camiseta", "calça", "calca",
      "bermuda", "short", "cueca", "regata", "polo", "blazer masculino",
      "terno", "gravata", "social masculino",
    ],
    "Moda Infantil": [
      "infantil", "criança", "crianca", "bebê", "bebe", "kids", "baby",
      "roupa infantil",
    ],
    "Calçados e Tênis": [
      "tênis", "tenis", "sapato", "bota", "sandália", "sandalia", "chinelo",
      "sapatilha", "scarpin", "slip on", "sneaker", "calçado", "calcado",
      "peep toe", "tamanco", "rasteirinha",
    ],
    "Bolsas e Acessórios": [
      "bolsa", "mochila", "carteira", "óculos", "oculos", "chapéu", "chapeu",
      "boné", "bone", "cinto", "lenço", "lenco", "cachecol", "luva", "meias",
      "meia", "pulseira", "acessório",
    ],
    "Relógios e Joias": [
      "relógio", "relogio", "anel", "brinco", "colar", "joia", "jewelry",
      "smartwatch", "apple watch", "garmin", "casio",
    ],
    "Beleza e Cuidados Pessoais": [
      "shampoo", "condicionador", "creme", "perfume", "maquiagem", "batom",
      "protetor solar", "desodorante", "hidratante", "sabonete", "esmalte",
      "beauty", "cosmetics", "skincare", "máscara", "mascara", "rímel", "rimel",
      "corretivo", "blush", "iluminador", "demaquilante", "sérum", "serum",
      "colônia", "colonia", "eau de toilette", "body splash", "loção", "locao",
      "depilador", "barbeador", "cabelo", "hair", "tintura", "chapinha",
      "babyliss", "gloss", "labial", "kiko", "natura", "boticário", "boticario",
      "base", "pó compacto",
    ],
    "Saúde e Bem-Estar": [
      "vitamina", "suplemento", "whey", "creatina", "colágeno", "termogênico",
      "massageador", "oxímetro", "termômetro", "nebulizador", "balança",
      "medidor de pressão", "saúde", "saude", "bem-estar",
    ],
    "Casa e Decoração": [
      "sofá", "sofa", "mesa", "cadeira", "cama", "travesseiro", "lençol", "lencol",
      "cortina", "tapete", "luminária", "luminaria", "vaso", "almofada",
      "colchão", "colchao", "edredom", "cobertor", "toalha", "espelho", "quadro",
      "abajur", "porta-retrato", "estante", "prateleira", "organizador",
      "home", "furniture", "decoração",
    ],
    "Cozinha e Utilidades": [
      "panela", "frigideira", "air fryer", "airfryer", "fritadeira",
      "liquidificador", "cafeteira", "torradeira", "batedeira", "mixer",
      "forno", "grill", "churrasqueira", "espremedor", "talheres",
      "copo", "xícara", "prato", "jarra", "garrafa térmica", "tábua", "tabua",
      "jogo americano", "aparelho de jantar", "cuscuzeira", "kitchen",
    ],
    "Eletrodomésticos": [
      "geladeira", "fogão", "fogao", "microondas", "máquina de lavar",
      "secadora", "lava-louça", "aspirador", "ventilador", "ar condicionado",
      "aquecedor", "umidificador", "ferro de passar", "purificador",
      "eletrodoméstico",
    ],
    "Ferramentas e Construção": [
      "furadeira", "parafusadeira", "serra", "alicate", "chave", "martelo",
      "ferramenta", "construção", "construcao", "tinta", "pincel", "broca",
      "nível", "trena", "fita isolante", "tools",
    ],
    "Esportes e Fitness": [
      "esporte", "fitness", "academia", "musculação", "treino", "corrida",
      "bicicleta", "bike", "esteira", "haltere", "elástico", "yoga",
      "futebol", "basquete", "vôlei", "natação", "camping", "barraca",
      "mochila esportiva", "garrafa esportiva", "sports",
    ],
    "Brinquedos e Jogos": [
      "brinquedo", "boneca", "boneco", "lego", "puzzle", "quebra-cabeça",
      "jogo de tabuleiro", "pelúcia", "toys", "nerf", "hot wheels",
    ],
    "Bebês e Maternidade": [
      "fralda", "pampers", "mamadeira", "chupeta", "carrinho de bebê",
      "berço", "amamentação", "gestante", "maternidade", "enxoval",
    ],
    "Livros e Papelaria": [
      "livro", "book", "caderno", "caneta", "lápis", "agenda", "papelaria",
      "marcador", "adesivo", "planner",
    ],
    "Pet Shop": [
      "pet", "ração", "racao", "cachorro", "gato", "coleira", "brinquedo pet",
      "caminha pet", "aquário", "aquario", "petisco",
    ],
    "Automotivo": [
      "carro", "automotivo", "automotive", "pneu", "volante", "GPS",
      "suporte veicular", "câmera de ré", "som automotivo", "tapete carro",
    ],
    "Jardim e Piscina": [
      "jardim", "garden", "piscina", "mangueira", "cortador de grama",
      "vaso de planta", "adubo", "semente", "rede", "espreguiçadeira",
    ],
    "Alimentos e Bebidas": [
      "café", "cafe", "chá", "cha", "chocolate", "biscoito", "alimento",
      "bebida", "vinho", "cerveja", "azeite", "tempero", "condimento",
    ],
    "Instrumentos Musicais": [
      "violão", "violao", "guitarra", "teclado musical", "bateria musical",
      "ukulele", "microfone musical", "amplificador", "pedal", "instrumento",
    ],
    "Escritório e Material Escolar": [
      "escritório", "escritorio", "office", "escolar", "mochila escolar",
      "calculadora", "grampeador", "pasta", "arquivo", "etiqueta",
    ],
  };

  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(k => allContext.includes(k))) return cat;
  }
  return "Eletrônicos e Informática";
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'URL inválida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { url } = parsed.data;

    let html: string;
    try {
      html = await fetchWithRetry(url);
    } catch (e) {
      console.error('Fetch failed after retries:', e);
      return new Response(JSON.stringify({ error: 'Não foi possível acessar o link após várias tentativas' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const name = extractTitle(html);
    const imageUrl = extractImage(html);
    const price = extractPrice(html);
    const category = guessCategory(name, html);
    const rating = extractRating(html);

    // If we couldn't extract a name, the page was likely blocked
    if (!name) {
      console.error('Could not extract product name. HTML length:', html.length);
      return new Response(JSON.stringify({ 
        error: 'Não foi possível extrair os dados. O site pode ter bloqueado o acesso.',
        success: false,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: { name, imageUrl, price, category, rating },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error extracting product:', error);
    return new Response(JSON.stringify({ error: 'Erro ao extrair dados do produto' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
