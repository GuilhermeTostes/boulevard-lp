import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const nonEmptyString = z.string().refine((value) => value.trim().length > 0, {
  message: 'Required string cannot be empty.',
});

const safeLocalPath = (value: string) =>
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.includes('\\') &&
  !value.split('/').includes('..');

const safeHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

const imageValue = z.string().refine((value) => {
  if (!value.trim()) return false;
  if (safeHttpsUrl(value)) return true;
  return safeLocalPath(value) && /\.(avif|gif|jpe?g|png|webp)$/i.test(value);
}, {
  message: 'Image must be a safe local image path or an HTTPS URL.',
});

const optionalImageValue = z.union([imageValue, z.literal('')]).optional();

const safeHref = z.string().refine((value) => {
  if (value === '#') return true;
  if (safeLocalPath(value)) return true;
  if (safeHttpsUrl(value)) return true;
  return false;
}, {
  message: 'Link must be a safe local path, #, or an HTTPS URL.',
});

const videoUrl = z.string().refine((value) => {
  if (!value.trim()) return false;

  try {
    const url = new URL(value, 'https://www.boulevard-arqcon.com.br');
    const host = url.hostname.toLowerCase();

    if (safeLocalPath(value)) {
      return /\.(mp4|ogg|webm)$/i.test(url.pathname);
    }

    if (url.protocol !== 'https:') return false;
    if (['youtube.com', 'www.youtube.com', 'youtu.be', 'vimeo.com', 'player.vimeo.com'].includes(host)) {
      return true;
    }

    return host === 'www.boulevard-arqcon.com.br' && /\.(mp4|ogg|webm)$/i.test(url.pathname);
  } catch {
    return false;
  }
}, {
  message: 'Video must be YouTube, Vimeo, or a safe same-origin video file.',
});

const singleton = (id: string) => (text: string) => [{ id, ...JSON.parse(text) }];

const projetos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projetos' }),
  schema: z.object({
    title: nonEmptyString,
    tag: nonEmptyString,
    localizacao: nonEmptyString,
    ano: z.number().int().min(2000).max(2100),
    imagem_capa: imageValue,
    galeria: z.array(imageValue).default([]),
    descricao_curta: nonEmptyString,
    destaque: z.boolean().default(false),
    tile_size: z.enum(['large', 'wide', 'standard']).default('standard'),
    ordem: z.number().int().default(0),
  }),
});

const unwrapEntries = (text: string) => {
  const data = JSON.parse(text);
  return Array.isArray(data) ? data : data.entries;
};

const depoimentos = defineCollection({
  loader: file('src/content/depoimentos.json', { parser: unwrapEntries }),
  schema: z.object({
    nome: nonEmptyString,
    cargo_projeto: nonEmptyString,
    texto: nonEmptyString,
    avatar: optionalImageValue,
    featured: z.boolean().optional().default(false),
  }),
});

const metricas = defineCollection({
  loader: file('src/content/metricas.json', { parser: unwrapEntries }),
  schema: z.object({
    numero: nonEmptyString,
    sufixo: z.string().default(''),
    label: nonEmptyString,
    ordem: z.number().int().default(0),
  }),
});

const textos = defineCollection({
  loader: file('src/content/textos.json', { parser: singleton('textos') }),
  schema: z.object({
    hero: z.object({
      eyebrow: nonEmptyString,
      titulo: nonEmptyString,
      subtitulo: nonEmptyString,
      cta_primario: nonEmptyString,
      cta_secundario: nonEmptyString,
      imagem: imageValue,
    }),
    value_prop: z.object({
      eyebrow: nonEmptyString,
      card1_numero: nonEmptyString,
      card1_titulo: nonEmptyString,
      card1_body: nonEmptyString,
      card2_numero: nonEmptyString,
      card2_titulo: nonEmptyString,
      card2_body: nonEmptyString,
    }),
    servicos: z.object({
      eyebrow: nonEmptyString,
      titulo: nonEmptyString,
      card1_numero: nonEmptyString,
      card1_titulo: nonEmptyString,
      card1_body: nonEmptyString,
      card1_link_texto: nonEmptyString,
      card2_numero: nonEmptyString,
      card2_titulo: nonEmptyString,
      card2_body: nonEmptyString,
      card2_link_texto: nonEmptyString,
    }),
    portfolio: z.object({
      eyebrow: nonEmptyString,
      titulo: nonEmptyString,
      ver_todos: nonEmptyString,
    }),
    video_banner: z.object({
      visivel: z.boolean().default(false),
      eyebrow: nonEmptyString,
      titulo: nonEmptyString,
      subtitulo: z.string().optional().default(''),
      imagem_capa: imageValue,
      video_url: videoUrl,
    }),
    depoimentos: z.object({
      eyebrow: nonEmptyString,
      titulo: nonEmptyString,
    }),
    whatsapp_mensagem: nonEmptyString,
    cta: z.object({
      eyebrow: nonEmptyString,
      titulo: nonEmptyString,
      subtitulo: nonEmptyString,
      cta_primario: nonEmptyString,
      cta_form_divider: nonEmptyString,
      cta_whatsapp: nonEmptyString,
    }),
  }),
});

