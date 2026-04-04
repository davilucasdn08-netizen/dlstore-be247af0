const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://hrfyphdygyyjbajhuiuo.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZnlwaGR5Z3l5amJhamh1aXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjkyNjQsImV4cCI6MjA5MDI0NTI2NH0.ncVdTyiRvUJn3O5CBPzspu4RaNRfcQp6_RbB0uHpRWw');

const mapping = {
  "Eletrônicos e Informática": ["teclado mecânico", "mouse gamer", "ssd", "hd externo", "webcam", "impressora", "roteador", "wi-fi", "hub usb"],
  "Computadores e Notebooks": ["notebook gamer", "notebook ultrafino", "pc completo", "placa de vídeo", "memória ram", "cooler", "fonte", "gabinete", "placa-mãe", "dock station", "computador", "notebook", "monitor"],
  "Games e Consoles": ["console", "controle", "headset gamer", "jogo digital", "cadeira gamer", "volante gamer", "mousepad", "óculos vr", "suporte para console", "playstation", "xbox", "nintendo"],
  "Celulares e Smartphones": ["smartphone", "capa", "película", "carregador", "fone bluetooth", "suporte", "power bank", "cabo", "usb", "lente", "ring light", "iphone", "galaxy", "celular"],
  "TV, Áudio e Vídeo": ["smart tv", "tv", "soundbar", "caixa de som", "projetor", "suporte de tv", "fone de ouvido", "home theater", "antena digital", "hdmi", "tv box", "microfone", "headset", "headphone"],
  "Moda Feminina": ["sutiã", "bustiê", "lingerie", "vestido", "saia", "cropped", "macacão", "legging", "babylook", "renda", "maiô", "biquini", "fio dental"],
  "Moda Masculina": ["polo", "cueca", "sunga"],
  "Moda Infantil": ["conjunto", "roupa de bebê", "pijama", "fantasia", "infantil"],
  "Calçados e Tênis": ["tênis", "sandália", "bota", "chinelo", "sapato", "salto", "sapatênis", "rasteirinha", "slip-on"],
  "Bolsas e Acessórios": ["mochila", "bolsa", "carteira", "óculos", "cinto", "nécessaire", "chapéu", "boné", "lenço"],
  "Relógios e Joias": ["relógio", "pulseira", "colar", "anel", "brinco", "smartwatch", "corrente", "pingente", "watch"],
  "Beleza e Cuidados Pessoais": ["perfume", "creme", "maquiagem", "shampoo", "condicionador", "barbeador", "secador", "chapinha", "aparador", "hidratante", "blush", "batom", "kiko", "lancôme", "nivea", "colônia", "sérum", "pincel", "dermatológico", "corretivo", "gloss", "labial"],
  "Saúde e Bem-Estar": ["vitamina", "massageador", "termômetro", "balança", "ortopédico", "medidor de pressão", "suplemento", "óleo", "terapêutica", "whey", "creatina"],
  "Casa e Decoração": ["quadro", "luminária", "lâmpada", "cortina", "tapete", "almofada", "espelho", "vela", "planta", "estante", "mesa", "cadeira", "rodo", "abajur", "difusor"],
  "Eletrodomésticos": ["geladeira", "máquina de lavar", "micro-ondas", "microondas", "aspirador", "ventilador", "ar-condicionado", "ferro de passar", "purificador", "lava-louça", "batedeira", "secadora"],
  "Cozinha e Utilidades": ["air fryer", "fritadeira", "panela", "liquidificador", "utensílio", "organizador", "cafeteira", "garrafa térmica", "garrafa", "faca", "tábua", "mixer", "copo", "xícara", "prato", "talher", "pote", "escorredor", "refratários"],
  "Esportes e Fitness": ["haltere", "yoga", "corda", "roupa fitness", "bicicleta", "luva", "roda abdominal", "esporte", "faixa elástica"],
  "Bebês e Maternidade": ["fralda", "mamadeira", "carrinho", "berço", "chupeta", "babador", "banheira", "monitor bebê"],
  "Livros e Papelaria": ["livro", "caderno", "caneta", "agenda", "lápis", "marcador", "pasta", "post-it", "calculadora"],
  "Pet Shop": ["ração", "pet", "cama", "coleira", "comedouro", "areia", "transportadora", "petisco"],
  "Instrumentos Musicais": ["violão", "guitarra", "teclado", "bateria", "ukulele", "amplificador"],
  "Escritório e Material Escolar": ["papel", "grampeador", "tesoura", "quadro branco", "escritório"]
};

