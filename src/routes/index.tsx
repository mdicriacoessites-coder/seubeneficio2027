import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, ClipboardList, Clock, FileText,
  Home, Lock, MapPin, Pencil, QrCode, ShieldCheck, Sparkles, Users,
} from "lucide-react";
import { brl } from "@/lib/pricing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SEU Benefício 2027 — Organize seu cadastro" },
      { name: "description", content: "Questionário gratuito e informativo para organizar suas informações sobre benefícios sociais em 2027." },
      { property: "og:title", content: "SEU Benefício 2027 — Organize seu cadastro" },
      { property: "og:description", content: "Responda a algumas perguntas e veja os próximos passos pelos canais oficiais gratuitos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const UFS: [string, string][] = [
  ["AC","Acre"],["AL","Alagoas"],["AP","Amapá"],["AM","Amazonas"],["BA","Bahia"],["CE","Ceará"],["DF","Distrito Federal"],["ES","Espírito Santo"],["GO","Goiás"],["MA","Maranhão"],["MT","Mato Grosso"],["MS","Mato Grosso do Sul"],["MG","Minas Gerais"],["PA","Pará"],["PB","Paraíba"],["PR","Paraná"],["PE","Pernambuco"],["PI","Piauí"],["RJ","Rio de Janeiro"],["RN","Rio Grande do Norte"],["RS","Rio Grande do Sul"],["RO","Rondônia"],["RR","Roraima"],["SC","Santa Catarina"],["SP","São Paulo"],["SE","Sergipe"],["TO","Tocantins"],
];