const configs = defineCollection({
  loader: file('src/content/configs.json', { parser: singleton('configs') }),
  schema: z.object({
    nome_empresa: nonEmptyString,
    tagline: nonEmptyString,
    contato_email: z.string().email(),
    contato_tel: nonEmptyString,
    contato_whatsapp: z.string().regex(/^\+\d{10,15}$/),
    contato_local: nonEmptyString,
    social: z.object({
      instagram: safeHref,
      linkedin: safeHref,
    }),
    nav_links: z.array(z.object({
      label: nonEmptyString,
      href: safeHref,
    })).min(1),
  }),
});

const sobre = defineCollection({
  loader: file('src/content/sobre.json', { parser: singleton('sobre') }),
  schema: z.object({
    eyebrow: nonEmptyString,
    titulo: nonEmptyString,
    body: nonEmptyString,
    socios: z.array(z.object({
      nome: nonEmptyString,
      cargo: nonEmptyString,
      bio: z.string().optional().default(''),
      foto: optionalImageValue,
    })).min(1),
  }),
});

const listaTextos = z.array(nonEmptyString).min(1);

const servicos = defineCollection({
  loader: file('src/content/servicos.json', { parser: singleton('servicos') }),
  schema: z.object({
    hero: z.object({
      eyebrow: nonEmptyString,
      titulo: nonEmptyString,
      lead: nonEmptyString,
    }),
    projetos: z.object({
      eyebrow: nonEmptyString,
      titulo: nonEmptyString,
      descricao: nonEmptyString,
      inclui_titulo: nonEmptyString,
      inclui: listaTextos,
      aplicavel_titulo: nonEmptyString,
      aplicavel: listaTextos,
    }),
    obras: z.object({
      eyebrow: nonEmptyString,
      titulo: nonEmptyString,
      descricao: nonEmptyString,
      inclui_titulo: nonEmptyString,
      inclui: listaTextos,
      aplicavel_titulo: nonEmptyString,
      aplicavel: listaTextos,
    }),
    fluxo: z.object({
      eyebrow: nonEmptyString,
      titulo: nonEmptyString,
      subtitulo: z.string().optional().default(''),
      etapas: z.array(z.object({
        titulo: nonEmptyString,
        descricao: nonEmptyString,
        destaque: z.enum(['', 'inicio', 'virada', 'fim']).default(''),
      })).min(1),
    }),
    faq: z.object({
      eyebrow: nonEmptyString,
      titulo: nonEmptyString,
      itens: z.array(z.object({
        pergunta: nonEmptyString,
        resposta: nonEmptyString,
      })).min(1),
    }),
  }),
});

const sobrePagina = defineCollection({
  loader: file('src/content/sobre_pagina.json', { parser: singleton('sobre_pagina') }),
  schema: z.object({
    hero: z.object({
      eyebrow: nonEmptyString,
      titulo: nonEmptyString,
      subtitulo: nonEmptyString,
    }),
    institucional: z.object({
      ano_fundacao_label: nonEmptyString,
      ano_fundacao: nonEmptyString,
      filosofia_label: nonEmptyString,
      filosofia: nonEmptyString,
      posicionamento_label: nonEmptyString,
      posicionamento: nonEmptyString,
      endereco_label: nonEmptyString,
      endereco: nonEmptyString,
    }),
    mapa: z.object({
      endereco_completo: nonEmptyString,
      rotulo_marcador: nonEmptyString,
    }),
    processo_resumido: z.object({
      eyebrow: nonEmptyString,
      titulo: nonEmptyString,
      colunas: z.array(z.object({
        numero: nonEmptyString,
        titulo: nonEmptyString,
        descricao: nonEmptyString,
      })).length(3),
    }),
    area_atuacao: z.object({
      eyebrow: nonEmptyString,
      titulo: nonEmptyString,
      subtitulo: z.string().optional().default(''),
      estados_destacados: z.array(z.string().regex(/^[A-Z]{2}$/)).min(1),
      cidades: z.array(z.object({
        estado: nonEmptyString,
        lista: listaTextos,
      })).min(1),
    }),
  }),
});

export const collections = {
  projetos,
  depoimentos,
  metricas,
  textos,
  configs,
  sobre,
  servicos,
  sobrePagina,
};
