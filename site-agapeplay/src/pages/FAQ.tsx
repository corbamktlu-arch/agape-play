import { WhatsAppButton } from "@/components/WhatsAppButton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "O que é rádio indoor?",
    answer: "Rádio indoor é um sistema de som ambiente personalizado para estabelecimentos comerciais. Diferente de rádios convencionais, você tem controle total sobre as músicas que tocam, pode programar avisos de promoções e mensagens institucionais, tudo através de um painel online."
  },
  {
    question: "Precisa de internet?",
    answer: "Sim, o sistema funciona através da internet para receber atualizações de playlists e avisos. Porém, o player tem modo offline que continua tocando as músicas já baixadas mesmo se a conexão cair temporariamente."
  },
  {
    question: "Posso programar anúncios automáticos?",
    answer: "Sim! Você pode gravar ou fazer upload de avisos e programar para tocarem automaticamente a cada X minutos. É perfeito para promoções, comunicados de horário de funcionamento, mensagens de boas-vindas e muito mais."
  },
  {
    question: "Funciona por loja separada?",
    answer: "Sim! Cada loja pode ter sua própria programação de músicas e avisos. Isso permite personalizar o ambiente sonoro de acordo com o perfil de cada unidade, região ou público-alvo."
  },
  {
    question: "Como contratar?",
    answer: "É simples! Entre em contato conosco pelo WhatsApp, informe quantas lojas você tem e suas necessidades. Nossa equipe vai entender seu caso e enviar uma proposta personalizada. Após a aprovação, configuramos tudo para você começar a usar."
  },
  {
    question: "Tem suporte?",
    answer: "Sim! Oferecemos suporte técnico para todos os clientes. O nível de suporte varia de acordo com o plano contratado, desde suporte por email até gerente de conta dedicado para grandes redes."
  },
  {
    question: "Quais equipamentos preciso?",
    answer: "Você precisa apenas de um computador ou dispositivo com navegador web para acessar o painel, e um player de áudio (computador, tablet ou player dedicado) conectado ao sistema de som da loja."
  },
  {
    question: "Posso usar minhas próprias músicas?",
    answer: "Sim! O ÁgapePlay permite que você faça upload das suas próprias músicas. Lembre-se apenas de garantir que você possui os direitos autorais ou licenças necessárias para uso comercial."
  }
];

const FAQ = () => {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold md:text-5xl">
              Perguntas <span className="gradient-neon-text">Frequentes</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Tire suas dúvidas sobre o ÁgapePlay
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="pb-16 md:pb-24">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="glass-card rounded-xl border-border/50 px-6 data-[state=open]:border-primary/50"
                >
                  <AccordionTrigger className="text-left text-lg font-medium hover:no-underline hover:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* CTA */}
            <div className="mt-16 text-center">
              <p className="mb-6 text-muted-foreground">
                Ainda tem dúvidas? Fale diretamente conosco!
              </p>
              <WhatsAppButton variant="hero" customMessage="Olá! Tenho algumas dúvidas sobre o ÁgapePlay. Pode me ajudar?">
                Tirar Dúvidas no WhatsApp
              </WhatsAppButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
