import { Shield, Lock } from "lucide-react";
import logoBolsaFamilia from "@/assets/logo-bolsa-familia.png";
import retratoLula from "@/assets/retrato-lula.png";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[#E5E5E5] bg-[#F5F5F5] text-[#202020]">
      {/* Faixa superior com selos de segurança */}
      <div className="border-b border-[#E5E5E5] bg-white py-4 px-4">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-6 text-xs text-[#555555]">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-[#C8102E]" />
            <span className="font-semibold">Ambiente Criptografado SSL 256-bit</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-[#C8102E]" />
            <span className="font-semibold">Conformidade com a LGPD (Lei 13.709/18)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-[#202020]">Gateway PromissePay Operacional</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-[#E5E5E5]">
          {/* Logos e Identificação */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-2 shadow-xs">
              <img
                src={logoBolsaFamilia}
                alt="Programa Bolsa Família"
                className="h-7 w-auto object-contain"
                onError={(e) => {
                  if (e.currentTarget.src !== "/logo-bolsa-familia.png") {
                    e.currentTarget.src = "/logo-bolsa-familia.png";
                  }
                }}
              />
            </div>
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-1.5 shadow-xs">
              <img
                src={retratoLula}
                alt="Lula Presidente - Programas Sociais"
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  if (e.currentTarget.src !== "/retrato-lula.png") {
                    e.currentTarget.src = "/retrato-lula.png";
                  }
                }}
              />
            </div>
            <div>
              <div className="text-sm font-extrabold text-[#C8102E]">SEU Benefício 2027</div>
              <div className="text-[11px] text-[#666666]">Organização Cadastral & Informação</div>
            </div>
          </div>

          {/* Links Informativos */}
          <div className="flex flex-wrap justify-center sm:justify-end gap-4 text-xs font-semibold text-[#555555]">
            <span className="cursor-pointer hover:text-[#C8102E] transition">Termos de Uso</span>
            <span>·</span>
            <span className="cursor-pointer hover:text-[#C8102E] transition">Política de Privacidade</span>
            <span>·</span>
            <span className="cursor-pointer hover:text-[#C8102E] transition">Dúvidas Frequentes</span>
          </div>
        </div>

        <div className="pt-6 text-center text-xs text-[#888888]">
          © 2027 SEU Benefício — Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
