/**
 * Meta Conversions API (CAPI) — Servidor
 *
 * Envia eventos diretamente para a Graph API da Meta (v21.0).
 * Garante segurança, deduplicação com o Meta Pixel (via event_id)
 * e hash SHA-256 para Advanced Matching (parâmetros de cliente).
 */
import { createServerFn } from "@tanstack/react-start";

function sha256Hex(ascii: string): string {
  function r(v: number, a: number) { return (v >>> a) | (v << (32 - a)); }
  const max = Math.pow(2, 32);
  let result = "";
  const words: number[] = [];
  const len = ascii.length * 8;
  let hash: number[] = [];
  const k: number[] = [];
  let primes = 0;
  const comp: Record<number, number> = {};
  for (let c = 2; primes < 64; c++) {
    if (!comp[c]) {
      for (let i = 0; i < 313; i += c) comp[i] = c;
      hash[primes] = (Math.pow(c, 0.5) * max) | 0;
      k[primes++] = (Math.pow(c, 1 / 3) * max) | 0;
    }
  }
  ascii += "\x80";
  while ((ascii.length % 64) - 56) ascii += "\x00";
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    const idx = i >> 2;
    words[idx] = (words[idx] ?? 0) | (j << (((3 - i) % 4) * 8));
  }
  words[words.length] = (len / max) | 0;
  words[words.length] = len | 0;
  for (let j = 0; j < words.length;) {
    const w = words.slice(j, (j += 16));
    const old = hash;
    hash = hash.slice(0, 8);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15] ?? 0;
      const w2 = w[i - 2] ?? 0;
      const s0 = r(w15, 7) ^ r(w15, 18) ^ (w15 >>> 3);
      const s1 = r(w2, 17) ^ r(w2, 19) ^ (w2 >>> 10);
      w[i] = i < 16 ? (w[i] ?? 0) : ((w[i - 16] ?? 0) + s0 + (w[i - 7] ?? 0) + s1) | 0;
      const ch = ((hash[4] ?? 0) & (hash[5] ?? 0)) ^ (~(hash[4] ?? 0) & (hash[6] ?? 0));
      const maj = ((hash[0] ?? 0) & (hash[1] ?? 0)) ^ ((hash[0] ?? 0) & (hash[2] ?? 0)) ^ ((hash[1] ?? 0) & (hash[2] ?? 0));
      const t1 = ((hash[7] ?? 0) + (r(hash[4] ?? 0, 6) ^ r(hash[4] ?? 0, 11) ^ r(hash[4] ?? 0, 25)) + ch + (k[i] ?? 0) + (w[i] ?? 0)) | 0;
      const t2 = ((r(hash[0] ?? 0, 2) ^ r(hash[0] ?? 0, 13) ^ r(hash[0] ?? 0, 22)) + maj) | 0;
      hash = [(t1 + t2) | 0, hash[0] ?? 0, hash[1] ?? 0, hash[2] ?? 0, ((hash[3] ?? 0) + t1) | 0, hash[4] ?? 0, hash[5] ?? 0, hash[6] ?? 0];
    }
    for (let i = 0; i < 8; i++) hash[i] = ((hash[i] ?? 0) + (old[i] ?? 0)) | 0;
  }
  for (let i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = ((hash[i] ?? 0) >> (b * 8)) & 255;
      result += (byte < 16 ? "0" : "") + byte.toString(16);
    }
  }
  return result;
}

export interface MetaUserData {
  client_ip_address?: string | undefined;
  client_user_agent?: string | undefined;
  fbp?: string | undefined;
  fbc?: string | undefined;
  nome?: string | undefined;
  telefone?: string | undefined;
  email?: string | undefined;
  cidade?: string | undefined;
  uf?: string | undefined;
  cep?: string | undefined;
}

export interface MetaCustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_type?: string;
  content_ids?: string[];
  num_items?: number;
  order_id?: string;
  status?: string;
  [key: string]: any;
}

export interface MetaCapiEventInput {
  event_name: "PageView" | "ViewContent" | "InitiateCheckout" | "Purchase" | string;
  event_id: string;
  event_time?: number | undefined;
  event_source_url?: string | undefined;
  user_data?: MetaUserData | undefined;
  custom_data?: MetaCustomData | undefined;
  test_event_code?: string | undefined;
}

// Conjunto para garantir idempotência de eventos Purchase no servidor
const processedPurchases = new Set<string>();

/** Normaliza e gera hash SHA-256 conforme especificação da Meta */
export function hashSha256(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const clean = value.trim().toLowerCase();
  if (!clean) return undefined;
  return sha256Hex(clean);
}

/** Normaliza número de telefone brasileiro para formato E.164 (55 + DDD + dígitos) e aplica hash */
export function hashPhone(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined;
  // Remove tudo que não for dígito
  let digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;

  // Se não começa com o DDI 55 do Brasil e tem 10 ou 11 dígitos, adiciona 55
  if (!digits.startsWith("55") && (digits.length === 10 || digits.length === 11)) {
    digits = "55" + digits;
  }

  return hashSha256(digits);
}

