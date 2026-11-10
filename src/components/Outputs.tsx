import { useMemo } from "react";
import { Chart } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import {
  MODEL,
  VAT_RATE,
  SURCHARGE_RATE,
  toNumber,
  type FormState,
  type ProjectResult,
} from "../lib/calculator";
import { irrLabel, money, ratio, yearsLabel } from "../lib/format";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);
ChartJS.defaults.font.family =
  '"PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Noto Sans CJK SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif';
ChartJS.defaults.color = "#3d5148";

function Status({ pass, label }: { pass: boolean; label: string }) {
  return <span className={pass ? "badge ok" : "badge bad"}>{label}</span>;
}

export function OutcomeStrip({ result }: { result: ProjectResult }) {
  return (
    <div className="outcome-strip" aria-label="主要结果">
      <article>
        <span>税前 IRR</span>
        <strong>{irrLabel(result.irrPre)}</strong>
      </article>
      <article>
        <span>税后 IRR</span>
        <strong>{irrLabel(result.irrPost)}</strong>
      </article>
      <article>
        <span>资本金 IRR</span>
        <strong>{irrLabel(result.irrEq)}</strong>
      </article>
      <article>
        <span>到户电价</span>
        <strong>{result.delivered.toFixed(7)}</strong>
      </article>
      <article>
        <span>年节省（万元）</span>
        <strong>{money(result.saving)}</strong>
      </article>
    </div>
  );
}

