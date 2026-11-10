import seed from "../data/seed-data.json";

/**
 * 绿电直连经济测算 v3.1 计算引擎。
 * 公式与默认数字与已校验的参考实现一致：期末折现、增值税 13%、附加 12%。
 * 价库来自第四监管周期省级输配电价（34 个价区、130 条）。
 */

export const VAT_RATE = 0.13;
export const SURCHARGE_RATE = 0.12;

export const REGIONS = seed.regions;
export const VOLTAGES = seed.voltageLevels;

export const MODEL = seed.model;

type TariffRow = [string, string, number, number, number];

export const TARIFFS: TariffRow[] = seed.tariffs.map(
  (row): TariffRow => [row.region, row.voltageLevel, row.energyPrice, row.demandPrice, row.capacityPrice],
);

export type ProjectType = "并网型" | "离网型";
export type TdMode = "单一容量制" | "两部制";
export type CapMode = "按容量" | "按需量";
export type FundScope = "下网+自用" | "仅下网";
export type YesNo = "是" | "否";

export type FormState = {
  region: string;
  voltage: string;
  projectType: ProjectType;
  tdMode: TdMode;
  capMode: CapMode;
  fundScope: FundScope;
  taxHoliday: YesNo;
  pvMw: string;
  pvHours: string;
  windMw: string;
  windHours: string;
  storageMw: string;
  storageMwh: string;
  gridKva: string;
  maxDemandKw: string;
  load: string;
  selfUse: string;
  curtailmentPct: string;
  degradationPct: string;
  directPrice: string;
  gridPurchasePrice: string;
  baselinePrice: string;
  exportPrice: string;
  loadFactorPct: string;
  systemOpPrice: string;
  lineLossPrice: string;
  fundPrice: string;
  crossSubsidyPrice: string;
  greenPrice: string;
  energyPrice: string;
  demandPrice: string;
  capacityPrice: string;
  pvUnit: string;
  windUnit: string;
  storageUnit: string;
  lineCapex: string;
  equityPct: string;
  loanRatePct: string;
  loanYears: string;
  life: string;
  opexPct: string;
  insurancePct: string;
  rent: string;
  landCapex: string;
  landAmortYears: string;
  landInputVat: string;
  terminal: string;
  depYears: string;
  residualPct: string;
  incomeTaxPct: string;
  inputVatPct: string;
  discountPct: string;
  replaceYear: string;
  replacePct: string;
};

export const DEFAULT_FORM: FormState = {
  region: "山东",
  voltage: "110千伏",
  projectType: "并网型",
  tdMode: "单一容量制",
  capMode: "按容量",
  fundScope: "下网+自用",
  taxHoliday: "是",
  pvMw: "100",
  pvHours: "1100",
  windMw: "0",
  windHours: "0",
  storageMw: "20",
  storageMwh: "40",
  gridKva: "25000",
  maxDemandKw: "20000",
  load: "12000",
  selfUse: "9000",
  curtailmentPct: "2",
  degradationPct: "0.5",
  directPrice: "0.35",
  gridPurchasePrice: "0.55",
  baselinePrice: "0.62",
  exportPrice: "0.2",
  loadFactorPct: "55",
  systemOpPrice: "0.0209",
  lineLossPrice: "0.01",
  fundPrice: "0.02717",
  crossSubsidyPrice: "0",
  greenPrice: "0.005",
  energyPrice: "0.106",
  demandPrice: "36",
  capacityPrice: "22.5",
  pvUnit: "3",
  windUnit: "4.5",
  storageUnit: "1",
  lineCapex: "6000",
  equityPct: "30",
  loanRatePct: "4.5",
  loanYears: "15",
  life: "25",
  opexPct: "1.2",
  insurancePct: "0.25",
  rent: "0",
  landCapex: "0",
  landAmortYears: "0",
  landInputVat: "0",
  terminal: "0",
  depYears: "20",
  residualPct: "5",
  incomeTaxPct: "25",
  inputVatPct: "10",
  discountPct: "6",
  replaceYear: "12",
  replacePct: "50",
};

export type FlowRow = {
  year: number;
  revenue: number;
  vatPaid: number;
  surcharge: number;
  replace: number;
  taxAll: number;
  taxEq: number;
  cfPre: number;
  cfPost: number;
  cfEq: number;
  cumPost: number;
  cumDisc: number;
};

