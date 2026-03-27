import { useState } from "react";
import { X, LogOut, Plus, Trash2, BarChart3 } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  affiliateLink: string;
  category: string;
  price: string;
  clicks: number;
}

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (product: Omit<Product, "id" | "clicks">) => void;
  onDeleteProduct: (id: string) => void;
  onLogout: () => void;
}

const CATEGORIES = [
  "Moda e Acessórios",
  "Eletrônicos e Informática",
  "Casa e Decoração",
  "Beleza e Cuidados Pessoais",
];

const AdminPanel = ({ isOpen, onClose, products, onAddProduct, onDeleteProduct, onLogout }: AdminPanelProps) => {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");

  const handleSubmit = () => {
    if (!name || !imageUrl || !affiliateLink || !category) return;
    onAddProduct({ name, imageUrl, affiliateLink, category, price });
    setName("");
    setImageUrl("");
    setAffiliateLink("");
    setCategory("");
    setPrice("");
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 md:w-96 bg-card border-l border-border z-50 transform transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      } overflow-y-auto`}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gradient-primary">Admin</h2>
          <div className="flex items-center gap-3">
            <button onClick={onLogout} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <input
            type="text"
            placeholder="Nome do produto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="URL da imagem"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Link afiliado"
            value={affiliateLink}
            onChange={(e) => setAffiliateLink(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
          >
            <option value="" disabled>Selecione a categoria</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Preço (ex: 99.90)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus size={18} /> Adicionar produto
          </button>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
            <BarChart3 size={14} /> Produtos ({products.length})
          </h3>
          <div className="space-y-2">
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate flex-1 text-foreground">
                  {product.name}{" "}
                  <span className="text-muted-foreground">({product.clicks} cliques)</span>
                </span>
                <button
                  onClick={() => onDeleteProduct(product.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="absolute bottom-6 right-6 w-12 h-12 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
      >
        <X size={20} />
      </button>
    </div>
  );
};

export default AdminPanel;