const BENEFIT = ["Sim, recebo o Bolsa Família.","Sim, recebo outro benefício social.","Recebo mais de um benefício.","Não recebo nenhum benefício atualmente.","Estou aguardando uma resposta sobre meu cadastro."];
const CAD = ["Sim, meu cadastro está atualizado.","Sim, mas não sei se está atualizado.","Tenho cadastro, mas preciso atualizar.","Não possuo cadastro.","Não tenho certeza."];
const PEOPLE = ["Moro sozinho(a).","2 pessoas.","3 pessoas.","4 pessoas.","5 pessoas ou mais."];
const KIDS = ["Sim.","Não.","Prefiro não informar."];

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
    try { const s = sessionStorage.getItem(KEY); if (s) setA({ ...EMPTY, ...JSON.parse(s) }); } catch { /* ignore */ }
  }, []);
  useEffect(() => { sessionStorage.setItem(KEY, JSON.stringify(a)); }, [a]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [screen]);

  const set = (k: keyof Answers, v: string) => setA((p) => ({ ...p, [k]: v }));
  const next = (n: Screen) => { if (returnToReview) { setReturnToReview(false); setScreen("review"); } else setScreen(n); };
  const edit = (n: Screen) => { setReturnToReview(true); setScreen(n); };

  const step = typeof screen === "number" ? screen : TOTAL;
  const back = () => {
    if (screen === "result") return setScreen("review");
    if (screen === "review") return setScreen(4);
    if (screen === 1) return;
    setScreen(((screen as number) - 1) as Screen);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <button
            onClick={back}
            disabled={screen === 1}
            aria-label="Voltar"
            className={`grid size-10 place-items-center rounded-full text-foreground transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring ${screen === 1 ? "invisible pointer-events-none" : ""}`}
          >
            <ArrowLeft className="size-5" />
          </button>
          <Logo />
          <div className="ml-auto text-right text-xs text-muted-foreground">
            {typeof screen === "number" ? (
              <>
                <div className="font-semibold text-foreground">Etapa {step} de {TOTAL}</div>
                <div className="flex items-center justify-end gap-1"><Clock className="size-3" /> ~{Math.max(1, TOTAL - step + 1) * 25}s restantes</div>
              </>
            ) : <div className="font-semibold text-foreground">{screen === "review" ? "Revisão" : "Resumo"}</div>}
          </div>
        </div>
        <div className="h-1 bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={typeof screen === "number" ? Math.round(((step - 1) / TOTAL) * 100) : 100}>
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${typeof screen === "number" ? ((step - 1) / TOTAL) * 100 + 4 : 100}%` }} />
        </div>
      </header>

      <main key={String(screen)} className="animate-step mx-auto max-w-2xl px-4 pb-16 pt-8">
        {screen === 1 && <StepLocation a={a} set={set} onNext={() => next(2)} />}
        {screen === 2 && (
          <Question title="Você recebe atualmente algum benefício social?">
            <Options options={BENEFIT} value={a.benefit} onChange={(v) => set("benefit", v)} />
            <Continue disabled={!a.benefit} onClick={() => next(3)} />
          </Question>
        )}
        {screen === 3 && (
          <Question title="Você possui inscrição no Cadastro Único (CadÚnico)?">
            <Options options={CAD} value={a.cad} onChange={(v) => set("cad", v)} />
            <div className="mt-5 flex gap-3 rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
              <ShieldCheck className="mt-0.5 size-5 shrink-0" />
              <p>Manter os dados do CadÚnico atualizados (pelo menos a cada 2 anos ou quando algo muda na família) ajuda a evitar bloqueios e pendências. A atualização é gratuita e feita no CRAS. Isso não garante aumento de valores.</p>
            </div>
            <Continue disabled={!a.cad} onClick={() => next(4)} />
          </Question>
        )}
        {screen === 4 && (
          <Question title="Quantas pessoas moram com você?">
            <Options options={PEOPLE} value={a.people} onChange={(v) => set("people", v)} />
            <h3 className="mt-8 text-lg font-bold text-foreground">Você possui crianças ou adolescentes em sua residência? <span className="text-sm font-medium text-muted-foreground">(opcional)</span></h3>
            <div className="mt-3"><Options options={KIDS} value={a.kids} onChange={(v) => set("kids", v)} compact /></div>
            <Continue disabled={!a.people} onClick={() => next("review")} label="REVISAR INFORMAÇÕES" />
          </Question>
        )}
        {screen === "review" && <Review a={a} edit={edit} onNext={() => setScreen("result")} />}
        {screen === "result" && <Result a={a} onRestart={() => { setA(EMPTY); setScreen(1); }} />}
      </main>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2 font-extrabold tracking-tight text-foreground">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-4" /></span>
      SEU Benefício <span className="text-primary">2027</span>
    </div>
  );
}



function Question({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby="q">
      <h2 id="q" className="mb-6 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

function Options({ options, value, onChange, compact }: { options: string[]; value: string; onChange: (v: string) => void; compact?: boolean }) {
  return (
    <div role="radiogroup" className={compact ? "grid gap-2 sm:grid-cols-3" : "grid gap-3"}>
      {options.map((o) => {
        const sel = value === o;
        return (
          <button key={o} role="radio" aria-checked={sel} onClick={() => onChange(o)}
            className={`shadow-soft flex items-center gap-3 rounded-2xl border-2 bg-card p-4 text-left font-semibold text-card-foreground transition active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-ring ${sel ? "border-primary bg-accent" : "border-transparent hover:border-border"}`}>
            <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition ${sel ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>
              {sel && <Check className="size-3.5" strokeWidth={3} />}
            </span>
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Continue({ disabled, onClick, label = "CONTINUAR" }: { disabled?: boolean; onClick: () => void; label?: string }) {
  return (
    <button disabled={disabled} onClick={onClick}
      className="shadow-primary mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold tracking-wide text-primary-foreground transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      {label} <ArrowRight className="size-5" />
    </button>
  );
}

function StepLocation({ a, set, onNext }: { a: Answers; set: (k: keyof Answers, v: string) => void; onNext: () => void }) {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState(a.city);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!a.uf) return;
    setLoading(true); setError("");
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${a.uf}/municipios`)
      .then((r) => r.json())
      .then((d: { nome: string }[]) => setCities(d.map((c) => c.nome)))
      .catch(() => setError("Não foi possível carregar as cidades. Verifique sua conexão."))
      .finally(() => setLoading(false));
  }, [a.uf]);

  const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const matches = useMemo(() => (q ? cities.filter((c) => norm(c).includes(norm(q))).slice(0, 8) : []), [q, cities]);
  const valid = a.uf && cities.includes(a.city);

  return (
    <Question title="Em qual estado você mora atualmente?">
      <label className="sr-only" htmlFor="uf">Estado</label>
      <select id="uf" value={a.uf} onChange={(e) => { set("uf", e.target.value); set("city", ""); setQ(""); }}
        className="shadow-soft h-14 w-full rounded-2xl border border-input bg-card px-4 font-semibold text-card-foreground focus-visible:outline-2 focus-visible:outline-ring">
        <option value="">Selecione o estado</option>
        {UFS.map(([s, n]) => <option key={s} value={s}>{n}</option>)}
      </select>

      <h3 className="mb-3 mt-8 text-lg font-bold text-foreground">Qual é a sua cidade?</h3>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          aria-label="Cidade" disabled={!a.uf || loading} value={q} autoComplete="off"
          placeholder={!a.uf ? "Selecione o estado primeiro" : loading ? "Carregando cidades..." : "Digite o nome da cidade"}
          onChange={(e) => { setQ(e.target.value); set("city", ""); setOpen(true); }}
          onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="shadow-soft h-14 w-full rounded-2xl border border-input bg-card pl-12 pr-4 font-semibold text-card-foreground placeholder:font-normal placeholder:text-muted-foreground disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-ring"
        />
        {open && matches.length > 0 && !a.city && (
          <ul role="listbox" className="shadow-soft absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-border bg-popover p-1">
            {matches.map((c) => (
              <li key={c}>
                <button type="button" onMouseDown={() => { set("city", c); setQ(c); setOpen(false); }}
                  className="w-full rounded-xl px-4 py-3 text-left font-medium text-popover-foreground hover:bg-muted focus-visible:bg-muted">{c}</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="mt-2 text-sm font-medium text-destructive">{error}</p>}
      {q && !a.city && !loading && cities.length > 0 && !open && <p className="mt-2 text-sm font-medium text-destructive">Escolha uma cidade da lista de sugestões.</p>}
      <Continue disabled={!valid} onClick={onNext} />
    </Question>
  );
}

function Review({ a, edit, onNext }: { a: Answers; edit: (s: Screen) => void; onNext: () => void }) {
  const uf = UFS.find(([s]) => s === a.uf)?.[1];
  const rows: { icon: typeof MapPin; label: string; value: string; step: Screen }[] = [
    { icon: MapPin, label: "Estado e cidade", value: `${a.city} — ${uf ?? ""}`, step: 1 },
    { icon: FileText, label: "Situação do benefício", value: a.benefit, step: 2 },
    { icon: ClipboardList, label: "Situação do CadÚnico", value: a.cad, step: 3 },
    { icon: Users, label: "Composição familiar", value: `${a.people}${a.kids ? ` Crianças/adolescentes: ${a.kids}` : ""}`, step: 4 },
  ];
  return (
    <section>
      <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-foreground">Confira suas informações</h2>
      <div className="grid gap-3">
        {rows.map(({ icon: I, label, value, step }) => (
          <div key={label} className="shadow-soft flex items-start gap-4 rounded-2xl bg-card p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><I className="size-5" /></span>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
              <div className="mt-1 font-semibold text-card-foreground">{value}</div>
            </div>
            <button onClick={() => edit(step)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
              <Pencil className="size-3.5" /> EDITAR
            </button>
          </div>
        ))}
      </div>

      <Continue onClick={onNext} label="VER PRÓXIMOS PASSOS" />
    </section>
  );
}

function Chip({ icon: I, t }: { icon: typeof MapPin; t: string }) {
  return <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 font-medium text-foreground"><I className="size-4 shrink-0 text-primary" />{t}</div>;
}

function Result({ a, onRestart }: { a: Answers; onRestart?: () => void }) {


  return (
    <section>
      <div className="shadow-soft rounded-3xl bg-card p-6 text-center sm:p-8">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-success text-success-foreground"><FileText className="size-8" /></span>
        <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-card-foreground">Seu resumo cadastral está pronto</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">Confira os próximos passos para verificar sua situação e acompanhar eventuais atualizações oficiais dos seus benefícios sociais em 2027.</p>
        <div className="mt-6 grid gap-2 text-left text-sm sm:grid-cols-2">
          <Chip icon={MapPin} t={`${a.city}/${a.uf}`} />
          <Chip icon={Users} t={a.people} />
          <Chip icon={ClipboardList} t={a.cad} />
          <Chip icon={Home} t={a.benefit} />
        </div>
      </div>


      {/* Próximos Passos */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-bold text-foreground">O que acontece agora?</h3>
        <ol className="grid gap-3">
          <li className="shadow-soft flex gap-4 rounded-2xl bg-card p-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">1</span>
            <div className="pt-0.5">
              <p className="font-semibold text-foreground">Preencha seus dados básicos</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Na próxima tela, você informará nome completo e WhatsApp para concluir seu cadastro.</p>
            </div>
          </li>
          <li className="shadow-soft flex gap-4 rounded-2xl bg-card p-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">2</span>
            <div className="pt-0.5">
              <p className="font-semibold text-foreground">Use um número de telefone válido</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Sua confirmação e o comprovante do cadastro serão enviados por SMS e WhatsApp — certifique-se de que o número está correto.</p>
            </div>
          </li>
          <li className="shadow-soft flex gap-4 rounded-2xl bg-card p-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">3</span>
            <div className="pt-0.5">
              <p className="font-semibold text-foreground">Efetue o pagamento via PIX</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Escaneie o QR Code ou use o código Copia e Cola para pagar a taxa cadastral de R$ 15,00. A confirmação é imediata.</p>
            </div>
          </li>
        </ol>
      </div>

      {/* Card para Avançar para a Página Separada de Pagamento PIX */}
      <div className="shadow-soft mt-8 space-y-4 rounded-3xl border-2 border-primary/20 bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="size-3.5" /> Taxa Cadastral 2027
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-success">
            <Check className="size-3.5" /> Pagamento Exclusivo via PIX
          </span>
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-foreground sm:text-2xl">
            Emissão e Regularização do Cadastro
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Para garantir a emissão prioritária e atualização das suas informações com comprovante digital, efetue o pagamento da taxa cadastral única.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Taxa de Emissão e Atualização 2027</span>
            <span className="font-semibold text-foreground">{brl(15)}</span>
          </div>
          <div className="mt-1 flex justify-between text-muted-foreground">
            <span>Forma de Pagamento</span>
            <span className="font-semibold text-primary">PIX Instantâneo</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-base font-extrabold text-foreground">
            <span>Valor Total</span>
            <span className="font-display text-2xl font-black text-primary">{brl(15)}</span>
          </div>
        </div>

        <Link
          to="/pagamento"
          className="shadow-primary flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-extrabold tracking-wide text-primary-foreground transition hover:-translate-y-0.5 active:scale-[0.99]"
        >
          AVANÇAR PARA PAGAMENTO VIA PIX <ArrowRight className="size-5" />
        </Link>

        <div className="flex items-center justify-center gap-4 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Lock className="size-3.5 text-primary" /> Gateway PromissePay Seguro
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-primary" /> Confirmação Imediata
          </span>
        </div>
      </div>

      {onRestart && (
        <div className="mt-6 text-center">
          <button
            onClick={onRestart}
            className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Refazer questionário e limpar respostas
          </button>
        </div>
      )}
    </section>
  );
}