export function Outputs({ form, result }: { form: FormState; result: ProjectResult }) {
  const baselinePrice = toNumber(form.baselinePrice);
  const chart = useMemo(() => buildChart(result), [result]);

  return (
    <div className="stack">
      {result.officialMissing ? (
        <p className="callout warn" role="status">
          <strong>价库缺口。</strong>
          当前价区与电压等级在第四监管周期表中暂无记录（例如深圳，或辽宁、吉林的 35 千伏），带出价格已置零。请手填输配电价后再读取用户侧结果。
        </p>
      ) : null}
      {result.longHorizon ? (
        <p className="callout warn" role="status">
          <strong>运营期超出 25 年。</strong>
          源工作簿现金流表上限为 25 年；本页仍会计算，但建议人工复核。
        </p>
      ) : null}

      <section className="card" id="compliance">
        <div className="section-head">
          <div>
            <h2>合规判定与电量结构</h2>
            <p>红线分母为弃电前可用发电量。离网型不考核上网比例。衰减不进入合规指标。</p>
          </div>
        </div>
        <div className="checks">
          <article className={result.selfToGenPass ? "check ok" : "check bad"}>
            <div className="check-top">
              <h3>自发自用 / 可用发电量</h3>
              <Status pass={result.selfToGenPass} label={result.selfToGenPass ? "通过" : "未达标"} />
            </div>
            <p className="check-value">{ratio(result.selfToGen)}</p>
            <p>准入红线 ≥ 60%</p>
          </article>
          <article className={result.selfToLoadPass ? "check ok" : "check bad"}>
            <div className="check-top">
              <h3>自发自用 / 用户年用电量</h3>
              <Status pass={result.selfToLoadPass} label={result.selfToLoadPass ? "通过" : "未达标"} />
            </div>
            <p className="check-value">{ratio(result.selfToLoad)}</p>
            <p>准入红线 ≥ 30%。源批注称 2030 年起为 35%，本页仍按 30% 判定。</p>
          </article>
          <article className={result.expToGenPass ? "check ok" : "check bad"}>
            <div className="check-top">
              <h3>上网电量 / 可用发电量</h3>
              <Status
                pass={result.expToGenPass}
                label={result.expToGenPass ? (form.projectType === "离网型" ? "不适用" : "通过") : "未达标"}
              />
            </div>
            <p className="check-value">{ratio(result.expToGen)}</p>
            <p>{form.projectType === "离网型" ? "离网不适用" : "准入红线 ≤ 20%"}</p>
          </article>
        </div>
        <dl className="stat-grid">
          <div>
            <dt>总可用发电</dt>
            <dd>{money(result.available, 0)} 万kWh</dd>
          </div>
          <div>
            <dt>净发电量</dt>
            <dd>{money(result.net, 0)} 万kWh</dd>
          </div>
          <div>
            <dt>自发自用</dt>
            <dd>{money(result.selfUse, 0)} 万kWh</dd>
          </div>
          <div>
            <dt>上网电量</dt>
            <dd>{money(result.exported, 0)} 万kWh</dd>
          </div>
          <div>
            <dt>下网电量</dt>
            <dd>{money(result.downstream, 0)} 万kWh</dd>
          </div>
        </dl>
      </section>

      <section className="card" id="user">
        <div className="section-head">
          <div>
            <h2>到户电价与用户收益</h2>
            <p>用户侧费用不进入项目 IRR。绿证/CBAM 价值只单列。以下为未衰减的典型年快照。</p>
          </div>
        </div>
        <div className="metrics">
          <article className={result.delivered <= baselinePrice ? "metric good" : "metric warn"}>
            <span>综合到户电价</span>
            <strong>{result.delivered.toFixed(7)} 元/kWh</strong>
            <small>对照价 {baselinePrice.toFixed(4)} 元/kWh</small>
          </article>
          <article className={result.saving >= 0 ? "metric good" : "metric bad"}>
            <span>年节省额（对照全部网购）</span>
            <strong>{money(result.saving)} 万元</strong>
            <small>节省率 {ratio(result.savingRate)}</small>
          </article>
          <article className="metric">
            <span>绿证/CBAM 折算价值</span>
            <strong>{money(result.green)} 万元</strong>
            <small>不进入到户价、节省额与项目现金流</small>
          </article>
        </div>
        <PriceCompare delivered={result.delivered} baseline={baselinePrice} />
        <div className="table-scroll">
          <table>
            <caption>用户侧费用构成（万元/年）</caption>
            <thead>
              <tr>
                <th scope="col">费用项</th>
                <th scope="col">金额（万元/年）</th>
              </tr>
            </thead>
            <tbody>
              <FeeRow label="直供电费" value={result.directFee} />
              <FeeRow label="下网市场购电" value={result.marketFee} />
              <FeeRow label="容（需）量电费" value={result.capacityFee} />
              <FeeRow label="输配电量折算费" value={result.tdFee} />
              <FeeRow label="系统运行费" value={result.sysFee} />
              <FeeRow label="线损费" value={result.lossFee} />
              <FeeRow label="交叉补贴" value={result.crossFee} />
              <FeeRow label="政府性基金及附加" value={result.fundFee} />
              <FeeRow label="用户综合成本" value={result.userCost} strong />
              <FeeRow label="全部网购对照成本" value={result.baseline} strong />
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" id="finance">
        <div className="section-head">
          <div>
            <h2>项目财务评价</h2>
            <p>全投资与资本金双口径。NPV 与动态回收期按基准折现率对税后全投资现金流做期末折现。LCOE 不含融资和所得税。</p>
          </div>
        </div>
        <div className="metrics">
          <article className="metric">
            <span>全投资 IRR（税前）</span>
            <strong>{irrLabel(result.irrPre)}</strong>
          </article>
          <article className={result.irrPost != null && result.irrPost < toNumber(form.discountPct) / 100 ? "metric warn" : "metric good"}>
            <span>全投资 IRR（税后）</span>
            <strong>{irrLabel(result.irrPost)}</strong>
          </article>
          <article className="metric">
            <span>资本金 IRR</span>
            <strong>{irrLabel(result.irrEq)}</strong>
          </article>
          <article className={result.npv >= 0 ? "metric good" : "metric bad"}>
            <span>NPV（税后全投资）</span>
            <strong>{money(result.npv, 4)} 万元</strong>
          </article>
          <article className="metric">
            <span>静态回收期</span>
            <strong>{yearsLabel(result.paybackStatic)}</strong>
          </article>
          <article className={result.paybackDynamic == null ? "metric warn" : "metric"}>
            <span>动态回收期</span>
            <strong>{yearsLabel(result.paybackDynamic)}</strong>
          </article>
          <article className="metric">
            <span>LCOE（期末折现）</span>
            <strong>{result.lcoe == null ? "—" : `${result.lcoe.toFixed(6)} 元/kWh`}</strong>
          </article>
        </div>
        <dl className="stat-grid">
          <div>
            <dt>光伏投资</dt>
            <dd>{money(result.pvCapex)} 万元</dd>
          </div>
          <div>
            <dt>风电投资</dt>
            <dd>{money(result.windCapex)} 万元</dd>
          </div>
          <div>
            <dt>储能投资</dt>
            <dd>{money(result.storageCapex)} 万元</dd>
          </div>
          <div>
            <dt>专线及升压</dt>
            <dd>{money(result.lineCapex)} 万元</dd>
          </div>
          <div>
            <dt>土地取得费</dt>
            <dd>{money(result.landCapex)} 万元</dd>
          </div>
          <div>
            <dt>总投资</dt>
            <dd>{money(result.totalCapex)} 万元</dd>
          </div>
          <div>
            <dt>资本金</dt>
            <dd>{money(result.equity)} 万元</dd>
          </div>
          <div>
            <dt>贷款</dt>
            <dd>{money(result.loan)} 万元</dd>
          </div>
          <div>
            <dt title="含保险与租金">年运维</dt>
            <dd>
              {money(result.annualOpex)} 万元
              <small>含保险、租金</small>
            </dd>
          </div>
          <div>
            <dt>年还本付息</dt>
            <dd>{money(result.debtService)} 万元</dd>
          </div>
        </dl>
      </section>

      <section className="card" id="cashflow">
        <div className="section-head">
          <div>
            <h2>运营期现金流</h2>
            <p>单位：万元。第 0 年为含税总投资流出。累计折现使用基准折现率，第 t 年除以 (1+r)^t。</p>
          </div>
        </div>
        <div className="chart-box" role="img" aria-label="税后净现金流与累计折现税后现金流">
          <Chart type="bar" data={chart.data} options={chart.options} />
        </div>
        <p className="scroll-hint">表格较宽，可左右滑动查看各年。</p>
        <div className="table-scroll">
          <table className="flow">
            <caption>逐年现金流（万元）</caption>
            <thead>
              <tr>
                <th scope="col">年份</th>
                <th scope="col">含税收入</th>
                <th scope="col">实缴增值税</th>
                <th scope="col">附加</th>
                <th scope="col">储能更换</th>
                <th scope="col">所得税（全投资）</th>
                <th scope="col">税前现金流</th>
                <th scope="col">税后现金流</th>
                <th scope="col">资本金现金流</th>
                <th scope="col">累计税后</th>
                <th scope="col">累计折现</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.year}>
                  <th scope="row">{row.year}</th>
                  <td>{money(row.revenue)}</td>
                  <td>{money(row.vatPaid)}</td>
                  <td>{money(row.surcharge)}</td>
                  <td>{money(row.replace)}</td>
                  <td>{money(row.taxAll)}</td>
                  <td>{money(row.cfPre)}</td>
                  <td>{money(row.cfPost)}</td>
                  <td>{money(row.cfEq)}</td>
                  <td>{money(row.cumPost)}</td>
                  <td>{money(row.cumDisc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" id="lcoe">
        <div className="section-head">
          <div>
            <h2>LCOE 公式</h2>
            <p>
              度电成本采用期末折现。分子为扣除可抵扣进项税后的净投资、土地计税基础，以及运维、更换与期末回收的现值；分母为带衰减的净发电量现值。不含贷款、利息与所得税。金额单位万元、电量单位万
              kWh，相除后为元/kWh。
            </p>
          </div>
        </div>
        <div className="formula-scroll">
          <p className="formula" aria-label="LCOE 公式">
            <span>LCOE</span>
            <span className="eq">=</span>
            <span className="frac">
              <span className="num">
                I<sub>net</sub> + B<sub>land</sub> + <span className="sum">Σ</span>
                <sub>t=1</sub>
                <sup>N</sup>
                <span className="mini-frac">
                  <span>
                    O<sub>t</sub> + R<sub>t</sub> − V<sub>t</sub>
                  </span>
                  <span>
                    (1+r)<sup>t</sup>
                  </span>
                </span>
              </span>
              <span className="den">
                <span className="sum">Σ</span>
                <sub>t=1</sub>
                <sup>N</sup>
                <span className="mini-frac">
                  <span>
                    E<sub>t</sub>
                  </span>
                  <span>
                    (1+r)<sup>t</sup>
                  </span>
                </span>
              </span>
            </span>
          </p>
        </div>
        <p className="formula-note">
          I<sub>net</sub> 为扣进项税后的可折旧投资，B<sub>land</sub> 为土地计税基础，O<sub>t</sub> 为年运维，R<sub>t</sub> 为储能更换，V<sub>t</sub>{" "}
          为期末回收，E<sub>t</sub> = E<sub>net</sub>(1−d)<sup>t−1</sup>。增值税率 {(VAT_RATE * 100).toFixed(0)}%、附加率{" "}
          {(SURCHARGE_RATE * 100).toFixed(0)}% 为模型固定口径。
        </p>
        {result.lcoe != null ? (
          <p className="callout info">
            当前方案 LCOE = <strong>{result.lcoe.toFixed(6)} 元/kWh</strong>
          </p>
        ) : (
          <p className="callout warn">净发电量现值为零，无法计算 LCOE。</p>
        )}
      </section>

      <section className="card" id="notes">
        <div className="section-head">
          <div>
            <h2>方法来源与简化</h2>
          </div>
        </div>
        <p>
          口径依据公开文档化的《绿电直连经济测算》v{MODEL.version}（价库更新日期 {MODEL.sourceUpdatedAt}）与国家发展改革委《关于完善价格机制促进新能源发电就近消纳的通知》（发改价格〔2025〕1192
          号）。源 Excel 作者为介子九维（JIEZIJIUWEI）。公开实现见{" "}
          <a href="https://github.com/YANXUE112/green-power-direct-toolkit" target="_blank" rel="noreferrer">
            YANXUE112/green-power-direct-toolkit
          </a>
          。该仓库没有开源许可证，本页按其公开方法论与省级输配电价事实独立实现，不照搬其源代码。
        </p>
        <ul className="notes">
          <li>不变价：无通胀，无电价或成本的年增长。</li>
          <li>无建设期、无建设期利息、无流动资金。</li>
          <li>自用、上网、下网电量由用户填报后加上限，不做小时级匹配。</li>
          <li>储能功率不参与电量平衡；储能只通过容量计入投资，并在更换年按比例费用化。</li>
          <li>区域电网输电价格（附件 2）不自动计入。</li>
          <li>贷款为等额本息；年限超过运营期时，期末未偿本金从资本金现金流一次性扣减。</li>
          <li>亏损向前结转 5 年。全投资税基不含利息，资本金税基扣除利息。</li>
          <li>折现为期末惯例：投资记在 t = 0，第 t 年现金流除以 (1+r)^t。IRR 在 [−99%, 400%] 内二分 240 次。</li>
          <li>源批注写明自发自用占用户用电量的比例 2030 年起提高到 35%，判定逻辑仍为 30%。</li>
          <li>深圳暂无输配电价；辽宁、吉林缺少 35 千伏。运营期超过 25 年仍可计算，并给出提示。</li>
        </ul>
        <p className="disclaimer">
          结果仅供前期研判，不构成投资建议。正式决策以主管部门批复口径和可行性研究为准。默认方案税后 IRR 低于 6% 基准折现率、NPV 为负、动态回收期为空，是该组示例参数的对照结果，不是运行错误。
        </p>
      </section>
    </div>
  );
}

function FeeRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <tr className={strong ? "strong" : undefined}>
      <th scope="row">{label}</th>
      <td>{money(value)}</td>
    </tr>
  );
}

