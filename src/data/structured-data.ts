/**
 * JSON-LD carried over verbatim from the original site (identical on every page).
 *
 * NOTE: it disagrees with the visible contact data — telephone +55-51-99958-3045 and
 * contato@ e-mail here vs. (51) 98403-3255 and comercial@ on the pages. Kept as-is
 * because the conversion does not change business data; see conversion/report.md.
 */
export const localBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Art's Construtora",
  "description": "Empresa especializada em pintura predial, alpinismo predial, impermeabilização, reforma de fachadas e manutenção de condomínios em Porto Alegre e Região Metropolitana RS.",
  "url": "https://artsconstrutora.com.br",
  "telephone": "+55-51-99958-3045",
  "email": "contato@artsconstrutora.com.br",
  "foundingDate": "2002",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Porto Alegre",
    "addressRegion": "RS",
    "addressCountry": "BR"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -30.0346,
    "longitude": -51.2177
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
