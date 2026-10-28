/**
 * Integração com PromissePay via createServerFn (TanStack Start)
 * Roda no servidor — sem CORS, API Key nunca exposta ao browser.
 */
import { createServerFn } from "@tanstack/react-start";
import { notificarPagamentoPendente } from "./discord-notify";

export type PromissePixResult = {
  id: string;
  pixCopiaECola: string;
  qrCodeUrl: string;
  status: string;
};

// Re-exporta a consulta de status via webhook para uso no frontend
export { consultarStatusWebhook } from "./webhook-handler";

// Server function: cria cobrança PIX na PromissePay
export const criarCobrancaPromissePay = createServerFn({ method: "POST" })
  .validator((data: { amountInCents?: number; nome?: string; telefone?: string }) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env["VITE_PROMISSE_API_KEY"] ?? "";

    if (!apiKey) {
      throw new Error("API Key da PromissePay não configurada no servidor (.env).");
    }

    const amount = data?.amountInCents ?? 1500; // 1500 centavos = R$ 15,00
    const externalId = `TAXA-${Date.now()}`;

    // Monta a URL do webhook para a PromissePay notificar pagamentos confirmados
    const appUrl = process.env["VITE_APP_URL"] ?? "http://localhost:8080";
    const webhookUrl = `${appUrl}/api/webhook/promissepay`;

    const payload = {
      amount,           // centavos (1500 = R$ 15,00)
      externalId,
      webhook: webhookUrl,  // URL que a PromissePay vai chamar quando o pagamento for confirmado
    };

    console.log("[PromissePay] Payload:", JSON.stringify(payload));

    const res = await fetch("https://api.promisse.com.br/transactions", {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const raw = await res.json();
    console.log("[PromissePay] Status:", res.status, "Body:", JSON.stringify(raw));

    if (!res.ok) {
      const msg = raw?.message ?? raw?.error ?? raw?.msg ?? `Erro ${res.status} na PromissePay`;
      throw new Error(msg);
    }


    // Campo correto da API PromissePay: "copyPaste"
    const pixCopiaECola: string = typeof raw.copyPaste === "string" ? raw.copyPaste : "";

    // Campo correto da API PromissePay: "qrCodeBase64" (já vem com prefixo data:image/png;base64,)
    let qrCodeUrl = "";
    if (typeof raw.qrCodeBase64 === "string" && raw.qrCodeBase64) {
      qrCodeUrl = raw.qrCodeBase64.startsWith("data:image")
        ? raw.qrCodeBase64
        : `data:image/png;base64,${raw.qrCodeBase64}`;
    }
    // Fallback: gera QR via serviço público se não veio imagem
    if (!qrCodeUrl && pixCopiaECola) {
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(pixCopiaECola)}`;
    }

    const result = {
      id: String(raw.id ?? raw.transactionId ?? raw.transaction_id ?? ""),
      pixCopiaECola,
      qrCodeUrl,
      status: String(raw.status ?? "pending"),
    } satisfies PromissePixResult;

    // Notifica Discord sobre pagamento pendente (fire-and-forget)
    notificarPagamentoPendente({
      transacaoId: result.id,
      valor: amount,
      externalId,
      nome: data?.nome,
      telefone: data?.telefone,
    }).catch((err) => console.error("[Discord] Erro ao notificar pendente:", err));

    return result;
  });

// Server function: consulta status de uma transação
export const consultarTransacaoPromissePay = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env["VITE_PROMISSE_API_KEY"] ?? "";
    if (!apiKey || !data.id) return { status: "unknown", paid: false };

    try {
      const res = await fetch(`https://api.promisse.com.br/transactions/${data.id}`, {
        headers: { Authorization: apiKey, "Content-Type": "application/json" },
      });
      if (!res.ok) return { status: "error", paid: false };

      const raw = await res.json();
      const status = String(raw.status ?? "").toLowerCase();
      const paid = ["completed", "paid", "approved", "pago", "sucesso", "confirmed", "success"].includes(status);
      return { status, paid };
    } catch {
      return { status: "error", paid: false };
    }
  });

// Compatibilidade (não usados mais, mas evita erros de import)
export function getPromisseApiKey(): string { return ""; }
export function savePromisseApiKey(_key: string): void { }
