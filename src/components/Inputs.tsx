import { NumberField, Segmented, SelectField } from "./Fields";
import {
  REGIONS,
  VOLTAGES,
  applyOfficialTariff,
  findTariff,
  type CapMode,
  type FormState,
  type FundScope,
  type ProjectType,
  type TdMode,
  type YesNo,
} from "../lib/calculator";

export function Inputs({
  form,
  setForm,
  onReset,
}: {
  form: FormState;
  setForm: (updater: (prev: FormState) => FormState) => void;
  onReset: () => void;
}) {
  const set = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };
  const tariffMissing = !findTariff(form.region, form.voltage);

  return (
    <div className="stack">
      <section className="card" id="inputs">
        <div className="section-head">
          <div>
            <h2>情景与参数</h2>
            <p>修改价区或电压等级会自动带出公开输配电价，仍可手改覆盖。</p>
          </div>
          <button type="button" className="btn" onClick={onReset}>
            恢复默认方案
          </button>
        </div>

        <div className="fields">
          <SelectField
            label="价区"
            value={form.region}
            options={REGIONS}
            onChange={(region) => setForm((prev) => applyOfficialTariff(prev, region, prev.voltage))}
          />
          <SelectField
            label="接入电压"
            value={form.voltage}
            options={VOLTAGES}
            onChange={(voltage) => setForm((prev) => applyOfficialTariff(prev, prev.region, voltage))}
          />
          <NumberField label="输配电度电价（元/kWh）" value={form.energyPrice} onChange={set("energyPrice")} />
          <NumberField label="容量电价（元/kVA·月）" value={form.capacityPrice} onChange={set("capacityPrice")} />
          <NumberField label="需量电价（元/kW·月）" value={form.demandPrice} onChange={set("demandPrice")} />
        </div>
        {tariffMissing ? (
          <p className="callout warn" role="status">
            <strong>价库缺口。</strong>
            这一价区与电压在第四监管周期表中没有记录（深圳全电压，以及辽宁、吉林的 35 千伏），价格已置零，可手填后再看用户侧结果。
          </p>
        ) : null}

        <Segmented<ProjectType>
          label="项目形态"
          name="projectType"
          value={form.projectType}
          options={["并网型", "离网型"]}
          onChange={(projectType) => setForm((prev) => ({ ...prev, projectType }))}
        />
        <Segmented<TdMode>
          label="输配电费方式"
          name="tdMode"
          value={form.tdMode}
          options={["单一容量制", "两部制"]}
          hint="1192 号文默认单一容量制。单一容量制按全省平均负荷率折算，不是本项目负荷率。"
          onChange={(tdMode) => setForm((prev) => ({ ...prev, tdMode }))}
        />
        <Segmented<CapMode>
          label="容（需）量电费计费"
          name="capMode"
          value={form.capMode}
          options={["按容量", "按需量"]}
          onChange={(capMode) => setForm((prev) => ({ ...prev, capMode }))}
        />
        <Segmented<FundScope>
          label="政府性基金计费口径"
          name="fundScope"
          value={form.fundScope}
          options={["下网+自用", "仅下网"]}
          onChange={(fundScope) => setForm((prev) => ({ ...prev, fundScope }))}
        />
        <Segmented<YesNo>
          label="所得税三免三减半"
          name="taxHoliday"
          value={form.taxHoliday}
          options={["是", "否"]}
          hint="只按光伏与风电投资占总投资的份额适用：前 3 年免征，第 4–6 年减半，其余资产始终全额纳税。"
          onChange={(taxHoliday) => setForm((prev) => ({ ...prev, taxHoliday }))}
        />
      </section>

      <section className="card" id="plant">
        <div className="section-head">
          <div>
            <h2>装机与电量</h2>
            <p>自发自用、上网与下网按填报值加上限，不做小时级时序匹配。合规与到户电价使用未衰减的典型年。</p>
          </div>
        </div>
        <div className="fields">
          <NumberField label="光伏装机（MW）" value={form.pvMw} onChange={set("pvMw")} />
          <NumberField label="光伏年利用小时（h）" value={form.pvHours} onChange={set("pvHours")} />
          <NumberField label="风电装机（MW）" value={form.windMw} onChange={set("windMw")} />
          <NumberField label="风电年利用小时（h）" value={form.windHours} onChange={set("windHours")} />
          <NumberField label="用户年用电量（万kWh）" value={form.load} onChange={set("load")} />
          <NumberField label="年自发自用电量（万kWh）" value={form.selfUse} onChange={set("selfUse")} />
          <NumberField label="弃电率（%）" value={form.curtailmentPct} onChange={set("curtailmentPct")} />
          <NumberField label="年出力衰减率（%）" value={form.degradationPct} onChange={set("degradationPct")} />
          <NumberField label="储能容量（MWh）" value={form.storageMwh} onChange={set("storageMwh")} />
          <NumberField
            label="储能功率（MW）"
            value={form.storageMw}
            onChange={set("storageMw")}
            hint="只作记录，不进入电量平衡或费用。"
          />
          <NumberField label="接入公网容量（kVA）" value={form.gridKva} onChange={set("gridKva")} />
          <NumberField label="申报最大需量（kW）" value={form.maxDemandKw} onChange={set("maxDemandKw")} />
        </div>
      </section>

      <section className="card" id="prices">
        <div className="section-head">
          <div>
            <h2>电价、费用与投资</h2>
            <p>直供电价进入项目收入；用户侧输配电费只进入到户电价，不进入 IRR。</p>
          </div>
        </div>
        <div className="fields">
          <NumberField label="直供电价（元/kWh）" value={form.directPrice} onChange={set("directPrice")} />
          <NumberField label="下网市场购电价（元/kWh）" value={form.gridPurchasePrice} onChange={set("gridPurchasePrice")} />
          <NumberField label="电网购电对照到户价（元/kWh）" value={form.baselinePrice} onChange={set("baselinePrice")} />
          <NumberField label="上网结算均价（元/kWh）" value={form.exportPrice} onChange={set("exportPrice")} />
          <NumberField label="全省平均负荷率（%）" value={form.loadFactorPct} onChange={set("loadFactorPct")} />
          <NumberField label="系统运行费（元/kWh）" value={form.systemOpPrice} onChange={set("systemOpPrice")} />
          <NumberField label="线损费单价（元/kWh）" value={form.lineLossPrice} onChange={set("lineLossPrice")} />
          <NumberField label="政府性基金及附加（元/kWh）" value={form.fundPrice} onChange={set("fundPrice")} />
          <NumberField label="交叉补贴单价（元/kWh）" value={form.crossSubsidyPrice} onChange={set("crossSubsidyPrice")} />
          <NumberField
            label="绿证/CBAM 折算单价（元/kWh）"
            value={form.greenPrice}
            onChange={set("greenPrice")}
            hint="只单列，不进到户价、节省额、IRR、NPV 与 LCOE。"
          />
          <NumberField label="光伏单位投资（元/W）" value={form.pvUnit} onChange={set("pvUnit")} />
          <NumberField label="风电单位投资（元/W）" value={form.windUnit} onChange={set("windUnit")} />
          <NumberField label="储能单位投资（元/Wh）" value={form.storageUnit} onChange={set("storageUnit")} />
          <NumberField label="专线及升压投资（万元）" value={form.lineCapex} onChange={set("lineCapex")} />
          <NumberField label="资本金比例（%）" value={form.equityPct} onChange={set("equityPct")} />
          <NumberField label="贷款利率（%）" value={form.loanRatePct} onChange={set("loanRatePct")} />
          <NumberField label="贷款年限（年）" value={form.loanYears} onChange={set("loanYears")} />
          <NumberField label="运营期（年）" value={form.life} onChange={set("life")} />
          <NumberField label="运维费率（%）" value={form.opexPct} onChange={set("opexPct")} />
          <NumberField label="保险费率（%）" value={form.insurancePct} onChange={set("insurancePct")} />
          <NumberField label="基准折现率（%）" value={form.discountPct} onChange={set("discountPct")} />
        </div>
      </section>

      <details className="card">
        <summary>更多财务假设</summary>
        <div className="fields">
          <NumberField label="年租金（万元/年）" value={form.rent} onChange={set("rent")} />
          <NumberField label="土地取得费（万元）" value={form.landCapex} onChange={set("landCapex")} />
          <NumberField label="土地摊销年限（年）" value={form.landAmortYears} onChange={set("landAmortYears")} />
          <NumberField label="土地可抵扣进项税（万元）" value={form.landInputVat} onChange={set("landInputVat")} />
          <NumberField label="期末可回收净额（万元）" value={form.terminal} onChange={set("terminal")} />
          <NumberField label="折旧年限（年）" value={form.depYears} onChange={set("depYears")} />
          <NumberField label="残值率（%）" value={form.residualPct} onChange={set("residualPct")} />
          <NumberField label="所得税率（%）" value={form.incomeTaxPct} onChange={set("incomeTaxPct")} />
          <NumberField label="可抵扣进项税比例（%）" value={form.inputVatPct} onChange={set("inputVatPct")} />
          <NumberField label="储能更换年份（第 N 年）" value={form.replaceYear} onChange={set("replaceYear")} />
          <NumberField label="更换费用比例（%）" value={form.replacePct} onChange={set("replacePct")} />
        </div>
      </details>
    </div>
  );
}
