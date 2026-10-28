/**
 * API Route: POST /api/webhook/promissepay
 *
 * Endpoint público que a PromissePay chama quando o pagamento PIX é confirmado.
 * Recebe o payload da PromissePay, processa e armazena o status.
 *
 * Cadastre esta URL no campo "webhook" ao criar a transação:
 *   https://seu-dominio.com/api/webhook/promissepay
 */
import { eventHandler, readBody } from "h3";
import { notificarPagamentoConfirmado } from "../../../src/lib/discord-notify";
import { setPaymentStatus, type WebhookPaymentData } from "../../../src/lib/webhook-store";

const PAID_STATUSES = [
  "completed",
  "paid",
  "approved",
  "pago",
  "sucesso",
  "confirmed",
  "success",
];

export default eventHandler(async (event) => {
  const body = await readBody(event);

  console.log("[Webhook API] POST /api/webhook/promissepay recebido");
  console.log("[Webhook API] Payload:", JSON.stringify(body));

  const transactionId = String(body?.id ?? "");
  const status = String(body?.status ?? "unknown").toLowerCase();
  const paid = PAID_STATUSES.includes(status);

  if (!transactionId) {
    console.warn("[Webhook API] ID da transação não informado!");
    return { success: false, message: "ID da transação não informado" };
  }

  const paymentData: WebhookPaymentData = {
    id: transactionId,
    status,
    paid,
    amount: Number(body?.amount ?? 0),
    paidAt: body?.paidAt ?? null,
    payerName: body?.payer?.name ?? null,
    payerDocument: body?.payer?.document ?? null,
    payerBank: body?.payer?.bank ?? null,
    endToEnd: body?.end_to_end ?? null,
    receivedAt: new Date().toISOString(),
  };

  setPaymentStatus(transactionId, paymentData);

  console.log(
    `[Webhook API] ✅ Pagamento ${transactionId} — Status: ${status} — Pago: ${paid}`,
  );

  // Notifica Discord se o pagamento foi confirmado (fire-and-forget)
  if (paid) {
    notificarPagamentoConfirmado({
      transacaoId: transactionId,
      valor: paymentData.amount,
      status,
      payerName: paymentData.payerName,
      payerDocument: paymentData.payerDocument,
      payerBank: paymentData.payerBank,
      paidAt: paymentData.paidAt,
      endToEnd: paymentData.endToEnd,
    }).catch((err) => console.error("[Discord] Erro ao notificar confirmado:", err));
  }

  // PromissePay exige resposta 200 OK
  return { success: true, message: "Webhook processado com sucesso" };
});
