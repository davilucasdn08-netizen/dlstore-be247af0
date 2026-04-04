const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://hrfyphdygyyjbajhuiuo.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZnlwaGR5Z3l5amJhamh1aXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjkyNjQsImV4cCI6MjA5MDI0NTI2NH0.ncVdTyiRvUJn3O5CBPzspu4RaNRfcQp6_RbB0uHpRWw');

function getCategory(name, currentCat) {
  const n = name.toLowerCase();
  if (n.includes('smartwatch')) return 'Relógios e Joias';
  if (n.includes('perfume') || n.includes('colônia') || n.includes('malbec') || n.includes('uomini') || n.includes('homem essence')) return 'Beleza e Cuidados Pessoais';
  
  if (n.includes('masculin') || n.includes('cueca') || n.includes('homem sagaz')) return 'Moda Masculina';
  if (n.includes('feminin') || n.includes('sutiã') || n.includes('bustiê') || n.includes('babylook') || n.includes('legging')) return 'Moda Feminina';
  
  if (currentCat === 'Moda e Acessórios') {
    // If it's still 'Moda e Acessórios' and couldn't resolve, default to Moda Masculina which is most of the unclassified shirts here
    return 'Moda Masculina';
  }
  
  return currentCat;
}

async function fix() {
  const { data } = await supabase.from('products').select('*');
  let updatedCount = 0;
  for (const p of data) {
    const newCat = getCategory(p.name, p.category);
    const validCats = [
      "Eletrônicos e Informática", "Celulares e Smartphones", "Computadores e Notebooks", "Games e Consoles",
      "TV, Áudio e Vídeo", "Moda Feminina", "Moda Masculina", "Moda Infantil", "Calçados e Tênis",
      "Bolsas e Acessórios", "Relógios e Joias", "Beleza e Cuidados Pessoais", "Saúde e Bem-Estar",
      "Casa e Decoração", "Cozinha e Utilidades", "Eletrodomésticos", "Ferramentas e Construção",
      "Esportes e Fitness", "Brinquedos e Jogos", "Bebês e Maternidade", "Livros e Papelaria",
      "Pet Shop", "Automotivo", "Jardim e Piscina", "Alimentos e Bebidas", "Instrumentos Musicais",
      "Escritório e Material Escolar"
    ];
    
    let targetCat = newCat;
    if (!validCats.includes(newCat)) {
        targetCat = 'Moda Masculina';
    }

    if (p.category !== targetCat) {
      console.log(`Update: [${p.name.substring(0, 30)}] from '${p.category}' to '${targetCat}'`);
      const res = await supabase.functions.invoke('admin-products', {
        body: { adminCode: 'Dlknunes01#', action: 'update', id: p.id, name: p.name, image_url: p.image_url, affiliate_link: p.affiliate_link, category: targetCat, price: p.price }
      });
      if (res.error) console.log('ERROR:', res.error);
      updatedCount++;
    }
  }
  console.log('Total items updated:', updatedCount);
}
fix();
