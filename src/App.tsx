import { useMemo, useState } from "react";
import { Inputs } from "./components/Inputs";
import { OutcomeStrip, Outputs } from "./components/Outputs";
import { DEFAULT_FORM, MODEL, evaluateProjectFull, type FormState } from "./lib/calculator";

const TOC = [
  { href: "#inputs", label: "参数" },
  { href: "#compliance", label: "合规与电量" },
  { href: "#user", label: "到户电价" },
  { href: "#finance", label: "财务" },
  { href: "#cashflow", label: "现金流" },
  { href: "#lcoe", label: "LCOE" },
  { href: "#notes", label: "简化" },
];

export function App() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const result = useMemo(() => evaluateProjectFull(form), [form]);

  return (
    <>
      <a className="skip" href="#inputs">
        跳到参数
      </a>
      <header className="site-header">
        <div className="wrap header-inner">
          <div className="mark" aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <path d="M17.2 3.2 7.2 17.4h6.4L12.4 28.8 25.2 13.6h-6.6L17.2 3.2z" />
            </svg>
          </div>
          <div>
            <p className="eyebrow">发改价格〔2025〕1192 号 · 《绿电直连经济测算》v{MODEL.version}</p>
            <h1>绿电直连经济评价</h1>
            <p className="lede">
              实时测算并网或离网项目的准入红线、综合到户电价、税前/税后/资本金 IRR、NPV、静态与动态回收期，以及期末折现 LCOE。
            </p>
          </div>
        </div>
      </header>

      <div className="toc-bar">
        <nav className="toc wrap" aria-label="页内目录">
          {TOC.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <main>
        <div className="wrap">
          <OutcomeStrip result={result} />
          <section className="card intro" id="intro">
            <h2>口径说明</h2>
            <p>
              本页按 v{MODEL.version} 与 1192 号文重新实现。折现为期末惯例：投资记在第 0 年，第 t 年现金流除以 (1+r)^t。价库涵盖{" "}
              {MODEL.sourceUpdatedAt} 更新的第四监管周期省级输配电价。金额单位为万元，电量为万 kWh，电价为元/kWh。
            </p>
          </section>
        </div>
        <div className="wrap workbench">
          <Inputs form={form} setForm={setForm} onReset={() => setForm(DEFAULT_FORM)} />
          <Outputs form={form} result={result} />
        </div>
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <p>绿电直连经济评价 · 模型 v{MODEL.version} · 输配电价更新至 {MODEL.sourceUpdatedAt}</p>
        </div>
      </footer>
    </>
  );
}
