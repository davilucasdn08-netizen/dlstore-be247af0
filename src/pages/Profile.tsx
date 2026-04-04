import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { LogOut, User as UserIcon, ArrowLeft, Loader2, Clock, Heart, Settings, ShieldCheck, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [activeTab, setActiveTab] = useState<"historico" | "favoritos" | "configs">("historico");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    async function fetchRecentlyViewed() {
      if (!user) return;
      const recentIds = user.user_metadata?.recently_viewed || [];
      if (recentIds.length === 0) {
        setProducts([]);
        setLoadingProducts(false);
        return;
      }
      
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", recentIds);

      if (!error && data) {
         const sorted = [...data].sort((a, b) => recentIds.indexOf(b.id) - recentIds.indexOf(a.id));
         setProducts(sorted);
      }
      setLoadingProducts(false);
    }
    
    async function fetchFavorites() {
      if (!user) return;
      const favIds = user.user_metadata?.favorites || [];
      if (favIds.length === 0) {
        setFavoriteProducts([]);
        setLoadingFavorites(false);
        return;
      }
      
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", favIds);

      if (!error && data) {
         const sortedFavs = [...data].sort((a, b) => favIds.indexOf(a.id) - favIds.indexOf(b.id)); // oldest favorited last
         setFavoriteProducts(sortedFavs);
      }
      setLoadingFavorites(false);
    }
    
    if (user) {
      fetchRecentlyViewed();
      fetchFavorites();
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Recente';
  const historyCount = user?.user_metadata?.recently_viewed?.length || 0;
  const favoritesCount = user?.user_metadata?.favorites?.length || 0;

  return (
    <div className="min-h-screen bg-secondary/10 pb-20">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Voltar para a Loja</span>
          </button>
          
          <div className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
            <span className="text-gradient-primary">MEU</span> PERFIL
          </div>
          
          <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-2 font-semibold" onClick={handleLogout}>
            <LogOut size={16} />
            <span className="hidden sm:inline">Desconectar</span>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        
        {/* Banner Premium Header */}
        <div className="relative rounded-3xl overflow-hidden bg-card border border-border/50 shadow-xl">
          {/* Background Gradient */}
          <div className="absolute inset-0 h-32 md:h-48 w-full gradient-primary opacity-90" />
          
          <div className="relative pt-16 md:pt-32 px-6 sm:px-10 pb-8 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
            {/* Avatar Escudo */}
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-card border-4 border-background flex items-center justify-center text-primary shadow-2xl relative z-10 shrink-0">
               <UserIcon size={56} />
               <div className="absolute bottom-1 right-1 bg-green-500 text-background p-1.5 rounded-full border-2 border-background shadow-sm" title="Membro Verificado">
                 <ShieldCheck size={18} />
               </div>
            </div>
            
            {/* User Info */}
            <div className="text-center md:text-left space-y-2 flex-1 pb-2">
               <h1 className="text-3xl md:text-4xl font-black text-foreground drop-shadow-sm">Minha Conta VIP</h1>
               <div className="flex flex-col md:flex-row md:items-center gap-3 text-muted-foreground mt-2">
                 <span className="flex items-center gap-1.5 justify-center md:justify-start">
                   <Mail size={16} className="text-primary/70" />
                   {user?.email}
                 </span>
                 <span className="hidden md:inline text-border">•</span>
                 <span className="flex items-center gap-1.5 justify-center md:justify-start">
                   <Calendar size={16} className="text-primary/70" />
                   Membro desde {joinDate}
                 </span>
               </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4 md:gap-6 pt-4 md:pt-0 md:pb-2">
              <div className="text-center bg-background/50 hover:bg-background/80 transition-colors px-6 py-4 rounded-2xl border border-border/60 shadow-sm">
                <div className="text-3xl font-black text-primary">{historyCount}</div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">Vistos</div>
              </div>
              <div className="text-center bg-background/50 hover:bg-background/80 transition-colors px-6 py-4 rounded-2xl border border-border/60 shadow-sm">
                <div className="text-3xl font-black text-primary">{favoritesCount}</div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">Desejos</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs & Content */}
        <div className="grid md:grid-cols-12 gap-8">
          
          {/* Sidebar Menu */}
          <div className="md:col-span-3 space-y-2">
            <button 
              onClick={() => setActiveTab("historico")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === 'historico' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'}`}
            >
              <Clock size={18} />
              Meu Histórico
            </button>
            <button 
              onClick={() => setActiveTab("favoritos")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === 'favoritos' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'}`}
            >
              <Heart size={18} />
              Meus Favoritos
            </button>
            <button 
              onClick={() => setActiveTab("configs")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === 'configs' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'}`}
            >
              <Settings size={18} />
              Configurações
            </button>
          </div>

          {/* Main Area */}
          <div className="md:col-span-9">
            
            {/* HISTÓRICO TAB */}
            {activeTab === "historico" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Clock className="text-primary" /> Produtos Recentes
                  </h2>
                </div>

                {loadingProducts ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                     {[1, 2, 3].map(i => (
                       <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
                     ))}
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-sm flex flex-col items-center justify-center space-y-4">
                     <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                        <Clock size={32} />
                     </div>
                     <div>
                       <p className="text-foreground font-bold text-lg">Sua prateleira está vazia!</p>
                       <p className="text-muted-foreground mt-1 max-w-sm mx-auto">Você ainda não acessou nenhum detalhe de produto da nossa vitrine.</p>
                     </div>
                     <Button onClick={() => navigate("/")} className="mt-2 gradient-primary rounded-xl" size="lg">Ir para Vitrine</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((p) => (
                      <ProductCard
                        key={p.id}
                        id={p.id}
                        name={p.name}
                        imageUrl={p.image_url}
                        affiliateLink={p.affiliate_link}
                        category={p.category}
                        price={p.price}
                        rating={p.rating}
                        onClickTrack={() => {}} 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FAVORITOS TAB */}
            {activeTab === "favoritos" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Heart className="text-primary" /> Meus Favoritos
                  </h2>
                </div>

                {loadingFavorites ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                     {[1, 2, 3].map(i => (
                       <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
                     ))}
                  </div>
                ) : favoriteProducts.length === 0 ? (
                  <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-sm flex flex-col items-center justify-center space-y-4">
                     <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                        <Heart size={32} />
                     </div>
                     <div>
                       <p className="text-foreground font-bold text-lg">Sem itens salvos!</p>
                       <p className="text-muted-foreground mt-1 max-w-sm mx-auto">Clique no coração de um item na vitrine para guardá-lo aqui.</p>
                     </div>
                     <Button onClick={() => navigate("/")} className="mt-2 gradient-primary rounded-xl" size="lg">Explorar Vitrine</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteProducts.map((p) => (
                      <ProductCard
                        key={p.id}
                        id={p.id}
                        name={p.name}
                        imageUrl={p.image_url}
                        affiliateLink={p.affiliate_link}
                        category={p.category}
                        price={p.price}
                        rating={p.rating}
                        onClickTrack={() => {}} 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CONFIGS TAB */}
            {activeTab === "configs" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="text-primary" /> Configurações Gerais
                  </h2>
                </div>
                <div className="bg-card rounded-3xl border border-border shadow-sm p-6 space-y-6">
                   <div>
                     <h3 className="font-bold mb-1">Email Preferencial</h3>
                     <p className="text-muted-foreground text-sm">{user?.email}</p>
                     <p className="text-xs text-green-500 mt-2 flex items-center gap-1"><ShieldCheck size={12}/> Email seguro e atrelado à sua conta</p>
                   </div>
                   <hr className="border-border" />
                   <div>
                     <h3 className="font-bold mb-1">Notificações e Suporte</h3>
                     <p className="text-muted-foreground text-sm">Quaisquer problemas com redirecionamentos, fale conosco pela aba principal.</p>
                   </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
