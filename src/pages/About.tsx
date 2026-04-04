import { ArrowLeft, Target, Sparkles, Layers, ShieldCheck, Quote, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Header Minimalista */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Voltar</span>
          </Link>
          <h1 className="text-xl font-black tracking-tighter" translate="no">
            <span className="text-primary">DL</span>STORE
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 md:py-24 space-y-32">
        
        {/* Intro / Manifesto */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              Menos <span className="text-muted-foreground">excesso.</span><br />
              Mais <span className="text-primary">significado.</span>
            </h2>
          </div>
          
          <div className="lg:col-span-7 space-y-8 text-lg font-medium text-muted-foreground leading-relaxed md:pl-8 border-l-0 lg:border-l border-border/40">
            <p>
              A <span className="text-foreground font-bold" translate="no">DLSTORE</span> nasce em um cenário onde há opções demais e direção de menos. Em meio a milhares de produtos, nosso propósito é simples — entregar clareza.
            </p>
            <p>
              Somos uma plataforma de curadoria que transforma complexidade em escolha inteligente. Aqui, cada item passa por um processo rigoroso de análise, onde desempenho, reputação e custo-benefício são levados ao mais alto nível de exigência.
            </p>
            
            <div className="bg-secondary/30 rounded-2xl p-6 md:p-8 border border-border/50">
              <p className="text-foreground text-2xl font-semibold leading-snug">
                Nada entra por acaso.<br />
                Nada permanece sem motivo.
              </p>
            </div>

            <p>
              Acreditamos que o verdadeiro valor não está na quantidade, mas na precisão. Por isso, eliminamos o ruído e destacamos apenas o que realmente merece sua atenção.
            </p>
            <p className="text-foreground font-semibold text-xl pt-2">
              Mais do que apresentar produtos, entregamos confiança.
            </p>
          </div>
        </section>

        {/* Missão e Visão - Layout de Cartões Clean */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group bg-card hover:bg-secondary/20 border border-border/40 rounded-3xl p-10 transition-all duration-300">
            <Target className="text-primary mb-6" size={32} />
            <h3 className="text-2xl font-bold mb-4 text-foreground">Nossa Missão</h3>
            <p className="text-muted-foreground leading-relaxed">
              Redefinir a forma como as pessoas encontram e escolhem produtos online, oferecendo uma experiência mais simples, segura e eficiente através de uma curadoria estratégica e altamente seletiva.
            </p>
          </div>

          <div className="group bg-card hover:bg-secondary/20 border border-border/40 rounded-3xl p-10 transition-all duration-300">
            <Sparkles className="text-primary mb-6" size={32} />
            <h3 className="text-2xl font-bold mb-4 text-foreground">Nossa Visão</h3>
            <p className="text-muted-foreground leading-relaxed">
              Ser referência em curadoria digital, reconhecida pela excelência na seleção, pela confiança nas recomendações e por proporcionar uma experiência superior ao usuário.
            </p>
          </div>
        </section>

        {/* Nossos Princípios */}
        <section className="space-y-12">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Nossos Princípios</h2>
            <p className="text-xl text-muted-foreground">Os pilares absolutos que sustentam cada escolha e cada produto que aprovamos.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="text-primary" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Curadoria Inteligente</h3>
                <p className="text-muted-foreground leading-relaxed">Cada produto é cuidadosamente avaliado antes de ser apresentado. Não trabalhamos com volume, mas com relevância.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="text-primary" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Precisão nas Escolhas</h3>
                <p className="text-muted-foreground leading-relaxed">Selecionamos estritamente com base em dados, avaliações reais e desempenho comprovado no mundo real.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Layers className="text-primary" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Experiência Refinada</h3>
                <p className="text-muted-foreground leading-relaxed">Uma navegação limpa, direta e intuitiva, desenhada meticulosamente para facilitar as suas decisões.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="text-primary" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Confiança Absoluta</h3>
                <p className="text-muted-foreground leading-relaxed">Trabalhamos exclusivamente com parceiros confiáveis e links seguros, garantindo transparência de ponta a ponta.</p>
              </div>
            </div>
          </div>
        </section>

        {/* O Diferencial */}
        <section className="bg-secondary/30 rounded-3xl p-10 md:p-16 border border-border/40 flex flex-col md:flex-row gap-12 items-center justify-between">
          <div className="md:w-1/2 space-y-6 text-xl text-muted-foreground">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">O Diferencial <span translate="no">DLSTORE</span></h2>
            <div className="space-y-6">
              <div>
                A maioria das plataformas tenta te mostrar tudo.
                <div className="text-foreground font-semibold">Nós escolhemos mostrar apenas o melhor.</div>
              </div>
              <div className="w-12 h-px bg-border"></div>
              <div>
                Enquanto outros priorizam quantidade, nós priorizamos qualidade.<br/>
                Enquanto outros confundem, <span className="text-foreground font-semibold">nós simplificamos.</span>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 bg-background border border-border/50 p-8 rounded-2xl shadow-xl rotate-1 hover:rotate-0 transition-transform duration-500">
            <Quote className="text-primary/40 mb-4" size={40} />
            <p className="text-2xl font-bold leading-snug">
              "A DLSTORE é feita para quem valoriza tempo, clareza e boas decisões."
            </p>
          </div>
        </section>

        {/* Sobre o Criador (Editorial) */}
        <section className="border-t border-border/40 pt-24 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-4 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Sobre o Criador</h2>
              <div className="flex items-center gap-4 pt-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-xl font-black text-foreground">DN</span>
                </div>
                <div>
                  <div className="font-bold text-lg">Davi Nunes</div>
                  <div className="text-muted-foreground text-sm">Fundador e Criador</div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-8 space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                A DLSTORE foi idealizada, estruturada e desenvolvida por <span className="text-foreground font-medium">Davi Nunes</span>. Com visão estratégica e paixão por tecnologia, Davi criou a plataforma com um objetivo claro: elevar o padrão da experiência de compra online.
              </p>
              <p>
                Cada detalhe do site — da estrutura ao design, da navegação à lógica de seleção — foi pensado para entregar eficiência, estética e funcionalidade.
              </p>
              
              <div className="mt-8 bg-secondary/20 border-l-4 border-primary p-6 rounded-r-2xl">
                <p className="text-foreground font-semibold mb-4">Mais do que um projeto, a DLSTORE representa uma mentalidade:</p>
                <div className="flex flex-col gap-2 font-medium">
                  <div className="flex items-center gap-3"><ChevronRight size={18} className="text-primary"/> Menos aleatoriedade. Mais inteligência.</div>
                  <div className="flex items-center gap-3"><ChevronRight size={18} className="text-primary"/> Menos excesso. Mais resultado.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Final */}
        <section className="text-center space-y-10 pt-16 pb-24 border-t border-border/30">
          <div className="space-y-4">
            <p className="text-sm font-bold tracking-widest text-primary uppercase">O Essencial Te Aguarda</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight" translate="no">
              <span className="text-primary">DL</span>STORE
            </h2>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 text-lg md:text-xl font-medium text-muted-foreground">
            <span>Escolhas refinadas.</span>
            <span className="hidden md:inline">•</span>
            <span>Decisões inteligentes.</span>
            <span className="hidden md:inline">•</span>
            <span>Sem complicação.</span>
          </div>

          <div className="pt-8">
            <Link
              to="/"
              className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Explorar a Curadoria
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
};

export default About;
