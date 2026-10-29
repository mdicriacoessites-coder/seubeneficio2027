/**
 * Meta Conversions API (CAPI) — Servidor
 *
 * Envia eventos diretamente para a Graph API da Meta (v21.0).
 * Garante segurança, deduplicação com o Meta Pixel (via event_id)
 * e hash SHA-256 para Advanced Matching (parâmetros de cliente).
 */
import { createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";

export interface MetaUserData {
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
  nome?: string;
  telefone?: string;
  email?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
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
  event_time?: number; // Unix timestamp em segundos
  event_source_url?: string;
  user_data?: MetaUserData;
  custom_data?: MetaCustomData;
  test_event_code?: string;
}

// Conjunto para garantir idempotência de eventos Purchase no servidor
const processedPurchases = new Set<string>();

/** Normaliza e gera hash SHA-256 conforme especificação da Meta */
export function hashSha256(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const clean = value.trim().toLowerCase();
  if (!clean) return undefined;
  return createHash("sha256").update(clean).digest("hex");
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
export function hashName(fullName: string | undefined | null): { fn?: string; ln?: string } {
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

  const userDataFormatted: Record<string, any> = {};
  if (u.client_ip_address) userDataFormatted.client_ip_address = u.client_ip_address;
  if (u.client_user_agent) userDataFormatted.client_user_agent = u.client_user_agent;
  if (u.fbp) userDataFormatted.fbp = u.fbp;
  if (u.fbc) userDataFormatted.fbc = u.fbc;
  if (ph) userDataFormatted.ph = [ph];
  if (em) userDataFormatted.em = [em];
  if (fn) userDataFormatted.fn = [fn];
  if (ln) userDataFormatted.ln = [ln];
  if (ct) userDataFormatted.ct = [ct];
  if (st) userDataFormatted.st = [st];
  if (zp) userDataFormatted.zp = [zp];

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

  const requestBody: Record<string, any> = {
    data: [eventPayload],
  };
  if (testEventCode) {
    requestBody.test_event_code = testEventCode;
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

