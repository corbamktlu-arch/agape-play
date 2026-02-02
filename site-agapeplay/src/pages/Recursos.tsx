import { 
  Music, 
  ListMusic, 
  Megaphone, 
  Volume2, 
  Users, 
  Upload,
  Clock,
  Shuffle,
  Store,
  Shield,
  Play,
  Pause,
  Settings,
  Wifi,
  WifiOff
} from "lucide-react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dashboardPreview from "@/assets/dashboard-preview.png";

const resourceSections = [
  {
    id: "musicas",
    icon: Music,
    title: "Músicas",
    description: "Gerencie todo o acervo musical da sua rádio indoor",
    features: [
      {
        icon: Upload,
        title: "Upload Direto",
        description: "Envie suas músicas diretamente pelo painel. Suporte para MP3, WAV e outros formatos populares."
      },
      {
        icon: ListMusic,
        title: "Organização por Artista/Título",
        description: "Mantenha seu acervo organizado com tags, artistas, álbuns e gêneros musicais."
      }
    ]
  },
  {
    id: "playlists",
    icon: ListMusic,
    title: "Playlists",
    description: "Crie programações musicais personalizadas",
    features: [
      {
        icon: Shuffle,
        title: "Tocar em Ordem ou Aleatório",
        description: "Escolha entre reprodução sequencial ou modo shuffle para variar a programação."
      },
      {
        icon: Store,
        title: "Vinculadas por Loja",
        description: "Cada loja pode ter sua própria playlist, permitindo personalização regional."
      }
    ]
  },
  {
    id: "avisos",
    icon: Megaphone,
    title: "Avisos Automáticos",
    description: "Comunique promoções e mensagens automaticamente",
    features: [
      {
        icon: Upload,
        title: "Cadastrar Promoções e Mensagens",
        description: "Grave ou faça upload de avisos para promoções, comunicados e mensagens institucionais."
      },
      {
        icon: Clock,
        title: "Tocar a Cada X Minutos Automaticamente",
        description: "Configure intervalos de tempo para os avisos tocarem automaticamente entre as músicas."
      }
    ]
  },
  {
    id: "player",
    icon: Volume2,
    title: "Player",
    description: "Controle total da reprodução",
    features: [
      {
        icon: Play,
        title: "Controle de Volume, Play/Pause",
        description: "Interface intuitiva para controlar a reprodução em tempo real de qualquer dispositivo."
      },
      {
        icon: Wifi,
        title: "Online/Offline Automático",
        description: "O sistema detecta automaticamente a conexão e continua funcionando mesmo offline."
      }
    ]
  },
  {
    id: "usuarios",
    icon: Users,
    title: "Usuários e Permissões",
    description: "Gerencie quem tem acesso ao quê",
    features: [
      {
        icon: Shield,
        title: "Admin: Controle Total",
        description: "Acesso completo a todas as funcionalidades, lojas, usuários e configurações do sistema."
      },
      {
        icon: Settings,
        title: "Gerente: Controla Suas Lojas",
        description: "Gerencia apenas as lojas sob sua responsabilidade, com acesso a playlists e avisos."
      },
      {
        icon: Play,
        title: "Operador: Apenas Reprodução",
        description: "Permissão básica para controlar play/pause e volume nas lojas designadas."
      }
    ]
  }
];

const Recursos = () => {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h1 className="mb-6 text-4xl font-bold md:text-5xl">
              Tudo que o <span className="gradient-neon-text">ÁgapePlay</span> oferece
            </h1>
            <p className="text-lg text-muted-foreground">
              Conheça em detalhes cada funcionalidade do sistema de rádio indoor mais completo do mercado
            </p>
          </div>

          {/* Dashboard Preview Image */}
          <div className="mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-2xl border border-primary/30 neon-glow">
              <img 
                src={dashboardPreview} 
                alt="Painel do ÁgapePlay - Gerenciamento de Playlists" 
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
            </div>
            <p className="text-center text-muted-foreground mt-4 text-sm">
              Interface do painel administrativo do ÁgapePlay
            </p>
          </div>
        </div>
      </section>

      {/* Resource Sections */}
      {resourceSections.map((section, sectionIndex) => (
        <section 
          key={section.id} 
          className={`py-16 md:py-24 ${sectionIndex % 2 === 1 ? 'bg-card/30' : ''}`}
        >
          <div className="container px-4">
            <div className="mb-12 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <section.icon className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold md:text-3xl">{section.title}</h2>
                <p className="text-muted-foreground">{section.description}</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {section.features.map((feature, featureIndex) => (
                <Card 
                  key={featureIndex} 
                  className="group border-border/50 bg-card/50 backdrop-blur transition-all duration-300 hover:border-primary/50"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="glass-card rounded-2xl p-8 text-center md:p-12">
            <h2 className="mb-4 text-2xl font-bold md:text-3xl">
              Pronto para começar?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
              Fale conosco e descubra como o ÁgapePlay pode transformar sua loja
            </p>
            <WhatsAppButton variant="hero" customMessage="Olá! Vi os recursos do ÁgapePlay e quero saber mais!">
              Falar no WhatsApp
            </WhatsAppButton>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Recursos;
