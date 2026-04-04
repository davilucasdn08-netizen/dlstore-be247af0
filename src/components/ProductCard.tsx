import { useNavigate } from "react-router-dom";
import { ExternalLink, Star, Heart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface ProductCardProps {
  id?: string;
  name: string;
  imageUrl: string;
  affiliateLink: string;
  category: string;
  price?: string;
  rating?: string;
  onClickTrack: () => void;
}

const ProductCard = ({ id, name, imageUrl, affiliateLink, category, price, rating, onClickTrack }: ProductCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user && id) {
      const favs = user.user_metadata?.favorites || [];
      setIsFavorite(favs.includes(id));
    }
  }, [user, id]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id || isUpdating) return;

    setIsUpdating(true);
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
    setIsUpdating(false);
  };

  const handleBuy = async () => {
    // Only go to product details page!
    if (id) {
       navigate(`/produto/${id}`);
    } else {
       // fallback for preview nodes inside admin panel
       window.open(affiliateLink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-colors group flex flex-col">
      <div 
         className="aspect-square overflow-hidden bg-secondary cursor-pointer relative"
         onClick={handleBuy}
      >
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 flex flex-col flex-1">
        <h3 className="font-semibold text-foreground line-clamp-2 text-sm sm:text-base leading-tight" title={name}>{name}</h3>
        <span className="inline-block text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-category-badge/20 text-category-badge-foreground">
          {category}
        </span>
        {rating && (
          <div className="flex items-center gap-1">
            <Star size={13} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs sm:text-sm font-medium text-foreground">{rating}</span>
          </div>
        )}
        <div className="flex flex-col gap-1 mt-auto">
          {price && (
            <div className="flex items-center justify-between">
              <p className="text-base sm:text-lg font-bold text-primary">
                R$ {formatPrice(price)}
              </p>
              {user && (
                <button
                  onClick={toggleFavorite}
                  disabled={isUpdating}
                  className="p-2 rounded-full hover:bg-secondary transition-colors"
                  title="Favoritar produto"
                >
                  <Heart size={18} className={isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
                </button>
              )}
            </div>
          )}
        </div>
        <button
          onClick={handleBuy}
          className="w-full py-2.5 sm:py-2.5 rounded-lg gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all text-xs sm:text-sm"
        >
          <ExternalLink size={14} /> Ver Produto
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