export type ProjectResult = {
  officialMissing: boolean;
  longHorizon: boolean;
  available: number;
  net: number;
  selfUse: number;
  exported: number;
  downstream: number;
  selfToGen: number;
  selfToLoad: number;
  expToGen: number;
  selfToGenPass: boolean;
  selfToLoadPass: boolean;
  expToGenPass: boolean;
  pvCapex: number;
  windCapex: number;
  storageCapex: number;
  lineCapex: number;
  landCapex: number;
  totalCapex: number;
  equity: number;
  loan: number;
  capacityFee: number;
  tdFee: number;
  sysFee: number;
  lossFee: number;
  crossFee: number;
  fundFee: number;
  directFee: number;
  marketFee: number;
  userCost: number;
  baseline: number;
  delivered: number;
  saving: number;
  savingRate: number;
  green: number;
  irrPre: number | null;
  irrPost: number | null;
  irrEq: number | null;
  npv: number;
  paybackStatic: number | null;
  paybackDynamic: number | null;
  lcoe: number | null;
  annualOpex: number;
  debtService: number;
  rows: FlowRow[];
  postFlows: number[];
  cumDisc: number[];
};

export function toNumber(raw: string): number {
  const n = Number(String(raw).trim());
  return Number.isFinite(n) ? n : 0;
}

export function pct(raw: string): number {
  return toNumber(raw) / 100;
}

function wholeYears(value: number): number {
  return Math.max(0, Math.round(value));
}

function safeDiv(num: number, den: number): number {
  return den === 0 ? 0 : num / den;
}

export function presentValue(rate: number, cashFlows: number[]): number {
  return cashFlows.reduce((sum, value, t) => sum + value / (1 + rate) ** t, 0);
}

