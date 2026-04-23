export default function AtalhoIADrogarias() {
  return (
    <section className="px-6 pb-10 pt-2">
      <div className="mx-auto max-w-5xl border-t border-white/10 pt-6">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-[11px] tracking-[0.25em] text-zinc-500 uppercase">
            Desenvolvido por
          </p>

          <a
            href="https://iadrogarias.com.br/fv"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-[#d4af37]"
          >
            <span className="font-medium tracking-[0.18em] uppercase">
              IA Drogarias
            </span>

            <span className="h-px w-6 bg-white/20 transition group-hover:bg-[#d4af37]/50" />

            <span className="text-xs text-zinc-500 transition group-hover:text-[#d4af37]">
              e-commerce
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}