/**
 * Notificações via Discord Webhook
 *
 * Envia alertas para o canal do Discord configurado quando:
 * - Um PIX é gerado (pagamento pendente)
 * - Um pagamento é confirmado (webhook da PromissePay)
 */

const DISCORD_WEBHOOK_URL =
  process.env["DISCORD_WEBHOOK_URL"] ||
  "https://discord.com/api/webhooks/1564752151077716148/i9y3d1rfJqQ-GKiOus4uL9GlDuzfN1yA2eaRgKURAQpO54BJo6f02IkIyHLVk857Vh2Z";

function brl(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Envia uma mensagem embed para o Discord */
async function sendDiscordEmbed(payload: object): Promise<void> {
  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[Discord] Erro ao enviar notificação:", res.status, err);
  }
}

/** Notifica que um PIX foi gerado (pagamento pendente) */
export async function notificarPagamentoPendente(params: {
  transacaoId: string;
  valor: number; // em centavos
  externalId: string;
  nome?: string | undefined;
  telefone?: string | undefined;
}): Promise<void> {
  const { transacaoId, valor, externalId, nome, telefone } = params;

  await sendDiscordEmbed({
    embeds: [
      {
        title: "⏳ PIX Gerado — Aguardando Pagamento",
        color: 0xf59e0b, // amarelo
        fields: [
          { name: "💰 Valor", value: brl(valor), inline: true },
          { name: "🆔 Transação", value: `\`${transacaoId || "—"}\``, inline: true },
          { name: "🔖 External ID", value: `\`${externalId}\``, inline: true },
          ...(nome ? [{ name: "👤 Nome", value: nome, inline: true }] : []),
          ...(telefone ? [{ name: "📱 WhatsApp", value: telefone, inline: true }] : []),
        ],
        footer: { text: "SEU Benefício 2027 · PromissePay" },
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

/** Notifica que um pagamento foi confirmado (chamado pelo webhook da PromissePay) */
export async function notificarPagamentoConfirmado(params: {
  transacaoId: string;
  valor: number; // em centavos
  status: string;
  payerName?: string | null;
  payerDocument?: string | null;
  payerBank?: string | null;
  paidAt?: string | null;
  endToEnd?: string | null;
}): Promise<void> {
  const { transacaoId, valor, status, payerName, payerDocument, payerBank, paidAt, endToEnd } =
    params;

  const paidDate = paidAt ? new Date(paidAt).toLocaleString("pt-BR") : "agora";

  await sendDiscordEmbed({
    embeds: [
      {
        title: "✅ Pagamento Confirmado!",
        color: 0x22c55e, // verde
        fields: [
          { name: "💰 Valor", value: brl(valor), inline: true },
          { name: "📋 Status", value: status.toUpperCase(), inline: true },
          { name: "🆔 Transação", value: `\`${transacaoId}\``, inline: true },
          ...(payerName ? [{ name: "👤 Pagador", value: payerName, inline: true }] : []),
          ...(payerDocument ? [{ name: "📄 Documento", value: payerDocument, inline: true }] : []),
          ...(payerBank ? [{ name: "🏦 Banco", value: payerBank, inline: true }] : []),
          { name: "🕐 Pago em", value: paidDate, inline: true },
          ...(endToEnd ? [{ name: "🔗 End-to-End", value: `\`${endToEnd}\``, inline: false }] : []),
        ],
        footer: { text: "SEU Benefício 2027 · PromissePay" },
        timestamp: new Date().toISOString(),
      },
    ],
  });
}
