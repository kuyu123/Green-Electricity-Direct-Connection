import { describe, expect, it } from "vitest";
import seed from "../data/seed-data.json";
import {
  DEFAULT_FORM,
  TARIFFS,
  applyOfficialTariff,
  evaluateProjectFull,
  findTariff,
} from "./calculator";

describe("价库", () => {
  it("覆盖 34 个价区、130 条输配电价、44 个参数", () => {
    expect(seed.regions).toHaveLength(34);
    expect(seed.tariffs).toHaveLength(130);
    expect(seed.parameters).toHaveLength(44);
    expect(TARIFFS).toHaveLength(130);
    expect(seed.regions).toContain("深圳");
    expect(seed.tariffs.filter((row) => row.region === "深圳")).toHaveLength(0);
    expect(new Set(seed.tariffs.map((row) => row.region)).size).toBe(33);
  });

  it("山东 110 千伏与默认电价一致，深圳无记录，辽宁与吉林缺 35 千伏", () => {
    expect(findTariff("山东", "110千伏")).toEqual(["山东", "110千伏", 0.106, 36, 22.5]);
    expect(findTariff("深圳", "110千伏")).toBeUndefined();
    expect(findTariff("辽宁", "35千伏")).toBeUndefined();
    expect(findTariff("吉林", "35千伏")).toBeUndefined();
    const cleared = applyOfficialTariff(DEFAULT_FORM, "深圳", "110千伏");
    expect(cleared.energyPrice).toBe("0");
    expect(cleared.demandPrice).toBe("0");
    expect(cleared.capacityPrice).toBe("0");
  });
});

describe("默认方案（山东、110 千伏、并网、单一容量制）", () => {
  const result = evaluateProjectFull(DEFAULT_FORM);

  it("复现 v3.1 勾稽指标", () => {
    expect(((result.irrPre ?? NaN) * 100).toFixed(6)).toBe("3.891244");
    expect(((result.irrPost ?? NaN) * 100).toFixed(6)).toBe("3.230894");
    expect(((result.irrEq ?? NaN) * 100).toFixed(6)).toBe("2.580184");
    expect(result.npv.toFixed(4)).toBe("-9115.9104");
    expect(result.paybackStatic?.toFixed(4)).toBe("16.4943");
    expect(result.paybackDynamic).toBeNull();
    expect(result.lcoe?.toFixed(6)).toBe("0.333868");
    expect(result.delivered.toFixed(7)).toBe("0.5975425");
    expect(result.saving.toFixed(2)).toBe("269.49");
  });

  it("电量、红线、用户成本与投资拆分与口径说明一致", () => {
    expect(result.available).toBe(11000);
    expect(result.net).toBe(10780);
    expect(result.selfUse).toBe(9000);
    expect(result.exported).toBe(1780);
    expect(result.downstream).toBe(3000);
    expect(result.selfToGen).toBeCloseTo(0.8181818181818182, 12);
    expect(result.selfToLoad).toBe(0.75);
    expect(result.expToGen).toBeCloseTo(0.1618181818181818, 12);
    expect(result.selfToGenPass).toBe(true);
    expect(result.selfToLoadPass).toBe(true);
    expect(result.expToGenPass).toBe(true);
    expect(result.officialMissing).toBe(false);
    expect(result.longHorizon).toBe(false);

    expect(result.capacityFee).toBeCloseTo(675, 10);
    expect(result.tdFee).toBeCloseTo(1276.77, 10);
    expect(result.userCost).toBeCloseTo(7170.51, 10);
    expect(result.green).toBe(45);
    expect(result.totalCapex).toBe(40000);
    expect(result.equity).toBe(12000);
    expect(result.loan).toBe(28000);
    expect(result.annualOpex).toBeCloseTo(580, 10);
    expect(result.debtService).toBeCloseTo(2607.19, 2);
    expect(result.rows[12]?.replace).toBe(2000);
    expect(result.rows).toHaveLength(26);
  });
});

describe("形态开关", () => {
  it("离网不计上网与下网，也不考核上网比例", () => {
    const result = evaluateProjectFull({ ...DEFAULT_FORM, projectType: "离网型" });
    expect(result.exported).toBe(0);
    expect(result.downstream).toBe(0);
    expect(result.capacityFee).toBe(0);
    expect(result.tdFee).toBe(0);
    expect(result.expToGenPass).toBe(true);
    expect(result.selfUse).toBe(9000);
  });

  it("关闭三免三减半会改变税后 IRR", () => {
    const withHoliday = evaluateProjectFull(DEFAULT_FORM);
    const without = evaluateProjectFull({ ...DEFAULT_FORM, taxHoliday: "否" });
    expect(without.irrPost).not.toBe(withHoliday.irrPost);
    expect(without.irrPre).toBe(withHoliday.irrPre);
  });

  it("价库缺口时给出警告且用户侧输配电价按 0 计", () => {
    const form = applyOfficialTariff(DEFAULT_FORM, "辽宁", "35千伏");
    const result = evaluateProjectFull(form);
    expect(result.officialMissing).toBe(true);
    expect(result.tdFee).toBe(0);
    expect(result.capacityFee).toBe(0);
  });
});
