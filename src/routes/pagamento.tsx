import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Lock,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { brl } from "@/lib/pricing";
import { criarCobrancaPromissePay, consultarTransacaoPromissePay, consultarStatusWebhook } from "@/lib/promissepay";

export const Route = createFileRoute("/pagamento")({
  head: () => ({
    meta: [
      { title: "Pagamento da Taxa Cadastral | SEU Benefício 2027" },
      { name: "description", content: "Pagamento seguro e instantâneo via PIX da taxa cadastral SEU Benefício 2027." },
    ],
  }),
  component: PagamentoPage,
});

const PROGRESS_KEY = "seubeneficio-progress";

function PagamentoPage() {
  const [f, setF] = useState({
    nome: "",
    tel: "",
    cep: "",
    rua: "",
    num: "",
    bairro: "",
    cidade: "",
    uf: "",
  });

  const [loadingCep, setLoadingCep] = useState(false);
  const [pago, setPago] = useState(false);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [gerandoPix, setGerandoPix] = useState(false);
  const [transacaoId, setTransacaoId] = useState("");
  const [pixCode, setPixCode] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false);

  const valor = 15;

  // Carrega respostas salvas do questionário
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(PROGRESS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setF((prev) => ({
          ...prev,
          cidade: parsed.city || prev.cidade,
          uf: parsed.uf || prev.uf,
        }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  const buscarCep = async () => {
    const d = f.cep.replace(/\D/g, "");
    if (d.length !== 8) return;
    try {
      setLoadingCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const r = await res.json();
      if (r.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      setF((x) => ({
        ...x,
        rua: r.logradouro || x.rua,
        bairro: r.bairro || x.bairro,
        cidade: r.localidade || x.cidade,
        uf: r.uf || x.uf,
      }));
      toast.success("Endereço preenchido com sucesso!");
    } catch {
      toast.error("Não foi possível consultar o CEP");
    } finally {
      setLoadingCep(false);
    }
  };

  // Polling automático: verifica status via webhook (rápido) + API da PromissePay (fallback)
  useEffect(() => {
    if (!transacaoId || pagamentoConfirmado) return;
    const interval = setInterval(async () => {
      try {
        // 1. Primeiro verifica via webhook (mais rápido — dados locais)
        const webhookResult = await consultarStatusWebhook({ data: { id: transacaoId } });
        if (webhookResult.paid) {
          setPagamentoConfirmado(true);
          toast.success("Pagamento confirmado via webhook PromissePay! ✅");
          clearInterval(interval);
          return;
        }

        // 2. Fallback: consulta diretamente na API da PromissePay
        const { paid } = await consultarTransacaoPromissePay({ data: { id: transacaoId } });
        if (paid) {
          setPagamentoConfirmado(true);
          toast.success("Pagamento confirmado pela PromissePay! ✅");
          clearInterval(interval);
        }
      } catch {
        /* silencioso */
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [transacaoId, pagamentoConfirmado]);

  const gerarPix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.nome.trim() || !f.tel.trim()) {
      toast.error("Preencha seu nome completo e WhatsApp para continuar.");
      return;
    }

    try {
      setGerandoPix(true);
      const res = await criarCobrancaPromissePay({ data: { amountInCents: 1500, nome: f.nome, telefone: f.tel } });
      if (!res.pixCopiaECola && !res.qrCodeUrl) {
        throw new Error("PromissePay não retornou dados do PIX. Tente novamente.");
      }
      setTransacaoId(res.id);
      setPixCode(res.pixCopiaECola);
      setQrUrl(res.qrCodeUrl);
      setPago(true);
      toast.success("PIX gerado com sucesso pela PromissePay!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setGerandoPix(false);
    }
  };

  const copiarPix = () => {
    if (navigator?.clipboard?.writeText && pixCode) {
      navigator.clipboard.writeText(pixCode);
      setPixCopiado(true);
      toast.success("Código PIX copiado para a área de transferência!");
      setTimeout(() => setPixCopiado(false), 3000);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8 pb-24">
      {/* Topo / Voltar */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground transition hover:bg-muted"
        >
          <ArrowLeft className="size-4" /> Voltar ao resumo
        </Link>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Lock className="size-3.5 text-primary" /> Pagamento 100% Seguro
        </div>
      </div>

      <header className="mb-8 text-center">
        <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
          <Sparkles className="size-3.5" /> Gateway PromissePay
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Finalizar Emissão Cadastral
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Efetue o pagamento da taxa cadastral de <strong>{brl(valor)}</strong> via <strong>PIX</strong> para concluir seu processo com aprovação imediata.
        </p>
      </header>

      {pago ? (
        /* Tela de PIX Gerado */
        <div className="shadow-soft space-y-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="text-center">
            {pagamentoConfirmado ? (
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-success text-success-foreground">
                <Check className="size-9 stroke-[3]" />
              </div>
            ) : (
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                <QrCode className="size-9" />
              </div>
            )}

            <h2 className="text-2xl font-extrabold text-foreground">
              {pagamentoConfirmado ? "Pagamento Confirmado!" : "Pague com PIX"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {pagamentoConfirmado ? (
                <>O gateway PromissePay confirmou o recebimento da taxa de <strong>{brl(valor)}</strong> com sucesso!</>
              ) : (
                <>Escaneie o QR Code abaixo no app do seu banco ou copie o código Copia e Cola.</>
              )}
            </p>
          </div>

          {!pagamentoConfirmado && (
            <>
              {/* Badge Aguardando */}
              <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                {transacaoId ? `PromissePay #${transacaoId} · Aguardando pagamento` : "Aguardando pagamento via PIX"}
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-muted/30 p-6">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt={`QR Code PIX PromissePay R$ ${valor.toFixed(2)}`}
                    className="size-56 rounded-xl bg-white p-2 shadow-md transition hover:scale-105"
                  />
                ) : (
                  <div className="flex size-56 items-center justify-center rounded-xl bg-muted">
                    <Loader2 className="size-8 animate-spin text-primary" />
                  </div>
                )}
                <p className="mt-3 text-xs font-semibold text-muted-foreground">
                  Valor a pagar: <strong className="text-foreground">{brl(valor)}</strong>
                </p>
              </div>

              {/* Copia e Cola */}
              {pixCode && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Código PIX Copia e Cola
                  </label>
                  <div className="relative">
                    <input
                      readOnly
                      value={pixCode}
                      className="shadow-soft h-12 w-full rounded-xl border border-input bg-muted/40 pl-3 pr-28 font-mono text-xs text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                    />
                    <button
                      type="button"
                      onClick={copiarPix}
                      className="absolute right-1.5 top-1.5 flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground shadow transition hover:opacity-95 active:scale-95"
                    >
                      {pixCopiado ? (
                        <>
                          <Check className="size-3.5 stroke-[3]" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" /> Copiar PIX
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Instruções */}
              <div className="rounded-2xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
                <h3 className="mb-2 font-bold text-foreground">Como pagar:</h3>
                <ol className="list-inside list-decimal space-y-1">
                  <li>Abra o aplicativo do seu banco ou carteira digital.</li>
                  <li>Escolha pagar com <strong>PIX</strong> (QR Code ou Copia e Cola).</li>
                  <li>Cole o código copiado ou aponte a câmera para o QR Code.</li>
                  <li>Confira o valor de <strong>{brl(valor)}</strong> e confirme o pagamento.</li>
                  <li>A PromissePay confirmará seu pagamento automaticamente nesta tela.</li>
                </ol>
              </div>
            </>
          )}

          {pagamentoConfirmado && (
            <div className="rounded-2xl border border-success/30 bg-success/10 p-5 text-center text-sm font-semibold text-success">
              ✓ Processo concluído com êxito! Suas informações foram atualizadas.
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setPago(false)}
              className="h-10 w-full text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Alterar dados do cadastro
            </button>
          </div>
        </div>
      ) : (
        /* Formulário de Cadastro e Pagamento */
        <form onSubmit={gerarPix} className="shadow-soft space-y-5 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-2 border-b border-border pb-4 text-xs">
            <span className="size-2 rounded-full bg-success animate-pulse" />
            <span className="font-semibold text-muted-foreground">
              Gateway Oficial: <strong>PromissePay</strong>
            </span>
            <span className="ml-auto rounded bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
              Operacional ✓
            </span>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Nome completo
            </label>
            <input
              required
              placeholder="Digite seu nome completo"
              value={f.nome}
              onChange={set("nome")}
              className="shadow-soft h-12 w-full rounded-xl border border-input bg-card px-4 font-semibold text-card-foreground placeholder:font-normal placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              WhatsApp
            </label>
            <input
              required
              inputMode="tel"
              placeholder="(DDD) 99999-9999"
              value={f.tel}
              onChange={set("tel")}
              className="shadow-soft h-12 w-full rounded-xl border border-input bg-card px-4 font-semibold text-card-foreground placeholder:font-normal placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                CEP (opcional)
              </label>
              {loadingCep && <span className="text-xs font-medium text-primary">Consultando CEP...</span>}
            </div>
            <input
              inputMode="numeric"
              maxLength={9}
              placeholder="00000-000"
              value={f.cep}
              onChange={set("cep")}
              onBlur={buscarCep}
              className="shadow-soft h-12 w-full rounded-xl border border-input bg-card px-4 font-semibold text-card-foreground placeholder:font-normal placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Rua</label>
              <input
                placeholder="Rua / Logradouro"
                value={f.rua}
                onChange={set("rua")}
                className="shadow-soft h-12 w-full rounded-xl border border-input bg-card px-4 font-semibold text-card-foreground placeholder:font-normal placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Número</label>
              <input
                placeholder="Nº"
                value={f.num}
                onChange={set("num")}
                className="shadow-soft h-12 w-full rounded-xl border border-input bg-card px-4 font-semibold text-card-foreground placeholder:font-normal placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Bairro</label>
              <input
                placeholder="Bairro"
                value={f.bairro}
                onChange={set("bairro")}
                className="shadow-soft h-12 w-full rounded-xl border border-input bg-card px-4 font-semibold text-card-foreground placeholder:font-normal placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Cidade</label>
              <input
                placeholder="Cidade"
                value={f.cidade}
                onChange={set("cidade")}
                className="shadow-soft h-12 w-full rounded-xl border border-input bg-card px-4 font-semibold text-card-foreground placeholder:font-normal placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">UF</label>
              <input
                maxLength={2}
                placeholder="UF"
                value={f.uf}
                onChange={set("uf")}
                className="shadow-soft h-12 w-full rounded-xl border border-input bg-card px-4 font-semibold uppercase text-card-foreground placeholder:font-normal placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
              />
            </div>
          </div>

          {/* Seção Exclusiva PIX (Cartão e Boleto Removidos) */}
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/[0.04] p-4">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <QrCode className="size-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-foreground">Forma de Pagamento: PIX Instantâneo</p>
                <p className="text-xs text-muted-foreground">Aprovação imediata e liberação automática via PromissePay</p>
              </div>
              <span className="ml-auto rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
                Aprovação 24/7
              </span>
            </div>
          </div>

          {/* Resumo do Valor */}
          <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Taxa de Emissão e Atualização 2027</span>
              <span className="font-semibold text-foreground">{brl(valor)}</span>
            </div>
            <div className="mt-1 flex justify-between text-muted-foreground">
              <span>Processamento PromissePay</span>
              <span className="font-semibold text-success">Grátis</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-base font-extrabold text-foreground">
              <span>Total a pagar via PIX</span>
              <span className="font-display text-2xl font-black text-primary">{brl(valor)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={gerandoPix}
            className="shadow-primary flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-extrabold tracking-wide text-primary-foreground transition hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-50"
          >
            {gerandoPix ? (
              <>
                <Loader2 className="size-5 animate-spin" /> Conectando à PromissePay...
              </>
            ) : (
              <>
                GERAR PIX AGORA — {brl(valor)}
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-4 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Lock className="size-3.5 text-primary" /> Gateway PromissePay Seguro
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-primary" /> Criptografia 256 bits
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
