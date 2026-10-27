/**
 * Utilitários para geração de Pix Estático no padrão EMVCo / BACEN (BR Code).
 * Gera o payload de "Pix Copia e Cola" 100% válido com cálculo de CRC16-CCITT.
 */

// Cálculo do CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF, sem XOR final)
export function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Formatação TLV (Tag-Length-Value) exigida pelo padrão EMVCo
export function formatTLV(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

export type PixConfig = {
  chave: string;
  nomeRecebedor?: string;
  cidadeRecebedor?: string;
  valor?: number;
  txid?: string;
  descricao?: string;
};

/**
 * Gera a string do Pix Copia e Cola no padrão oficial do Banco Central.
 */
export function gerarPixCopiaECola({
  chave,
  nomeRecebedor = "SEU BENEFICIO",
  cidadeRecebedor = "BRASILIA",
  valor = 15.0,
  txid = "TAXA15",
  descricao = "TAXA CADASTRAL",
}: PixConfig): string {
  // Limpa e normaliza a chave
  const cleanChave = chave.trim();

  // Limpa nome: sem acentos, até 25 caracteres ASCII
  const cleanNome = (nomeRecebedor || "SEU BENEFICIO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .slice(0, 25)
    .toUpperCase() || "SEU BENEFICIO";

  // Limpa cidade: sem acentos, até 15 caracteres ASCII
  const cleanCidade = (cidadeRecebedor || "BRASILIA")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .slice(0, 15)
    .toUpperCase() || "BRASILIA";

  // Limpa txid: alfanumérico, sem espaços, até 25 caracteres
  const cleanTxid = (txid || "***")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 25) || "***";

  // 00: Payload Format Indicator (versão 01)
  const p00 = formatTLV("00", "01");

  // 01: Point of Initiation Method (12 = estático reutilizável com valor fixo)
  const p01 = formatTLV("01", "12");

  // 26: Merchant Account Information (GUI + Chave + Descrição opcional)
  const gui = formatTLV("00", "br.gov.bcb.pix");
  const keyTLV = formatTLV("01", cleanChave);
  let merchantInfo = gui + keyTLV;
  if (descricao) {
    const cleanDesc = descricao
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .slice(0, 25);
    if (cleanDesc) {
      merchantInfo += formatTLV("02", cleanDesc);
    }
  }
  const p26 = formatTLV("26", merchantInfo);

  // 52: Merchant Category Code (0000 = padrão)
  const p52 = formatTLV("52", "0000");

  // 53: Transaction Currency (986 = Real brasileiro)
  const p53 = formatTLV("53", "986");

  // 54: Transaction Amount (com 2 casas decimais)
  const p54 = formatTLV("54", valor.toFixed(2));

  // 58: Country Code (BR)
  const p58 = formatTLV("58", "BR");

  // 59: Merchant Name
  const p59 = formatTLV("59", cleanNome);

  // 60: Merchant City
  const p60 = formatTLV("60", cleanCidade);

  // 62: Additional Data Field Template (ID 05: TxID)
  const txidTLV = formatTLV("05", cleanTxid);
  const p62 = formatTLV("62", txidTLV);

  // 63: CRC16 prefix (ID 63 + tamanho 04)
  const payloadSemCRC = `${p00}${p01}${p26}${p52}${p53}${p54}${p58}${p59}${p60}${p62}6304`;
  const checksum = crc16(payloadSemCRC);

  return `${payloadSemCRC}${checksum}`;
}

/**
 * Retorna a URL da imagem de QR Code escaneável de alta resolução
 */
export function getQrCodeUrl(payload: string, size = 300): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(payload)}`;
}

/**
 * URL de fallback para o QR Code em caso de falha de conexão
 */
export function getQrCodeFallbackUrl(payload: string, size = 300): string {
  return `https://quickchart.io/qr?text=${encodeURIComponent(payload)}&size=${size}&margin=2`;
}
