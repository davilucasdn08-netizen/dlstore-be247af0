import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ExternalLink, Star, ShieldCheck, Truck, Package, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isUpdatingFav, setIsUpdatingFav] = useState(false);

  useEffect(() => {
    async function getProduct() {
      if (!id) return;
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (!error && data) {
        setProduct(data);
        // Save to recently viewed on page load && Sync favorite state
        if (user) {
          const currentHistory = user.user_metadata?.recently_viewed || [];
          const newHistory = [id, ...currentHistory.filter((i: string) => i !== id)].slice(0, 50);
          supabase.auth.updateUser({ data: { recently_viewed: newHistory } }).catch(() => {});
          
          const favs = user.user_metadata?.favorites || [];
          setIsFavorite(favs.includes(id));
        }
      } else {
        navigate("/");
      }
      setLoading(false);
    }
    getProduct();
  }, [id, navigate, user]);

  const handleAmazonRedirect = async () => {
    if (!product) return;
    
    // Track clicks on database
    try {
      await supabase.rpc("increment_product_clicks" as any, { product_id: product.id });
    } catch(e) {
      // silently fail
    }

    // Go to Amazon
    window.open(product.affiliate_link, "_blank", "noopener,noreferrer");
  };

  const toggleFavorite = async () => {
    if (!user || !id || isUpdatingFav) return;

    setIsUpdatingFav(true);
    const favs = user.user_metadata?.favorites || [];
    let newFavs;
    if (isFavorite) {
      newFavs = favs.filter((fId: string) => fId !== id);
      toast.success("Removido dos favoritos!");
    } else {
      newFavs = [id, ...favs].slice(0, 100);
      toast.success("Adicionado aos favoritos!");
    }

    setIsFavorite(!isFavorite); // optimistic update

    const { error } = await supabase.auth.updateUser({
      data: { favorites: newFavs }
    });

    if (error) {
      setIsFavorite(isFavorite); // revert on error
      toast.error("Erro ao salvar favorito.");
    }
    setIsUpdatingFav(false);
  };

  const getProductDescription = (id: string, cat: string) => {
    // Dynamically access the imported static JSON
    import("@/data/descriptions.json").then((module) => {
       const descriptions: Record<string, string> = module.default;
       setProduct(prev => prev ? { ...prev, fetchedDescription: descriptions[id] } : prev);
    }).catch(() => {});
    
    // Fallback if not loaded yet or not found
    return product.fetchedDescription || `Aproveite toda a qualidade superior deste item seleto da nossa seção de ${cat}. Desenvolvido sob rígidas normas de mercado e avaliado positivamente, este produto destaca-se como sendo um dos queridinhos favoritos do nosso acervo.\n\nGarantimos redirecionamento limpo para as plataformas oficiais. Disponibilidade e preço podem variar.`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
          <div className="container mx-auto px-4 h-16 flex items-center">
             <Skeleton className="w-32 h-6" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
           <div className="grid md:grid-cols-2 gap-8 md:gap-12">
             <Skeleton className="aspect-square rounded-2xl" />
             <div className="space-y-4 pt-4">
               <Skeleton className="h-10 w-full mb-4" />
               <Skeleton className="h-6 w-32" />
               <Skeleton className="h-8 w-40" />
               <Skeleton className="h-40 w-full mt-8" />
             </div>
           </div>
        </main>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors max-w-[70%]"
          >
            <ArrowLeft size={20} className="shrink-0" />
            <span className="font-medium truncate hidden sm:block">Voltar</span>
          </button>
          
          <div className="text-xl font-black tracking-tight cursor-pointer" onClick={() => navigate('/')}>
             <span className="text-gradient-primary">DL</span>
             <span className="text-foreground">STORE</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-10">
         <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-start">
            
            {/* Image Block */}
            <div className="relative aspect-square bg-white rounded-3xl border border-border overflow-hidden flex items-center justify-center p-6 group">
               <img 
                 src={product.image_url} 
                 alt={product.name}
                 className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
               />
            </div>

            {/* Info Block */}
            <div className="flex flex-col space-y-6">
              <div className="flex flex-col items-start gap-4">
                 <div className="bg-secondary px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-muted-foreground border border-border inline-block">
                   {product.category}
                 </div>
                 <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight">
                   {product.name}
                 </h1>
              </div>

              {product.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400">
                    <Star size={18} className="fill-current" />
                  </div>
                  <span className="text-lg font-medium text-foreground">{product.rating}</span>
                </div>
              )}

              <div className="pt-2">
                <span className="text-sm text-primary uppercase font-bold tracking-wider mb-1 block">Preço Oficial Agregado</span>
                <div className="flex items-center gap-4">
                  <p className="text-4xl md:text-5xl font-black text-foreground">
                    R$ <span className="text-gradient-primary">{formatPrice(product.price)}</span>
                  </p>
                  {user && (
                    <button
                      onClick={toggleFavorite}
                      disabled={isUpdatingFav}
                      className="p-3 bg-secondary rounded-full hover:bg-secondary/80 border border-border shadow-sm transition-all hover:scale-105"
                      title="Salvar nos Favoritos"
                    >
                      <Heart size={28} className={isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">Você garante as melhores condições diretamente na plataforma associada.</p>
              </div>

              {/* Action Button */}
              <div className="pt-6 pb-8 border-b border-border">
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg gradient-primary gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  onClick={handleAmazonRedirect}
                >
                  <ExternalLink size={20} />
                  Acessar e Comprar na Amazon
                </Button>
                
                <div className="grid grid-cols-3 gap-2 mt-6">
                   <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground bg-secondary/50 p-3 rounded-xl border border-border/50">
                      <Truck size={20} />
                      <span className="text-[10px] uppercase font-bold text-center">Entrega Prime</span>
                   </div>
                   <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground bg-secondary/50 p-3 rounded-xl border border-border/50">
                      <ShieldCheck size={20} />
                      <span className="text-[10px] uppercase font-bold text-center">Compra Segura</span>
                   </div>
                   <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground bg-secondary/50 p-3 rounded-xl border border-border/50">
                      <Package size={20} />
                      <span className="text-[10px] uppercase font-bold text-center">Original</span>
                   </div>
                </div>
              </div>

              {/* Details Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">Sobre este item</h3>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {getProductDescription(product.id, product.category)}
                </p>
              </div>

            </div>
         </div>
      </main>
    </div>
  );
}