function PriceCompare({ delivered, baseline }: { delivered: number; baseline: number }) {
  const max = Math.max(delivered, baseline, 0.0001);
  return (
    <div className="bars" aria-label="到户电价与对照价">
      <div>
        <div className="bar-label">
          <span>绿电直连到户价</span>
          <span>{delivered.toFixed(4)} 元/kWh</span>
        </div>
        <div className="bar-track">
          <div className="bar-fill direct" style={{ width: `${(delivered / max) * 100}%` }} />
        </div>
      </div>
      <div>
        <div className="bar-label">
          <span>电网购电对照价</span>
          <span>{baseline.toFixed(4)} 元/kWh</span>
        </div>
        <div className="bar-track">
          <div className="bar-fill baseline" style={{ width: `${(baseline / max) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function buildChart(result: ProjectResult): {
  data: ChartData<"bar", number[], string>;
  options: ChartOptions<"bar">;
} {
  const data = {
    labels: result.postFlows.map((_, year) => String(year)),
    datasets: [
      {
        type: "bar" as const,
        label: "税后净现金流",
        data: result.postFlows,
        backgroundColor: result.postFlows.map((value) => (value < 0 ? "rgba(166, 27, 27, 0.78)" : "rgba(13, 122, 79, 0.85)")),
        borderWidth: 0,
      },
      {
        type: "line" as const,
        label: "累计折现税后现金流",
        data: result.cumDisc,
        borderColor: "#1d4e89",
        backgroundColor: "rgba(29, 78, 137, 0.12)",
        pointRadius: 0,
        pointHitRadius: 10,
        borderWidth: 2,
        tension: 0.18,
      },
    ],
  } as ChartData<"bar", number[], string>;

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          generateLabels(chart) {
            const items = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
            return items.map((item) =>
              item.text === "税后净现金流"
                ? { ...item, fillStyle: "rgba(13, 122, 79, 0.85)", strokeStyle: "rgba(13, 122, 79, 0.85)" }
                : item,
            );
          },
        },
      },
      tooltip: {
        callbacks: {
          title: (items) => `第 ${items[0]?.label ?? ""} 年`,
          label: (item: TooltipItem<"bar">) => {
            const value = item.parsed.y;
            if (value == null || Number.isNaN(value)) return item.dataset.label ?? "";
            return `${item.dataset.label}：${money(value)} 万元`;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "年份" },
        grid: { display: false },
        ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 13 },
      },
      y: {
        title: { display: true, text: "万元" },
        grid: { color: "rgba(20, 36, 28, 0.08)" },
      },
    },
  };

  return { data, options };
}