/** Normaliza nome completo em primeiro e último nome */
export function hashName(fullName: string | undefined | null): { fn?: string | undefined; ln?: string | undefined } {
  if (!fullName) return {};
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  const fn = hashSha256(parts[0]);
  const ln = parts.length > 1 ? hashSha256(parts.slice(1).join(" ")) : undefined;
  return { fn, ln };
}

/**
 * Função interna que executa a chamada POST na Graph API da Meta
 */
export async function sendMetaCapiEvent(input: MetaCapiEventInput): Promise<{
  success: boolean;
  events_received?: number;
  fbtrace_id?: string;
  error?: string;
  skipped?: boolean;
}> {
  const pixelId =
    process.env["META_PIXEL_ID"] ||
    process.env["VITE_META_PIXEL_ID"] ||
    "1747898422962307";

  const accessToken =
    process.env["META_CAPI_ACCESS_TOKEN"] ||
    process.env["META_ACCESS_TOKEN"];

  if (!accessToken) {
    console.warn(
      "[Meta CAPI] Aviso: META_CAPI_ACCESS_TOKEN não está configurado nas variáveis de ambiente. O evento não pôde ser enviado para o servidor da Meta.",
    );
    return { success: false, error: "META_CAPI_ACCESS_TOKEN não configurado" };
  }

  // Idempotência para Purchase: impede duplicação caso webhooks sejam reenviados
  if (input.event_name === "Purchase") {
    if (processedPurchases.has(input.event_id)) {
      console.log(`[Meta CAPI] Purchase com event_id "${input.event_id}" já foi processado anteriormente. Ignorando duplicata.`);
      return { success: true, skipped: true };
    }
  }

  // Monta user_data com hash dos dados pessoais
  const u = input.user_data || {};
  const { fn, ln } = hashName(u.nome);
  const ph = hashPhone(u.telefone);
  const em = hashSha256(u.email);
  const ct = hashSha256(u.cidade);
  const st = hashSha256(u.uf);
  const zp = u.cep ? hashSha256(u.cep.replace(/\D/g, "")) : undefined;

  const userDataFormatted: Record<string, unknown> = {};
  if (u.client_ip_address) userDataFormatted["client_ip_address"] = u.client_ip_address;
  if (u.client_user_agent) userDataFormatted["client_user_agent"] = u.client_user_agent;
  if (u.fbp) userDataFormatted["fbp"] = u.fbp;
  if (u.fbc) userDataFormatted["fbc"] = u.fbc;
  if (ph) userDataFormatted["ph"] = [ph];
  if (em) userDataFormatted["em"] = [em];
  if (fn) userDataFormatted["fn"] = [fn];
  if (ln) userDataFormatted["ln"] = [ln];
  if (ct) userDataFormatted["ct"] = [ct];
  if (st) userDataFormatted["st"] = [st];
  if (zp) userDataFormatted["zp"] = [zp];

  const eventPayload = {
    event_name: input.event_name,
    event_time: input.event_time || Math.floor(Date.now() / 1000),
    event_id: input.event_id,
    event_source_url: input.event_source_url,
    action_source: "website",
    user_data: userDataFormatted,
    custom_data: input.custom_data,
  };

  const testEventCode =
    input.test_event_code ||
    process.env["META_TEST_EVENT_CODE"] ||
    undefined;

  const requestBody: Record<string, unknown> = {
    data: [eventPayload],
  };
  if (testEventCode) {
    requestBody["test_event_code"] = testEventCode;
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${pixelId}/events`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    const json = (await res.json()) as any;

    if (!res.ok) {
      console.error(
        `[Meta CAPI] Erro ao enviar evento ${input.event_name} (${res.status}):`,
        json?.error?.message || JSON.stringify(json),
      );
      return {
        success: false,
        error: json?.error?.message || `HTTP ${res.status}`,
        fbtrace_id: json?.error?.fbtrace_id,
      };
    }

    if (input.event_name === "Purchase") {
      processedPurchases.add(input.event_id);
    }

    console.log(
      `[Meta CAPI] ✅ Evento "${input.event_name}" enviado com sucesso! Event ID: ${input.event_id}, Recebidos: ${json?.events_received ?? 1}`,
    );

    return {
      success: true,
      events_received: json?.events_received,
      fbtrace_id: json?.fbtrace_id,
    };
  } catch (error) {
    console.error(`[Meta CAPI] Falha de rede ao conectar com a Meta:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Server Function do TanStack Start:
 * Permite que componentes do frontend acionem o envio pelo servidor de forma segura,
 * capturando headers reais (IP e User-Agent) da requisição.
 */
export const sendMetaCapiEventFn = createServerFn({ method: "POST" })
  .validator((data: MetaCapiEventInput) => data)
  .handler(async ({ data }) => {
    return await sendMetaCapiEvent(data);
  });

