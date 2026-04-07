import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check URL hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha redefinida com sucesso!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Erro ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-lg">
          <Loader2 className="animate-spin w-8 h-8 text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando link de recuperação...</p>
          <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
            Voltar à loja
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="gradient-primary rounded-t-2xl px-6 py-8 text-center">
          <div className="w-14 h-14 mx-auto bg-background/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3">
            <ShieldCheck size={28} className="text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-primary-foreground">Nova Senha</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">Escolha uma senha segura para sua conta</p>
        </div>

        <div className="bg-card border border-border border-t-0 rounded-b-2xl p-6 shadow-lg">
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nova senha (mín. 6 caracteres)"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background pl-10 pr-10"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirme a nova senha"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background pl-10"
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full gradient-primary font-semibold h-11" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <ShieldCheck size={18} className="mr-2" />}
              Redefinir Senha
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
