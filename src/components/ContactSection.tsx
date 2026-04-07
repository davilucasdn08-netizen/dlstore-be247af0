import { Instagram } from "lucide-react";

const ContactSection = () => {
  const instagramUrl = "https://www.instagram.com/dlstore_curadoria?igsh=MWJva2R5cGtmbW4xdA%3D%3D&utm_source=qr";

  return (
    <section className="bg-card border-t border-border py-10">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Contato</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Dúvidas, sugestões ou precisa de ajuda? Fale conosco!
        </p>
        <div className="flex items-center justify-center">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            <Instagram size={20} />
            @dlstore_curadoria
          </a>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
