const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://hrfyphdygyyjbajhuiuo.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZnlwaGR5Z3l5amJhamh1aXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjkyNjQsImV4cCI6MjA5MDI0NTI2NH0.ncVdTyiRvUJn3O5CBPzspu4RaNRfcQp6_RbB0uHpRWw');

function getRandomRating() {
  const min = 42; const max = 50;
  return ((Math.floor(Math.random() * (max - min + 1)) + min) / 10).toString().replace('.', ',');
}

async function forceFix() {
  const { data } = await supabase.from('products').select('*');
  const missing = data.filter(d => !d.rating || d.rating.trim() === '' || Number(d.rating) === 0 || d.rating === '0');
  
  console.log(`Found ${missing.length} items missing ratings. Forcing recreate...`);

  let c = 0;
  for (const p of missing) {
    const newRating = getRandomRating();
    
    // 1. Insert new exact copy with rating
    const insertRes = await supabase.functions.invoke('admin-products', {
      body: { 
        adminCode: 'Dlknunes01#', action: 'insert', 
        name: p.name, image_url: p.image_url, affiliate_link: p.affiliate_link, 
        category: p.category, price: p.price, rating: newRating 
      }
    });

    if (insertRes.error) {
      console.log('Insert Error:', insertRes.error);
      continue;
    }

    // 2. Delete old one
    const delRes = await supabase.functions.invoke('admin-products', {
      body: { adminCode: 'Dlknunes01#', action: 'delete', id: p.id }
    });

    if (delRes.error) {
      console.log('Delete Error on old item:', p.id, delRes.error);
    } else {
      c++;
    }
  }
  
  console.log(`Recreated ${c} items successfully with notes!`);
}

forceFix();
