/**
 * Meta Pixel & Conversions API — Client Helper
 *
 * ID: 1747898422962307
 * Gerencia disparos no navegador via fbq() e sincronização com a
 * API de Conversões (CAPI) do servidor com deduplicação via event_id.
 */
import { sendMetaCapiEventFn, type MetaUserData } from "./meta-conversions-api";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export const META_PIXEL_ID = "1747898422962307";

/**
 * Lê os cookies oficiais da Meta (_fbp e _fbc) no navegador
 */
export function getMetaCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === "undefined") return {};
  try {
    const cookies = document.cookie.split(";").reduce((acc, c) => {
      const [k, v] = c.trim().split("=");
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {} as Record<string, string>);
    return {
      fbp: cookies["_fbp"],
      fbc: cookies["_fbc"],
    };
  } catch {
    return {};
  }
}

/**
 * Gera um identificador único de evento para deduplicação entre Pixel e CAPI
 */
export function generateEventId(prefix: string = "evt"): string {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${rand}`;
}

export interface TrackOptions {
  eventId?: string;
  sendServer?: boolean;
  userData?: MetaUserData;
}

/**
 * Dispara evento tanto no Meta Pixel (navegador) quanto na Conversions API (servidor),
 * compartilhando exatamente o mesmo event_id para garantir deduplicação na Meta.
 */
export function trackPixel(
  event: string,
  params?: Record<string, any>,
  options?: TrackOptions,
): string {
  const eventId = options?.eventId || generateEventId(event.toLowerCase());

  // 1. Disparo no Navegador (Meta Pixel)
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      if (params) {
        window.fbq("track", event, params, { eventID: eventId });
      } else {
        window.fbq("track", event, {}, { eventID: eventId });
      }
    } catch (e) {
      console.warn("[Meta Pixel] Erro ao disparar no navegador:", e);
    }
  }

  // 2. Disparo no Servidor (Conversions API) com mesmo event_id
  if (options?.sendServer !== false && typeof window !== "undefined") {
    const metaCookies = getMetaCookies();
    const sourceUrl = window.location.href;
    const userAgent = navigator.userAgent;

    // Fire-and-forget: não trava a interface nem gera erros se o backend falhar
    sendMetaCapiEventFn({
      data: {
        event_name: event,
        event_id: eventId,
        event_source_url: sourceUrl,
        user_data: {
          client_user_agent: userAgent,
          fbp: metaCookies.fbp,
          fbc: metaCookies.fbc,
          ...options?.userData,
        },
        custom_data: params,
      },
    }).catch((err) => {
      console.warn(`[Meta CAPI] Aviso no envio assíncrono do evento ${event}:`, err?.message || err);
    });
  }

  return eventId;
}

/**
 * Disparo para evento customizado (trackCustom)
 */
export function trackCustomPixel(
  event: string,
  params?: Record<string, any>,
  options?: TrackOptions,
): string {
  const eventId = options?.eventId || generateEventId(event.toLowerCase());

  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      if (params) {
        window.fbq("trackCustom", event, params, { eventID: eventId });
      } else {
        window.fbq("trackCustom", event, {}, { eventID: eventId });
      }
    } catch (e) {
      console.warn("[Meta Pixel] Erro no trackCustom:", e);
    }
  }

  if (options?.sendServer !== false && typeof window !== "undefined") {
    const metaCookies = getMetaCookies();
    sendMetaCapiEventFn({
      data: {
        event_name: event,
        event_id: eventId,
        event_source_url: window.location.href,
        user_data: {
          client_user_agent: navigator.userAgent,
          fbp: metaCookies.fbp,
          fbc: metaCookies.fbc,
          ...options?.userData,
        },
        custom_data: params,
      },
    }).catch(() => {});
  }

  return eventId;
}