// Remove exact duplicates
// Wait, 'lápis' -> if 'lápis labial' prioritize Beleza.
const PRIORITY = {
  "lápis labial": "Beleza e Cuidados Pessoais",
  "gloss labial": "Beleza e Cuidados Pessoais",
  "controle do brilho": "Beleza e Cuidados Pessoais",
  "máscara de cílios": "Beleza e Cuidados Pessoais",
  "notebook gamer": "Computadores e Notebooks",
  "mouse gamer": "Eletrônicos e Informática",
  "smart tv": "TV, Áudio e Vídeo",
  "armazena": null // avoid matching 'areia'
};

const FEMALE_TERMS = ['feminina', 'feminino', 'mulher'];
const MALE_TERMS = ['masculina', 'masculino', 'homem', 'men'];

function categorize(name, originalCat) {
  let n = name.toLowerCase();

  for (const [kw, priorityCat] of Object.entries(PRIORITY)) {
    if (n.includes(kw) && priorityCat) return priorityCat;
  }

  // Explicit overrides for ambiguous clothing items
  if (n.match(/\b(camisa|calça|jaqueta|moletom|blusa|bermuda|short|camisetas)\b/)) {
    let isFem = FEMALE_TERMS.some(t => n.includes(t));
    let isMasc = MALE_TERMS.some(t => n.includes(t));
    if (isFem) return "Moda Feminina";
    if (isMasc) return "Moda Masculina";
    if (n.includes('camisa') || n.includes('bermuda')) return "Moda Masculina";
    if (n.includes('blusa') || n.includes('short')) return "Moda Feminina";
  }

  // Score based approach
  let scores = {};
  for (const [catName, keywords] of Object.entries(mapping)) {
    for (const kw of keywords) {
      if (new RegExp('\\b' + kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '(s|es)?\\b', 'i').test(n)) {
        scores[catName] = (scores[catName] || 0) + kw.length; // Logest match wins
      }
    }
  }

  let bestCat = null;
  let maxScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCat = cat;
    }
  }

  if (bestCat) return bestCat;

  let valid = [
    "Eletrônicos e Informática","Celulares e Smartphones","Computadores e Notebooks","Games e Consoles",
    "TV, Áudio e Vídeo","Moda Feminina","Moda Masculina","Moda Infantil","Calçados e Tênis",
    "Bolsas e Acessórios","Relógios e Joias","Beleza e Cuidados Pessoais","Saúde e Bem-Estar",
    "Casa e Decoração","Cozinha e Utilidades","Eletrodomésticos","Esportes e Fitness",
    "Bebês e Maternidade","Livros e Papelaria","Pet Shop","Instrumentos Musicais","Escritório e Material Escolar"
  ];

  if (!valid.includes(originalCat)) {
    return 'Eletrônicos e Informática';
  }
  
  return originalCat;
}

async function run() {
  const { data } = await supabase.from('products').select('*');
  let count = 0;
  for (const p of data) {
    const targetCat = categorize(p.name, p.category);
    if (targetCat !== p.category) {
      console.log(`Update [${p.name.substring(0,40)}] | ${p.category} -> ${targetCat}`);
      const res = await supabase.functions.invoke('admin-products', {
        body: { 
            adminCode: 'Dlknunes01#', action: 'update', 
            id: p.id, name: p.name, image_url: p.image_url, 
            affiliate_link: p.affiliate_link, category: targetCat, price: p.price
        }
      });
      if (!res.error) count++;
    }
  }
  console.log('Successfully completed mapping user data! Fixed:', count);
}

run();
