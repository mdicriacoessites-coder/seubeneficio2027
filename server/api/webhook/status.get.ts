/**
 * API Route: GET /api/webhook/status?id=TRANSACTION_ID
 *
 * O frontend usa este endpoint para verificar se o pagamento
 * foi confirmado via webhook (em vez de polling na API da PromissePay).
 */
import { eventHandler, getQuery } from "h3";
import { getPaymentStatus } from "../../lib/webhook-store";

export default eventHandler(async (event) => {
  const query = getQuery(event);
  const id = String(query.id ?? "");

  if (!id) {
    return { status: "unknown", paid: false, data: null };
  }

  const payment = getPaymentStatus(id);

  if (!payment) {
    return { status: "pending", paid: false, data: null };
  }

  return {
    status: payment.status,
    paid: payment.paid,
    data: payment,
  };
});
