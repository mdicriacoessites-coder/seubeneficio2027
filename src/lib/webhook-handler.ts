/**
 * Webhook handler para receber notificações da PromissePay.
 *
 * Quando um pagamento PIX é confirmado, a PromissePay envia um POST
 * para esta URL com os dados da transação.
 *
 * Endpoint: POST /api/webhook/promissepay
 *
 * Payload esperado da PromissePay:
 * {
 *   "id": "4372abe4b94147718e951e7ebdfde887",
 *   "status": "paid",
 *   "amount": 1500,
 *   "payer": { "name": "...", "document": "...", "bank": "..." },
 *   "paidAt": "2026-01-05T00:46:55.588Z",
 *   "end_to_end": "E7890760720260105034643Fw6lj4C4a",
 *   ...
 * }
 */
import { createServerFn } from "@tanstack/react-start";
import {
  setPaymentStatus,
  getPaymentStatus,
  type WebhookPaymentData,
} from "./webhook-store";

// Statuses considerados como "pago"
const PAID_STATUSES = [
  "completed",
  "paid",
  "approved",
  "pago",
  "sucesso",
  "confirmed",
  "success",
];

/**
 * Server function que recebe o webhook da PromissePay.
 * A URL que você deve cadastrar na PromissePay é:
 *   https://seu-dominio.com/_server/?_serverFnId=...
 *
 * Porém, como a PromissePay precisa de uma URL limpa,
 * usamos a API route /api/webhook/promissepay que redireciona para cá.
 */
export const handlePromissePayWebhook = createServerFn({ method: "POST" })
  .validator(
    (data: {
      id?: string;
      status?: string;
      amount?: number;
      payer?: { name?: string; document?: string; bank?: string };
      paidAt?: string;
      end_to_end?: string;
      createdAt?: string;
      updatedAt?: string;
      expirationDate?: string;
      fee?: number;
      webhookUrl?: string;
      split_user?: string;
      split_tax?: number;
      storeId?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const transactionId = String(data?.id ?? "");
    const status = String(data?.status ?? "unknown").toLowerCase();
    const paid = PAID_STATUSES.includes(status);

    console.log(
      `[Webhook PromissePay] Recebido! ID: ${transactionId}, Status: ${status}, Pago: ${paid}`,
    );
    console.log("[Webhook PromissePay] Payload completo:", JSON.stringify(data));

    if (!transactionId) {
      console.warn("[Webhook PromissePay] ID da transação não informado!");
      return { success: false, message: "ID da transação não informado" };
    }

    const paymentData: WebhookPaymentData = {
      id: transactionId,
      status,
      paid,
      amount: Number(data?.amount ?? 0),
      paidAt: data?.paidAt ?? null,
      payerName: data?.payer?.name ?? null,
      payerDocument: data?.payer?.document ?? null,
      payerBank: data?.payer?.bank ?? null,
      endToEnd: data?.end_to_end ?? null,
      receivedAt: new Date().toISOString(),
    };

    // Salva no store
    setPaymentStatus(transactionId, paymentData);

    console.log(
      `[Webhook PromissePay] ✅ Pagamento ${transactionId} processado e salvo!`,
    );

    // Retorna 200 OK conforme exigido pela PromissePay
    return { success: true, message: "Webhook recebido com sucesso" };
  });

/**
 * Server function para o frontend consultar se um pagamento
 * foi confirmado via webhook (alternativa ao polling da API).
 */
export const consultarStatusWebhook = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    if (!data.id) return { status: "unknown", paid: false, data: null };

    const payment = getPaymentStatus(data.id);

    if (!payment) {
      return { status: "pending", paid: false, data: null };
    }

    return {
      status: payment.status,
      paid: payment.paid,
      data: payment,
    };
  });