export function solveIrr(cashFlows: number[]): number | null {
  const loBound = -0.99;
  const hiBound = 4;
  if (presentValue(loBound, cashFlows) * presentValue(hiBound, cashFlows) > 0) return null;
  let lo = loBound;
  let hi = hiBound;
  for (let i = 0; i < 240; i += 1) {
    const mid = (lo + hi) / 2;
    if (presentValue(mid, cashFlows) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function interpolatedPayback(cashFlows: number[], rate = 0): number | null {
  let running = cashFlows[0] ?? 0;
  for (let t = 1; t < cashFlows.length; t += 1) {
    const step = (cashFlows[t] ?? 0) / (1 + rate) ** t;
    if (running < 0 && running + step >= 0 && step > 0) {
      return t - 1 + Math.abs(running) / step;
    }
    running += step;
  }
  return null;
}

function drawLosses(pool: number[], profitBefore: number): number {
  const stock = pool.reduce((sum, value) => sum + value, 0);
  const drawn = Math.min(Math.max(profitBefore, 0), stock);
  let remain = drawn;
  for (let i = pool.length - 1; i >= 0; i -= 1) {
    const take = Math.min(pool[i] ?? 0, remain);
    pool[i] = (pool[i] ?? 0) - take;
    remain -= take;
  }
  return drawn;
}

export function findTariff(region: string, voltage: string): TariffRow | undefined {
  return TARIFFS.find((row) => row[0] === region && row[1] === voltage);
}

export function applyOfficialTariff(form: FormState, region: string, voltage: string): FormState {
  const official = findTariff(region, voltage);
  if (!official) {
    return { ...form, region, voltage, energyPrice: "0", demandPrice: "0", capacityPrice: "0" };
  }
  return {
    ...form,
    region,
    voltage,
    energyPrice: String(official[2]),
    demandPrice: String(official[3]),
    capacityPrice: String(official[4]),
  };
}

export function evaluateProject(form: FormState): ProjectResult {
  const gridOn = form.projectType === "并网型";
  const holidayOn = form.taxHoliday === "是";
  const officialMissing = !findTariff(form.region, form.voltage);
  const energyPrice = toNumber(form.energyPrice);
  const demandPrice = toNumber(form.demandPrice);
  const capacityPrice = toNumber(form.capacityPrice);

  const pvMw = toNumber(form.pvMw);
  const pvHours = toNumber(form.pvHours);
  const windMw = toNumber(form.windMw);
  const windHours = toNumber(form.windHours);
  const load = toNumber(form.load);
  const selfUseIn = toNumber(form.selfUse);
  const curtailment = pct(form.curtailmentPct);
  const degradation = pct(form.degradationPct);

  const available = (pvMw * pvHours + windMw * windHours) * 0.1;
  const net = available * (1 - curtailment);
  const selfUse = gridOn ? Math.min(selfUseIn, net) : Math.min(selfUseIn, net, load);
  const exported = gridOn ? Math.max(net - selfUse, 0) : 0;
  const downstream = gridOn ? Math.max(load - selfUse, 0) : 0;

  let capacityFee = 0;
  let tdFee = 0;
  let sysFee = 0;
  let lossFee = 0;
  let crossFee = 0;
  let fundBase = selfUse;
  if (gridOn) {
    capacityFee =
      form.capMode === "按需量"
        ? (demandPrice * toNumber(form.maxDemandKw) * 12) / 10000
        : (capacityPrice * toNumber(form.gridKva) * 12) / 10000;
    tdFee =
      form.tdMode === "单一容量制"
        ? (energyPrice * pct(form.loadFactorPct) * 730 * 12 * toNumber(form.gridKva)) / 10000
        : energyPrice * (downstream + selfUse);
    sysFee = toNumber(form.systemOpPrice) * downstream;
    lossFee = toNumber(form.lineLossPrice) * downstream;
    crossFee = toNumber(form.crossSubsidyPrice) * downstream;
    fundBase = downstream + (form.fundScope === "下网+自用" ? selfUse : 0);
  }
  const fundFee = toNumber(form.fundPrice) * fundBase;
  const directFee = toNumber(form.directPrice) * selfUse;
  const marketFee = toNumber(form.gridPurchasePrice) * downstream;
  const userCost = directFee + marketFee + capacityFee + tdFee + sysFee + lossFee + crossFee + fundFee;
  const baseline = toNumber(form.baselinePrice) * load;
  const saving = baseline - userCost;

  const pvCapex = pvMw * toNumber(form.pvUnit) * 100;
  const windCapex = windMw * toNumber(form.windUnit) * 100;
  const storageCapex = toNumber(form.storageMwh) * toNumber(form.storageUnit) * 100;
  const lineCapex = toNumber(form.lineCapex);
  const landCapex = toNumber(form.landCapex);
  const depreciable = pvCapex + windCapex + storageCapex + lineCapex;
  const totalCapex = depreciable + landCapex;
  const equity = totalCapex * pct(form.equityPct);
  const loan = totalCapex - equity;
  const holidayWeight = safeDiv(pvCapex + windCapex, totalCapex);

  const nOp = wholeYears(toNumber(form.life));
  const nLoan = wholeYears(toNumber(form.loanYears));
  const nDep = wholeYears(toNumber(form.depYears));
  const nLand = wholeYears(toNumber(form.landAmortYears));
  const replaceAt = wholeYears(toNumber(form.replaceYear));
  const loanRate = pct(form.loanRatePct);
  let debtService = 0;
  if (nLoan === 0) debtService = 0;
  else if (loanRate === 0) debtService = loan / nLoan;
  else debtService = (loan * loanRate) / (1 - (1 + loanRate) ** -nLoan);

  const capexNet = depreciable * (1 - pct(form.inputVatPct));
  let vatPool = depreciable * pct(form.inputVatPct) + toNumber(form.landInputVat);
  const depBase = capexNet * (1 - pct(form.residualPct));
  const annualDep = nDep > 0 ? depBase / nDep : 0;
  const landBasis = Math.max(0, landCapex - toNumber(form.landInputVat));
  const annualLand = landBasis > 0 && nLand > 0 ? landBasis / nLand : 0;
  const annualOpex = depreciable * (pct(form.opexPct) + pct(form.insurancePct)) + toNumber(form.rent);
  const leftoverBook = nDep > 0 ? (depBase * Math.max(0, nDep - nOp)) / nDep : 0;
  const terminal = capexNet * pct(form.residualPct) + leftoverBook + toNumber(form.terminal);
  const discount = pct(form.discountPct);
  const incomeTax = pct(form.incomeTaxPct);
  const replaceRatio = pct(form.replacePct);
  const directPrice = toNumber(form.directPrice);
  const exportPrice = toNumber(form.exportPrice);

  const pre = [-totalCapex];
  const post = [-totalCapex];
  const eq = [-equity];
  const genLcoe = [0];
  const costLcoe = [0];
  let loanBal = loan;
  let allLosses = [0, 0, 0, 0, 0];
  let eqLosses = [0, 0, 0, 0, 0];

  for (let year = 1; year <= nOp; year += 1) {
    const fade = (1 - degradation) ** (year - 1);
    const revenue = directPrice * selfUse * fade + exportPrice * exported * fade;
    const netRev = revenue / (1 + VAT_RATE);
    const outVat = revenue - netRev;
    const replace = year === replaceAt ? storageCapex * replaceRatio : 0;
    const replaceVat = (replace * VAT_RATE) / (1 + VAT_RATE);
    const vatAvail = vatPool + replaceVat;
    const vatPaid = Math.max(0, outVat - vatAvail);
    vatPool = Math.max(0, vatAvail - outVat);
    const surcharge = vatPaid * SURCHARGE_RATE;
    const interest = year <= nLoan ? loanBal * loanRate : 0;
    const debt = year <= nLoan ? debtService : 0;
    loanBal = Math.max(0, loanBal - (debt - interest));
    const dep = year <= nDep ? annualDep : 0;
    const landAm = year <= nLand ? annualLand : 0;
    const holidayK = holidayOn ? (year <= 3 ? 0 : year <= 6 ? 0.5 : 1) : 1;
    const taxFactor = holidayWeight * holidayK + (1 - holidayWeight);

    const ebtAll = netRev - annualOpex - surcharge - dep - landAm - replace;
    const usedAll = drawLosses(allLosses, ebtAll);
    const taxAll = (Math.max(ebtAll, 0) - usedAll) * incomeTax * taxFactor;
    allLosses = [Math.max(0, -ebtAll), ...allLosses.slice(0, 4)];

    const ebtEq = ebtAll - interest;
    const usedEq = drawLosses(eqLosses, ebtEq);
    const taxEq = (Math.max(ebtEq, 0) - usedEq) * incomeTax * taxFactor;
    eqLosses = [Math.max(0, -ebtEq), ...eqLosses.slice(0, 4)];

    const recovery = year === nOp ? terminal : 0;
    const balloon = year === nOp && nLoan > nOp ? loanBal : 0;
    const cfPre = revenue - annualOpex - vatPaid - surcharge - replace + recovery;
    const cfPost = cfPre - taxAll;
    const cfEq = revenue - annualOpex - vatPaid - surcharge - replace - debt - taxEq + recovery - balloon;
    pre.push(cfPre);
    post.push(cfPost);
    eq.push(cfEq);
    genLcoe.push(net * fade);
    costLcoe.push(annualOpex + replace - recovery);
  }

  const den = presentValue(discount, genLcoe);
  const num = capexNet + landBasis + presentValue(discount, costLcoe);
  const rows: FlowRow[] = [];
  let cumPost = 0;
  let cumDisc = 0;
  const cumDiscSeries: number[] = [];
  for (let t = 0; t < post.length; t += 1) {
    const cfPost = post[t] ?? 0;
    cumPost += cfPost;
    cumDisc += cfPost / (1 + discount) ** t;
    cumDiscSeries.push(cumDisc);
    rows.push({
      year: t,
      revenue: 0,
      vatPaid: 0,
      surcharge: 0,
      replace: 0,
      taxAll: 0,
      taxEq: 0,
      cfPre: pre[t] ?? 0,
      cfPost,
      cfEq: eq[t] ?? 0,
      cumPost,
      cumDisc,
    });
  }

  return {
    officialMissing,
    longHorizon: nOp > 25,
    available,
    net,
    selfUse,
    exported,
    downstream,
    selfToGen: safeDiv(selfUse, available),
    selfToLoad: safeDiv(selfUse, load),
    expToGen: safeDiv(exported, available),
    selfToGenPass: safeDiv(selfUse, available) >= 0.6,
    selfToLoadPass: safeDiv(selfUse, load) >= 0.3,
    expToGenPass: !gridOn || safeDiv(exported, available) <= 0.2,
    pvCapex,
    windCapex,
    storageCapex,
    lineCapex,
    landCapex,
    totalCapex,
    equity,
    loan,
    capacityFee,
    tdFee,
    sysFee,
    lossFee,
    crossFee,
    fundFee,
    directFee,
    marketFee,
    userCost,
    baseline,
    delivered: safeDiv(userCost, load),
    saving,
    savingRate: safeDiv(saving, baseline),
    green: toNumber(form.greenPrice) * selfUse,
    irrPre: solveIrr(pre),
    irrPost: solveIrr(post),
    irrEq: solveIrr(eq),
    npv: presentValue(discount, post),
    paybackStatic: interpolatedPayback(post),
    paybackDynamic: interpolatedPayback(post, discount),
    lcoe: den > 0 ? num / den : null,
    annualOpex,
    debtService,
    rows,
    postFlows: post,
    cumDisc: cumDiscSeries,
  };
}

function recordYearDetails(form: FormState, skeleton: ProjectResult): ProjectResult {
  const holidayOn = form.taxHoliday === "是";
  const degradation = pct(form.degradationPct);
  const directPrice = toNumber(form.directPrice);
  const exportPrice = toNumber(form.exportPrice);
  const storageCapex = skeleton.storageCapex;
  const nOp = wholeYears(toNumber(form.life));
  const nLoan = wholeYears(toNumber(form.loanYears));
  const nDep = wholeYears(toNumber(form.depYears));
  const nLand = wholeYears(toNumber(form.landAmortYears));
  const replaceAt = wholeYears(toNumber(form.replaceYear));
  const loanRate = pct(form.loanRatePct);
  const incomeTax = pct(form.incomeTaxPct);
  const replaceRatio = pct(form.replacePct);
  const holidayWeight = safeDiv(skeleton.pvCapex + skeleton.windCapex, skeleton.totalCapex);
  const depreciable = skeleton.pvCapex + skeleton.windCapex + skeleton.storageCapex + skeleton.lineCapex;
  let vatPool = depreciable * pct(form.inputVatPct) + toNumber(form.landInputVat);
  const landBasis = Math.max(0, skeleton.landCapex - toNumber(form.landInputVat));
  const capexNet = depreciable * (1 - pct(form.inputVatPct));
  const depBase = capexNet * (1 - pct(form.residualPct));
  const annualDep = nDep > 0 ? depBase / nDep : 0;
  const annualLand = landBasis > 0 && nLand > 0 ? landBasis / nLand : 0;
  let loanBal = skeleton.loan;
  let allLosses = [0, 0, 0, 0, 0];
  let eqLosses = [0, 0, 0, 0, 0];

  const details: Array<Pick<FlowRow, "revenue" | "vatPaid" | "surcharge" | "replace" | "taxAll" | "taxEq">> = [
    { revenue: 0, vatPaid: 0, surcharge: 0, replace: 0, taxAll: 0, taxEq: 0 },
  ];

  for (let year = 1; year <= nOp; year += 1) {
    const fade = (1 - degradation) ** (year - 1);
    const revenue = directPrice * skeleton.selfUse * fade + exportPrice * skeleton.exported * fade;
    const netRev = revenue / (1 + VAT_RATE);
    const outVat = revenue - netRev;
    const replace = year === replaceAt ? storageCapex * replaceRatio : 0;
    const replaceVat = (replace * VAT_RATE) / (1 + VAT_RATE);
    const vatAvail = vatPool + replaceVat;
    const vatPaid = Math.max(0, outVat - vatAvail);
    vatPool = Math.max(0, vatAvail - outVat);
    const surcharge = vatPaid * SURCHARGE_RATE;
    const interest = year <= nLoan ? loanBal * loanRate : 0;
    const debt = year <= nLoan ? skeleton.debtService : 0;
    loanBal = Math.max(0, loanBal - (debt - interest));
    const dep = year <= nDep ? annualDep : 0;
    const landAm = year <= nLand ? annualLand : 0;
    const holidayK = holidayOn ? (year <= 3 ? 0 : year <= 6 ? 0.5 : 1) : 1;
    const taxFactor = holidayWeight * holidayK + (1 - holidayWeight);
    const ebtAll = netRev - skeleton.annualOpex - surcharge - dep - landAm - replace;
    const usedAll = drawLosses(allLosses, ebtAll);
    const taxAll = (Math.max(ebtAll, 0) - usedAll) * incomeTax * taxFactor;
    allLosses = [Math.max(0, -ebtAll), ...allLosses.slice(0, 4)];
    const ebtEq = ebtAll - interest;
    const usedEq = drawLosses(eqLosses, ebtEq);
    const taxEq = (Math.max(ebtEq, 0) - usedEq) * incomeTax * taxFactor;
    eqLosses = [Math.max(0, -ebtEq), ...eqLosses.slice(0, 4)];
    details.push({ revenue, vatPaid, surcharge, replace, taxAll, taxEq });
  }

  const rows = skeleton.rows.map((row, t) => ({
    ...row,
    ...(details[t] ?? { revenue: 0, vatPaid: 0, surcharge: 0, replace: 0, taxAll: 0, taxEq: 0 }),
  }));
  return { ...skeleton, rows };
}

export function evaluateProjectFull(form: FormState): ProjectResult {
  return recordYearDetails(form, evaluateProject(form));
}
