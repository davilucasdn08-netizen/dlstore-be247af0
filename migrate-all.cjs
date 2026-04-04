const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://hrfyphdygyyjbajhuiuo.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZnlwaGR5Z3l5amJhamh1aXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjkyNjQsImV4cCI6MjA5MDI0NTI2NH0.ncVdTyiRvUJn3O5CBPzspu4RaNRfcQp6_RbB0uHpRWw');

const VALID_CATS = [
    "Eletrônicos e Informática", "Celulares e Smartphones", "Computadores e Notebooks", "Games e Consoles",
    "TV, Áudio e Vídeo", "Moda Feminina", "Moda Masculina", "Moda Infantil", "Calçados e Tênis",
    "Bolsas e Acessórios", "Relógios e Joias", "Beleza e Cuidados Pessoais", "Saúde e Bem-Estar",
    "Casa e Decoração", "Cozinha e Utilidades", "Eletrodomésticos", "Ferramentas e Construção",
    "Esportes e Fitness", "Brinquedos e Jogos", "Bebês e Maternidade", "Livros e Papelaria",
    "Pet Shop", "Automotivo", "Jardim e Piscina", "Alimentos e Bebidas", "Instrumentos Musicais",
    "Escritório e Material Escolar"
];

function getSmartCategory(name, currentCat) {
  const n = name.toLowerCase();
  
  if (n.includes('fritadeira') || n.includes('airfryer') || n.includes('secadora') || n.includes('liquidificador') || n.includes('micro-ondas') || n.includes('batedeira') || n.includes('máquina de lavar') || n.includes('aspirador')) return 'Eletrodomésticos';
  if (n.includes('panela') || n.includes('copo') || n.includes('talher') || n.includes('prato') || n.includes('xícara') || n.includes('garrafa') || n.includes('pote') || n.includes('escorredor')) return 'Cozinha e Utilidades';
  if (n.includes('batom') || n.includes('blush') || n.includes('shampoo') || n.includes('maquiagem') || n.includes('perfume') || n.includes('colônia') || n.includes('sérum') || n.includes('pincel') || n.includes('creme') || n.includes('lápis de olho') || n.includes('dermatológico') || n.includes('kiko ') || n.includes('lancôme')) return 'Beleza e Cuidados Pessoais';
  if (n.includes('lâmpada') || n.includes('quadro') || n.includes('cadeira') || n.includes('mesa') || n.includes('cortina') || n.includes('tapete') || n.includes('almofada') || n.includes('rodo')) return 'Casa e Decoração';
  if (n.includes('notebook') || n.includes('computador') || n.includes('teclado') || n.includes('mouse ') || n.includes('monitor') || n.includes('ssd ') || n.includes('pendrive')) return 'Computadores e Notebooks';
  if (n.includes('iphone') || n.includes('smartphone') || n.includes('galaxy') || n.includes('celular') || n.includes('carregador') || n.includes('capa')) return 'Celulares e Smartphones';
  if (n.includes('playstation') || n.includes('xbox') || n.includes('nintendo') || n.includes('jogo para') || n.includes('controle')) return 'Games e Consoles';
  if (n.includes(' tv ') || n.includes('soundbar') || n.includes('fone') || n.includes('caixa de som') || n.includes('headset') || n.includes('microfone')) return 'TV, Áudio e Vídeo';
  if (n.includes('smartwatch') || n.includes('relógio') || n.includes('pulseira') || n.includes('colar') || n.includes('brinco')) return 'Relógios e Joias';
  if (n.includes('sutiã') || n.includes('bustiê') || n.includes('babylook') || n.includes('legging') || n.includes('feminina') || n.includes('feminino') || n.includes('maio')) return 'Moda Feminina';
  if (n.includes('masculin') || n.includes('homem') || n.includes('cueca') || n.includes('camisa polo')) return 'Moda Masculina';
  if (n.includes('tênis') || n.includes('sapato') || n.includes('sandália') || n.includes('chinelo')) return 'Calçados e Tênis';
  if (n.includes('bolsa') || n.includes('mochila') || n.includes('carteira') || n.includes('cinto')) return 'Bolsas e Acessórios';
  if (n.includes('brinquedo') || n.includes('boneca') || n.includes('lego') || n.includes('carrinho')) return 'Brinquedos e Jogos';
  if (n.includes('livro') || n.includes('caderno') || n.includes('caneta ') || n.includes('lápis de cor')) return 'Livros e Papelaria';
  if (n.includes('suplemento') || n.includes('whey') || n.includes('creatina') || n.includes('massageador') || n.includes('balança')) return 'Saúde e Bem-Estar';
  if (n.includes('faixa elástica') || n.includes('roda abdominal') || n.includes('barra fixa') || n.includes('esporte') || n.includes('bola')) return 'Esportes e Fitness';
  if (n.includes('ferramenta') || n.includes('furadeira') || n.includes('chave de fenda') || n.includes('parafusadeira')) return 'Ferramentas e Construção';

  if (!VALID_CATS.includes(currentCat)) {
    return 'Eletrônicos e Informática'; 
  }
  return currentCat;
}

function getRandomRating() {
  const min = 42; // 4.2
  const max = 50; // 5.0
  const random = Math.floor(Math.random() * (max - min + 1)) + min;
  return (random / 10).toString().replace('.', ',');
}

async function run() {
  const { data } = await supabase.from('products').select('*');
  let updatedCount = 0;

  for (const p of data) {
    let targetCat = getSmartCategory(p.name, p.category);
    if (!VALID_CATS.includes(targetCat)) {
        targetCat = 'Eletrônicos e Informática';
    }

    let targetRating = p.rating;
    const isMissingRating = !p.rating || p.rating === '0' || p.rating === '';
    if (isMissingRating) {
        targetRating = getRandomRating();
    }

    const needsUpdate = p.category !== targetCat || isMissingRating;

    if (needsUpdate) {
      console.log(`Update [${p.name.substring(0, 30)}] | Cat: ${p.category}->${targetCat} | Rating: ${p.rating||'N/A'}->${targetRating}`);
      const res = await supabase.functions.invoke('admin-products', {
        body: { 
            adminCode: 'Dlknunes01#', 
            action: 'update', 
            id: p.id, 
            name: p.name, 
            image_url: p.image_url, 
            affiliate_link: p.affiliate_link, 
            category: targetCat, 
            price: p.price,
            rating: targetRating 
        }
      });
      if (res.error) console.log('ERROR:', res.error.message);
      updatedCount++;
    }
  }
  console.log('Total items successfully updated:', updatedCount);
}

run();
