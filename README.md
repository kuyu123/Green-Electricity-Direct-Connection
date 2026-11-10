# 绿电直连经济评价

公开静态网站，用于按《绿电直连经济测算》**v3.1** 与国家发展改革委《关于完善价格机制促进新能源发电就近消纳的通知》（**发改价格〔2025〕1192 号**）做绿电直连项目的前期经济评价。

页面全部为中文。在浏览器中修改参数后立即重算，不上传、不保存输入。

在线地址（需在仓库 Settings → Pages 中把 Source 设为 GitHub Actions，且本工作流已在 `main` 上成功运行）：

https://kuyu123.github.io/Green-Electricity-Direct-Connection/

## 能算什么

- 三条准入红线：自发自用 / 可用发电量 ≥ 60%，自发自用 / 用户年用电量 ≥ 30%，上网电量 / 可用发电量 ≤ 20%（离网不考核）
- 综合到户电价、对照全部网购的年节省、绿证/CBAM 单列价值
- 税前 IRR、税后全投资 IRR、资本金 IRR、NPV、静态回收期、动态回收期
- 期末折现 LCOE（不含融资和所得税）
- 逐年现金流图和表

默认方案为**山东、110 千伏、并网型、单一容量制、按容量、政府性基金按下网+自用、三免三减半开启**。价库含 34 个价区、130 条第四监管周期省级输配电价（更新至 2026-07-10）和 44 个参数。深圳暂无电价；辽宁、吉林缺少 35 千伏。

## 本地运行

需要 Node.js 22。

```bash
npm ci
npm test
npm run dev
```

开发地址：http://localhost:5173/Green-Electricity-Direct-Connection/

```bash
npm run build    # 产物在 dist/，资源前缀为 /Green-Electricity-Direct-Connection/
npm run preview
```

## 默认方案勾稽

`npm test` 用 Vitest 锁定与 v3.1 默认方案一致的结果：

| 指标 | 数值 |
| --- | --- |
| 税前 IRR | 3.891244% |
| 税后 IRR | 3.230894% |
| 资本金 IRR | 2.580184% |
| NPV | −9115.9104 万元 |
| 静态回收期 | 16.4943 年 |
| 动态回收期 | 期内未回收 |
| LCOE | 0.333868 元/kWh |
| 综合到户电价 | 0.5975425 元/kWh |
| 年节省 | 269.49 万元 |

动态回收期为空，是因为税后 IRR 低于 6% 基准折现率、NPV 为负，不是计算失败。

## 部署

`.github/workflows/pages.yml` 在推送到 `main` 时执行：

1. `npm ci`、`npm test`、`npm run build`
2. `actions/configure-pages`
3. `actions/upload-pages-artifact`（上传 `dist/`）
4. `actions/deploy-pages`

Vite 的 `base` 为 `/Green-Electricity-Direct-Connection/`，与项目站点路径一致。

若页面打不开，请到仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。仅合并工作流文件不会自动打开这个开关。

## 口径与来源

计算引擎按已校验的参考公式独立实现：电量平衡、1192 号文单一容量制、增值税 13%、附加 12%、三免三减半（仅光伏与风电投资份额）、五年亏损结转、等额本息，以及期末折现。NPV 为各年现金流除以 (1+r)^t（第 0 年不折现）。LCOE =（净投资 + 土地计税基础 + 运维/更换/期末回收的现值）÷ 带衰减净发电量现值。

方法论与公开电价事实来自：

- 源 Excel《绿电直连经济测算》v3.1，作者**介子九维**（JIEZIJIUWEI）
- 公开仓库 [YANXUE112/green-power-direct-toolkit](https://github.com/YANXUE112/green-power-direct-toolkit)（无开源许可证，本仓库不复制其源代码）

主要简化：不变价；无建设期、建设期利息和流动资金；自用/上网/下网由填报值加上限，不做小时级匹配；储能功率不进电量平衡；附件 2 区域电网输电价不计入；2030 年起 35% 的自用占用电比例批注未改判定（仍为 30%）。结果仅供前期研判，不构成投资建议。
