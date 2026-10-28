/**
 * Store em memória para status de pagamentos recebidos via webhook.
 * Em produção, considere usar Redis ou banco de dados.
 *
 * Cada entrada mapeia transactionId → dados do webhook recebido.
 */

export type WebhookPaymentData = {
  id: string;
  status: string;
  paid: boolean;
  amount: number;
  paidAt: string | null;
  payerName: string | null;
  payerDocument: string | null;
  payerBank: string | null;
  endToEnd: string | null;
  receivedAt: string; // ISO timestamp de quando o webhook foi recebido
};

// Store em memória — compartilhado entre todas as server functions
const paymentStore = new Map<string, WebhookPaymentData>();

export function setPaymentStatus(id: string, data: WebhookPaymentData): void {
  paymentStore.set(id, data);
  console.log(`[WebhookStore] Pagamento ${id} atualizado:`, JSON.stringify(data));
}

export function getPaymentStatus(id: string): WebhookPaymentData | null {
  return paymentStore.get(id) ?? null;
}

export function getAllPayments(): WebhookPaymentData[] {
  return Array.from(paymentStore.values());
}
