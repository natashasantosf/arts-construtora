/**
 * Global business data — everything the original site repeated on every page
 * (top bar, header, footer, CTAs, JSON-LD). Change it here, not in components.
 */

const whatsappNumber = "5551984033255";

/** WhatsApp deep link, same format the original site used (wa.me + URL-encoded text). */
export const whatsappUrl = (message: string = site.whatsapp.defaultMessage) =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

/** Messages the original used on each service page (sidebar and bottom CTA). */
export const serviceWhatsappMessages = (serviceTitle: string) => ({
  quote: `Olá, preciso de orçamento para ${serviceTitle}`,
  cta: `Olá, preciso de ${serviceTitle}`,
});

export const site = {
  name: "Art's Construtora",
  url: "https://artsconstrutora.com.br",
  locale: "pt-BR",
  ogLocale: "pt_BR",

  phone: { display: "(51) 98403-3255", href: "tel:(51) 98403-3255" },
  whatsapp: {
    number: whatsappNumber,
    defaultMessage: "Olá! Gostaria de solicitar um orçamento para meu projeto.",
  },
  email: "comercial@artsconstrutora.com.br",
  location: "Canoas, RS — Brasil",
  hours: ["Seg a Sex: 8h às 18h", "Sábado: 8h às 12h"],
  social: [
    { name: "Instagram", icon: "instagram", href: "https://www.instagram.com/artsconstrutora_" },
    { name: "Facebook", icon: "facebook", href: "https://www.facebook.com/ArtsConstrutora" },
  ],

  regionTagline: "ATUAÇÃO REGIONAL • RIO GRANDE DO SUL • SANTA CATARINA",
  servicesTagline: ["Construção · Reformas · Pintura Predial", "Porcelanatos · Granitos · Manutenção de Condomínios"],
  values: "QUALIDADE · SEGURANÇA · COMPROMISSO · EXCELÊNCIA",

  /** Main navigation. Services dropdown items come from the `services` collection. */
  nav: [
    { label: "Início", href: "/" },
    { label: "Empresa", href: "/empresa" },
    { label: "Serviços", href: "/servicos", children: "services" as const },
    { label: "Projetos", href: "/projetos" },
    { label: "Áreas Atendidas", href: "/areas-atendidas" },
    { label: "Blog", href: "/blog" },
    { label: "Contato", href: "/contato" },
  ],

  /** Cities highlighted on the home page and in the footer (all link to /areas-atendidas). */
  featuredCities: {
    rs: ["Porto Alegre", "Canoas", "Gramado", "Canela", "Xangri-Lá", "Capão da Canoa", "Torres"],
    sc: ["Balneário Camboriú", "Florianópolis", "Itapema", "Porto Belo", "Bombinhas"],
  },

  /** Footer "Nossas Garantias". */
  guarantees: [
    { icon: "shield", text: "Seguro de Responsabilidade Civil em todas as obras" },
    { icon: "award", text: "ART emitida por Engenheiro Civil registrado no CREA-RS" },
    { icon: "award", text: "Equipe de alpinismo certificada IRATA Level 1, 2 e 3" },
    { icon: "shield", text: "Garantia contratual de até 5 anos em serviços de impermeabilização" },
  ],

  /** Generic quote CTA copy repeated across pages. */
  quoteText:
    "Nossa equipe realiza uma avaliação técnica do local e desenvolve uma proposta personalizada de acordo com as necessidades do seu projeto.",
};

export type Site = typeof site;
