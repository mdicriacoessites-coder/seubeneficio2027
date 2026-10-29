import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, ClipboardList, Clock, FileText,
  Home, Lock, MapPin, Pencil, QrCode, ShieldCheck, Sparkles, Users, CheckCircle2,
} from "lucide-react";
import { brl } from "@/lib/pricing";
import { SiteHeader } from "@/components/SiteHeader";
import { InstitutionalBanner } from "@/components/InstitutionalBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { trackPixel } from "@/lib/meta-pixel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SEU Benefício 2027 — Triagem e Regularização Cadastral" },
      { name: "description", content: "Organize seus dados e verifique sua situação no Bolsa Família e CadÚnico para 2027." },
      { property: "og:title", content: "SEU Benefício 2027 — Triagem e Regularização Cadastral" },
      { property: "og:description", content: "Responda a perguntas simples e organize suas informações para evitar pendências no seu benefício." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const UFS: [string, string][] = [
  ["AC","Acre"],["AL","Alagoas"],["AP","Amapá"],["AM","Amazonas"],["BA","Bahia"],["CE","Ceará"],["DF","Distrito Federal"],["ES","Espírito Santo"],["GO","Goiás"],["MA","Maranhão"],["MT","Mato Grosso"],["MS","Mato Grosso do Sul"],["MG","Minas Gerais"],["PA","Pará"],["PB","Paraíba"],["PR","Paraná"],["PE","Pernambuco"],["PI","Piauí"],["RJ","Rio de Janeiro"],["RN","Rio Grande do Norte"],["RS","Rio Grande do Sul"],["RO","Rondônia"],["RR","Roraima"],["SC","Santa Catarina"],["SP","São Paulo"],["SE","Sergipe"],["TO","Tocantins"],
];

const BENEFIT = [
  "Sim, recebo o Bolsa Família.",
  "Sim, recebo outro benefício social.",
  "Recebo mais de um benefício.",
  "Não recebo nenhum benefício atualmente.",
  "Estou aguardando uma resposta sobre meu cadastro.",
];

const CAD = [
  "Sim, meu cadastro está atualizado.",
  "Sim, mas não sei se está atualizado.",
  "Tenho cadastro, mas preciso atualizar.",
  "Não possuo cadastro.",
  "Não tenho certeza.",
];

const PEOPLE = [
  "Moro sozinho(a).",
  "2 pessoas.",
  "3 pessoas.",
  "4 pessoas.",
  "5 pessoas ou mais.",
];

const KIDS = ["Sim.", "Não.", "Prefiro não informar."];

type Answers = { uf: string; city: string; benefit: string; cad: string; people: string; kids: string };
const EMPTY: Answers = { uf: "", city: "", benefit: "", cad: "", people: "", kids: "" };
const KEY = "seubeneficio-progress";
const TOTAL = 4;

type Screen = 1 | 2 | 3 | 4 | "review" | "result";

function Index() {
  const [screen, setScreen] = useState<Screen>(1);
  const [a, setA] = useState<Answers>(EMPTY);
  const [returnToReview, setReturnToReview] = useState(false);

  useEffect(() => {
    try {
      const s = sessionStorage.getItem(KEY);
      if (s) setA({ ...EMPTY, ...JSON.parse(s) });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(KEY, JSON.stringify(a));
  }, [a]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [screen]);

  const set = (k: keyof Answers, v: string) => setA((p) => ({ ...p, [k]: v }));
  const next = (n: Screen) => {
    if (returnToReview) {
      setReturnToReview(false);
      setScreen("review");
    } else {
      setScreen(n);
    }
  };
  const edit = (n: Screen) => {
    setReturnToReview(true);
    setScreen(n);
  };

  const step = typeof screen === "number" ? screen : TOTAL;
  const back = () => {
    if (screen === "result") return setScreen("review");
    if (screen === "review") return setScreen(4);
    if (screen === 1) return;
    setScreen(((screen as number) - 1) as Screen);
  };

  const progressPercent = typeof screen === "number" ? ((step - 1) / TOTAL) * 100 + 10 : 100;
  const timeRemaining = Math.max(1, TOTAL - step + 1) * 25;

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#202020] flex flex-col justify-between selection:bg-[#FCEBED] selection:text-[#C8102E]">
      <div>
        {/* Cabeçalho Premium Vermelho com Branco */}
        <SiteHeader
          canBack={screen !== 1}
          onBack={back}
          step={typeof screen === "number" ? step : undefined}
          totalSteps={TOTAL}
          timeRemaining={typeof screen === "number" ? timeRemaining : undefined}
          stepLabel={screen === "review" ? "Revisão dos Dados" : screen === "result" ? "Resumo Concluído" : undefined}
          showProgress={true}
          progressPercent={progressPercent}
        />

        <main key={String(screen)} className="animate-step mx-auto max-w-2xl px-4 pb-16 pt-6 sm:pt-8">
          {/* Banner Institucional com as duas Logos integradas */}
          <InstitutionalBanner compact={screen === "review" || screen === "result"} />

          {/* Etapas do Questionário */}
          {screen === 1 && <StepLocation a={a} set={set} onNext={() => next(2)} />}
          {screen === 2 && (
            <Question
              title="Você recebe atualmente algum benefício social?"
              subtitle="Informe sua situação atual para adequarmos as diretrizes de regularização do Bolsa Família 2027."
            >
              <Options options={BENEFIT} value={a.benefit} onChange={(v) => set("benefit", v)} />
              <Continue disabled={!a.benefit} onClick={() => next(3)} />
            </Question>
          )}
          {screen === 3 && (
            <Question
              title="Você possui inscrição no Cadastro Único (CadÚnico)?"
              subtitle="O CadÚnico é o registro obrigatório para concessão e manutenção de benefícios sociais."
            >
              <Options options={CAD} value={a.cad} onChange={(v) => set("cad", v)} />
              <div className="mt-5 flex gap-3 rounded-2xl border border-[#C8102E]/20 bg-[#FCEBED] p-4 text-xs sm:text-sm text-[#A50D24]">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#C8102E]" />
                <p className="leading-relaxed">
                  <strong>Atenção ao CadÚnico:</strong> Manter os dados atualizados a cada 2 anos (ou sempre que mudar endereço, renda ou membros da família) previne o bloqueio preventivo do Bolsa Família. A emissão cadastral digital ajuda você a conferir suas informações.
                </p>
              </div>
              <Continue disabled={!a.cad} onClick={() => next(4)} />
            </Question>
          )}
          {screen === 4 && (
            <Question
              title="Quantas pessoas moram na sua residência?"
              subtitle="A composição da família define faixas de renda per capita e benefícios complementares."
            >
              <Options options={PEOPLE} value={a.people} onChange={(v) => set("people", v)} />
              <div className="mt-8">
                <h3 className="text-base sm:text-lg font-bold text-[#202020]">
                  Há crianças, adolescentes ou gestantes na residência?{" "}
                  <span className="text-xs font-normal text-[#666666]">(opcional)</span>
                </h3>
                <div className="mt-3">
                  <Options options={KIDS} value={a.kids} onChange={(v) => set("kids", v)} compact />
                </div>
              </div>
              <Continue disabled={!a.people} onClick={() => next("review")} label="REVISAR INFORMAÇÕES" />
            </Question>
          )}
          {screen === "review" && <Review a={a} edit={edit} onNext={() => setScreen("result")} />}
          {screen === "result" && (
            <Result
              a={a}
              onRestart={() => {
                setA(EMPTY);
                setScreen(1);
              }}
            />
          )}
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}

function Question({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby="question-title" className="rounded-2xl border border-[#E5E5E5] bg-white p-5 sm:p-7 shadow-soft">
      <div className="mb-6">
        <h2
          id="question-title"
          className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#202020]"
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-xs sm:text-sm text-[#666666]">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function Options({
  options,
  value,
  onChange,
  compact,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <div role="radiogroup" className={compact ? "grid gap-2.5 sm:grid-cols-3" : "grid gap-3"}>
      {options.map((o) => {
        const sel = value === o;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={sel}
            onClick={() => onChange(o)}
            className={`flex items-center gap-3.5 rounded-xl border-2 p-3.5 sm:p-4 text-left font-semibold transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] ${
              sel
                ? "border-[#C8102E] bg-[#FCEBED] text-[#A50D24] shadow-sm"
                : "border-[#E5E5E5] bg-white text-[#202020] hover:border-[#C8102E]/40 hover:bg-[#F5F5F5]"
            }`}
          >
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition-all ${
                sel
                  ? "border-[#C8102E] bg-[#C8102E] text-white"
                  : "border-[#DCDCDC] bg-white text-transparent"
              }`}
            >
              {sel && <Check className="size-3.5 stroke-[3]" />}
            </span>
            <span className="text-sm leading-snug">{o}</span>
          </button>
        );
      })}
    </div>
  );
}

function Continue({
  disabled,
  onClick,
  label = "CONTINUAR",
}: {
  disabled?: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#C8102E] text-base font-extrabold tracking-wide text-white shadow-primary transition-all duration-200 hover:bg-[#A50D24] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] focus-visible:ring-offset-2"
    >
      {label} <ArrowRight className="size-5" />
    </button>
  );
}

function StepLocation({
  a,
  set,
  onNext,
}: {
  a: Answers;
  set: (k: keyof Answers, v: string) => void;
  onNext: () => void;
}) {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState(a.city);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!a.uf) return;
    setLoading(true);
    setError("");
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${a.uf}/municipios`)
      .then((r) => r.json())
      .then((d: { nome: string }[]) => setCities(d.map((c) => c.nome)))
      .catch(() => setError("Não foi possível carregar as cidades. Verifique sua conexão."))
      .finally(() => setLoading(false));
  }, [a.uf]);

  const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const matches = useMemo(
    () => (q ? cities.filter((c) => norm(c).includes(norm(q))).slice(0, 8) : []),
    [q, cities],
  );
  const valid = a.uf && cities.includes(a.city);

  return (
    <Question
      title="Em qual estado e cidade você reside atualmente?"
      subtitle="Selecione sua localidade para vincularmos ao calendário de pagamentos e agências do seu município."
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#555555]" htmlFor="uf">
            Estado (UF)
          </label>
          <select
            id="uf"
            value={a.uf}
            onChange={(e) => {
              set("uf", e.target.value);
              set("city", "");
              setQ("");
            }}
            className="h-12 sm:h-14 w-full rounded-xl border border-[#E5E5E5] bg-white px-4 font-semibold text-[#202020] transition-colors focus:border-[#C8102E] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20"
          >
            <option value="">Selecione seu estado...</option>
            {UFS.map(([s, n]) => (
              <option key={s} value={s}>
                {n} ({s})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#555555]">
            Cidade / Município
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#C8102E]" />
            <input
              aria-label="Cidade"
              disabled={!a.uf || loading}
              value={q}
              autoComplete="off"
              placeholder={
                !a.uf
                  ? "Selecione o estado acima primeiro"
                  : loading
                  ? "Carregando cidades do IBGE..."
                  : "Digite o nome da sua cidade"
              }
              onChange={(e) => {
                setQ(e.target.value);
                set("city", "");
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              className="h-12 sm:h-14 w-full rounded-xl border border-[#E5E5E5] bg-white pl-12 pr-4 font-semibold text-[#202020] placeholder:font-normal placeholder:text-[#888888] disabled:bg-[#F5F5F5] disabled:opacity-60 transition-colors focus:border-[#C8102E] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20"
            />
            {open && matches.length > 0 && !a.city && (
              <ul
                role="listbox"
                className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[#E5E5E5] bg-white p-1 shadow-lg"
              >
                {matches.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      onMouseDown={() => {
                        set("city", c);
                        setQ(c);
                        setOpen(false);
                      }}
                      className="w-full rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-[#202020] hover:bg-[#FCEBED] hover:text-[#A50D24] transition-colors"
                    >
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {error && <p className="mt-1.5 text-xs font-bold text-[#C8102E]">{error}</p>}
          {q && !a.city && !loading && cities.length > 0 && !open && (
            <p className="mt-1.5 text-xs font-semibold text-[#C8102E]">
              Selecione uma cidade na lista para validar seu município.
            </p>
          )}
        </div>
      </div>

      <Continue disabled={!valid} onClick={onNext} />
    </Question>
  );
}

function Review({
  a,
  edit,
  onNext,
}: {
  a: Answers;
  edit: (s: Screen) => void;
  onNext: () => void;
}) {
  const uf = UFS.find(([s]) => s === a.uf)?.[1];
  const rows: { icon: typeof MapPin; label: string; value: string; step: Screen }[] = [
    { icon: MapPin, label: "Localidade e Município", value: `${a.city} — ${uf ?? a.uf}`, step: 1 },
    { icon: FileText, label: "Situação do Benefício", value: a.benefit, step: 2 },
    { icon: ClipboardList, label: "Situação no CadÚnico", value: a.cad, step: 3 },
    {
      icon: Users,
      label: "Composição Familiar",
      value: `${a.people}${a.kids ? ` · Dependentes/Crianças: ${a.kids}` : ""}`,
      step: 4,
    },
  ];

  return (
    <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 sm:p-7 shadow-soft">
      <div className="mb-6 flex items-center justify-between border-b border-[#E5E5E5] pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#202020]">
            Confira suas informações
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-[#666666]">
            Verifique se todos os dados declarados estão corretos antes de emitir o resumo.
          </p>
        </div>
        <div className="hidden sm:block">
          <span className="rounded-full bg-[#FCEBED] px-3 py-1 text-xs font-bold text-[#A50D24]">
            Revisão
          </span>
        </div>
      </div>

      <div className="grid gap-3">
        {rows.map(({ icon: I, label, value, step }) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 rounded-xl border border-[#E5E5E5] bg-[#F5F5F5] p-4 transition hover:border-[#C8102E]/30"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#FCEBED] text-[#C8102E]">
                <I className="size-4.5" />
              </span>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">{label}</div>
                <div className="mt-0.5 text-sm font-bold text-[#202020]">{value}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => edit(step)}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#C8102E] bg-white px-2.5 py-1 text-xs font-bold text-[#C8102E] transition hover:bg-[#FCEBED] active:scale-95"
            >
              <Pencil className="size-3" /> EDITAR
            </button>
          </div>
        ))}
      </div>

      <Continue onClick={onNext} label="VER RESUMO E PRÓXIMOS PASSOS" />
    </section>
  );
}

function Chip({ icon: I, t }: { icon: typeof MapPin; t: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#E5E5E5] bg-[#F5F5F5] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#202020]">
      <I className="size-4 shrink-0 text-[#C8102E]" />
      <span className="truncate">{t}</span>
    </div>
  );
}

function Result({ a, onRestart }: { a: Answers; onRestart?: () => void }) {
  useEffect(() => {
    // Funil: ViewContent disparado quando o usuário visualiza o resumo com a oferta comercial de R$ 15,00
    trackPixel("ViewContent", {
      content_name: "Regularização Cadastral 2027",
      content_type: "product",
      value: 15.0,
      currency: "BRL",
    });
  }, []);

  return (
    <section className="space-y-6">
      {/* Card Principal de Resumo */}
      <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 sm:p-8 text-center shadow-soft">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-[#FCEBED] text-[#C8102E] border border-[#C8102E]/20">
          <FileText className="size-8 stroke-[2.5]" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="size-3.5" /> Triagem Concluída com Sucesso
        </div>

        <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-[#202020]">
          Seu resumo cadastral 2027 está pronto
        </h2>

        <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm text-[#555555] leading-relaxed">
          Suas informações foram agrupadas com base nos critérios do <strong>Programa Bolsa Família</strong> e <strong>CadÚnico</strong>. Siga os passos abaixo para garantir seu comprovante com aprovação imediata via PIX.
        </p>

        <div className="mt-6 grid gap-2.5 text-left text-sm sm:grid-cols-2">
          <Chip icon={MapPin} t={`${a.city} — ${a.uf}`} />
          <Chip icon={Users} t={a.people} />
          <Chip icon={ClipboardList} t={a.cad} />
          <Chip icon={Home} t={a.benefit} />
        </div>
      </div>

      {/* O que acontece agora? */}
      <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 sm:p-7 shadow-soft">
        <h3 className="mb-4 text-base sm:text-lg font-black text-[#202020] flex items-center gap-2">
          <Sparkles className="size-5 text-[#C8102E]" />
          Como funciona a emissão cadastral:
        </h3>
        <ol className="grid gap-3">
          <li className="flex gap-3.5 rounded-xl border border-[#E5E5E5] bg-[#F5F5F5] p-3.5 sm:p-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#C8102E] text-xs font-black text-white">
              1
            </span>
            <div className="pt-0.5">
              <p className="text-sm font-bold text-[#202020]">Preencha seus dados de contato</p>
              <p className="mt-0.5 text-xs text-[#555555]">
                Na próxima tela, informe seu nome completo e WhatsApp para vincular ao comprovante de emissão.
              </p>
            </div>
          </li>
          <li className="flex gap-3.5 rounded-xl border border-[#E5E5E5] bg-[#F5F5F5] p-3.5 sm:p-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#C8102E] text-xs font-black text-white">
              2
            </span>
            <div className="pt-0.5">
              <p className="text-sm font-bold text-[#202020]">Confirmação instantânea por mensagem</p>
              <p className="mt-0.5 text-xs text-[#555555]">
                O número de WhatsApp cadastrado receberá o espelho do cadastro organizado e orientações oficiais de atualização.
              </p>
            </div>
          </li>
          <li className="flex gap-3.5 rounded-xl border border-[#E5E5E5] bg-[#F5F5F5] p-3.5 sm:p-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#C8102E] text-xs font-black text-white">
              3
            </span>
            <div className="pt-0.5">
              <p className="text-sm font-bold text-[#202020]">Pagamento único via PIX PromissePay</p>
              <p className="mt-0.5 text-xs text-[#555555]">
                Escaneie o QR Code ou use o Copia e Cola para pagar a taxa administrativa de {brl(15)}. A liberação é instantânea 24/7.
              </p>
            </div>
          </li>
        </ol>
      </div>

      {/* Card para Avançar para a Página de Pagamento PIX */}
      <div className="space-y-5 rounded-2xl border-2 border-[#C8102E] bg-white p-6 sm:p-8 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E5E5] pb-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FCEBED] px-3 py-1 text-xs font-bold text-[#A50D24]">
            <Sparkles className="size-3.5 text-[#C8102E]" /> Taxa Administrativa Cadastral 2027
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
            <Check className="size-3.5 stroke-[3]" /> Pagamento Exclusivo via PIX
          </span>
        </div>

        <div>
          <h3 className="text-xl sm:text-2xl font-black text-[#202020]">
            Emissão e Regularização Cadastral
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[#555555] leading-relaxed">
            Garanta a emissão prioritária com protocolo digital e orientações personalizadas para manter o Bolsa Família e seus benefícios ativos ao longo de todo o ano de 2027.
          </p>
        </div>

        <div className="rounded-xl border border-[#E5E5E5] bg-[#F5F5F5] p-4 text-sm">
          <div className="flex justify-between text-xs sm:text-sm text-[#555555]">
            <span>Taxa de Emissão e Triagem Cadastral</span>
            <span className="font-bold text-[#202020]">{brl(15)}</span>
          </div>
          <div className="mt-1.5 flex justify-between text-xs sm:text-sm text-[#555555]">
            <span>Método de Pagamento</span>
            <span className="font-bold text-[#C8102E] flex items-center gap-1">
              <QrCode className="size-3.5" /> PIX Instantâneo
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#E5E5E5] pt-3 text-base font-extrabold text-[#202020]">
            <span>Total a Pagar</span>
            <span className="text-2xl font-black text-[#C8102E]">{brl(15)}</span>
          </div>
        </div>

        <Link
          to="/pagamento"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#C8102E] text-base font-black tracking-wide text-white shadow-primary transition-all duration-200 hover:bg-[#A50D24] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] focus-visible:ring-offset-2"
        >
          AVANÇAR PARA PAGAMENTO VIA PIX <ArrowRight className="size-5" />
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-xs text-[#666666]">
          <span className="flex items-center gap-1">
            <Lock className="size-3.5 text-[#C8102E]" /> Gateway PromissePay Seguro
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-[#C8102E]" /> Confirmação Imediata 24/7
          </span>
        </div>
      </div>

      {onRestart && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onRestart}
            className="text-xs font-bold text-[#666666] underline-offset-4 hover:text-[#C8102E] hover:underline transition"
          >
            Refazer questionário e limpar respostas
          </button>
        </div>
      )}
    </section>
  );
}
