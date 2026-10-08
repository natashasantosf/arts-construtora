/**
 * JSON-LD carried over from the original site (identical on every page).
 *
 * The original had a different phone (+55-51-99958-3045) and e-mail (contato@) here than on the
 * pages; the client confirmed the visible contacts, so telephone and email now match `site.ts`.
 * The original address said Porto Alegre; it now says Canoas, the company's base (site.location, /areas-atendidas map).
 */
export const localBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Art's Construtora",
  "description": "Empresa especializada em pintura predial, alpinismo predial, impermeabilização, reforma de fachadas e manutenção de condomínios em Porto Alegre e Região Metropolitana RS.",
  "url": "https://artsconstrutora.com.br",
  "telephone": "+55-51-98403-3255",
  "email": "comercial@artsconstrutora.com.br",
  "foundingDate": "2002",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Canoas",
    "addressRegion": "RS",
    "addressCountry": "BR"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -29.9178,
    "longitude": -51.1834
  },
  "areaServed": [
    "Porto Alegre",
    "Canoas",
    "Novo Hamburgo",
    "São Leopoldo",
    "Gravataí",
    "Cachoeirinha",
    "Região Metropolitana RS",
    "Santa Catarina"
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Serviços de Manutenção Predial",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Pintura Predial"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Alpinismo Predial"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Impermeabilização"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Reforma de Fachadas"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Manutenção de Condomínios"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Lavagem de Fachadas"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Instalação de Porcelanatos e Granitos"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Reformas Comerciais e Industriais"
        }
      }
    ]
  }
};
