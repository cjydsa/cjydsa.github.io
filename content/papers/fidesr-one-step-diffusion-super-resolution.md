---
title: FiDeSR: 高保真且细节保持的单步扩散超分辨率（CVPR 2026）
date: 2026-10-07
tags: [论文精读, 扩散模型, 超分辨率, 图像恢复, CVPR2026]
summary: 庆北大学提出的单步扩散超分框架 FiDeSR，用细节感知加权、潜空间残差精化与频率注入三个组件，在 1 步推理内同时拉满感知质量与结构保真，全面超越 PiSA-SR 等一步方法。
pinned: false
---

## 论文信息

- **标题**：FiDeSR: High-Fidelity and Detail-Preserving One-Step Diffusion Super-Resolution
- **作者 / 机构**：Aro Kim*, Myeongjin Jang*, Chaewon Moon, Youngjin Shin, Jinwoo Jeong（KETI）, Sang-hyo Park† — 庆北国立大学 / 韩国电子技术研究院
- **发表**：CVPR 2026（arXiv 2603.02692，2026-03-03 提交）
- **链接**：
  - 论文：[arXiv](https://arxiv.org/abs/2603.02692) / [HTML](https://arxiv.org/html/2603.02692v1)
  - 代码：[github.com/Ar0Kim/FiDeSR](https://github.com/Ar0Kim/FiDeSR)（已宣布开源）

## 一句话总结

单步扩散超分一直卡在"感知好但结构歪"或"结构稳但细节糊"的二选一路上。FiDeSR 用**训练时细节感知加权（DAW）+ 潜空间残差精化块（LRRB）+ 推理时免重训的频率注入（LFIM）**三件套，在只走 1 步扩散的前提下，同时把 PSNR/SSIM（保真）和 MUSIQ/MANIQA（感知）推到单步方法 SOTA，FID 甚至超过多数多步方法。

## 解决什么问题

真实世界图像超分（Real-ISR）中，扩散模型是主流生成先验，但多步扩散推理太慢。单步蒸馏（OSEDiff、PiSA-SR、SinSR 等）解决了速度，却留下三个硬伤，作者在 Fig. 2 用失败案例直接点名：

1. **结构失真 / 低频不一致**：VAE 条件化让单步模型输出偏离 GT 结构（如 AddSR 的形变）；
2. **高频细节不足**：多步扩散靠迭代去噪补高频，压缩到 1 步后细节欠恢复（如 OSEDiff 过度平滑）；
3. **全局单一残差预测不稳定**：PiSA-SR 让 U-Net 每阶段只预测一个全局残差 `z0 = zL - r`，导致高频重建伪影和"过度细节"（如 PiSA-SR 的过锐纹理）。

本质上这是感知-失真权衡（perception–distortion trade-off）在单步设定下的集中爆发。

## 核心方法

框架以 **Stable Diffusion 2.1-base** 为底（VAE 与 U-Net 冻结，U-Net 上挂 LoRA rank=8 微调），核心思想是"U-Net 先给个粗残差，LRRB 再精化，LFIM 在推理时按需注入频率分量"。

### 1. 细节感知加权 DAW（训练时）

不用傅里叶域显式分解，直接在空间域构造两幅图：

**细节图**（对 HQ 图做三个算子取平均）：

```latex
D = ( Sobel(x_H) + Laplacian(x_H) + Variance(x_H) ) / 3
```

**误差图**（像素级 L1 与感知级 LPIPS 混合）：

```latex
E_pix = |x_SR - x_H|,  E_perc = LPIPS(x_SR, x_H)
E = (1-p)·E_pix + p·E_perc
```

两者逐像素相乘得到**难度权重图**：

```latex
W_DAW = D ⊙ E
```

直觉：只把训练火力集中到"细节丰富**且**模型当前预测差"的区域，避免模型在已经还原得好的平坦区过拟合。DAW 同时调制重建损失（MSE 项用全分辨率权重，LPIPS 项用插值后的权重 `W'_DAW`）和 CSD（classifier score distillation）正则项。

补充材料给出完整伪代码（Alg. 1）：细节图与误差图都做分位数归一化，`W = tanh(blur(D⊙E)/w_max)·w_max`，再 `w* = mean_norm(1 + α·W)` 保证权重非负且均值为 1，最后对 L2 / LPIPS / CSD 三项损失统一加权。

### 2. 潜空间残差精化块 LRRB

PiSA-SR 的残差 `r` 是 U-Net 单次前向给出来的"一锤定音"预测。FiDeSR 在潜空间插入一个 **Residual-in-Residual Dense Block（RRDB）** 结构（源自 ESRGAN 但改到潜空间）：

- 输入：`[z_L ; r]` 拼接（LQ 潜变量 + U-Net 粗残差）
- 1×1 卷积映射到中间维度 → 若干 RRDB 密集块 → 1×1 卷积还原通道，输出修正量 `Δr`
- 精化残差：`r' = r + Δr`
- 精化潜变量：`z_r = z_L - r'`

关键区别：ESRGAN 的 RRDB 在像素域假设残差预测是稳定的，而 LRRB 专门针对"扩散一步推理导致的高频噪声预测误差"做二次修正。论文 Table 3 量化了这个收益：高频噪声预测 MSE 从 baseline 的 0.1049（三数据集平均）降到 0.1032，相对改善 1.62%（DIV2K 1.24% / DRealSR 1.99% / RealSR 1.62%）。消融可视化（Fig. 10）显示误差改善集中在边缘和精细纹理这些感知关键区。

代价极小：LRRB 只增加 0.01B 参数（1.29B 基座的 0.8%），推理多 0.0063s（0.078s 的 8.1%）。

### 3. 潜在频率注入模块 LFIM（推理时，免重训）

LRRB 输出的精化潜变量 `z_r` 经 **FFT + Butterworth 滤波器**拆成低频 `Δ_LP` 与高频 `Δ_HP`，再通过双门控选择性注入：

- **空间门控 `M_sp`**：由 LQ 图的 Sobel / Laplacian / 方差细节图推导，低频注入时限制在"细节丰富区域"少注（防过平滑），高频注入时通过细节依赖指数 `γ` 强调边缘区；
- **通道门控 `M_ch`**：用伪 PSD（功率谱密度）能量分析每个潜通道的频率占比，识别结构主导通道（低频）与频率丰富通道（高频，与低频门控互补）；

```latex
# 低频注入：稳结构、色调、光照
z ← z + lf_alpha · M_sp · M_ch · Δ_LP

# 高频注入：锐化纹理、边缘、微观细节
z ← z + hf_beta · M_sp^HF · M_ch^HF · Δ_HP
```

默认 `lf_alpha = 0.2, hf_beta = 0.2`。消融（Table 4 / Table 8）验证了两条独立收益曲线：

- **低频注入强度 ↑ → PSNR/SSIM 单调提升**（0.1→0.5：PSNR 26.29→26.34，SSIM 0.7506→0.7532），结构保真好但 MUSIQ/MANIQA 略降；
- **高频注入强度 ↑ → MUSIQ/MANIQA 单调提升**（0.1→0.5：MUSIQ 69.65→70.16，MANIQA 0.6639→0.6803），感知锐利但 PSNR/SSIM 略降。

两个旋钮让用户在"稳定输出"和"锐利细节"之间自由调节，且**完全不碰模型权重**——这是 LFIM 最工程化的卖点：同一组 LoRA 权重，推理时换参数即换风格。

### 4. 训练配置

| 项 | 值 |
| --- | --- |
| 基座 | Stable Diffusion 2.1-base（VAE + U-Net 冻结，LoRA rank=8） |
| 数据 | LSDIR + DIV2K + Flickr2K + FFHQ 前 10K，Real-ESRGAN 退化管线造 LQ-HQ 对 |
| 训练 | 2× H100，bs=8，200K 步，AdamW，lr=5e-5 |
| 损失 | `L_total = L_rec + L_reg`，`λ_mse=1, λ_lpips=2`；LPIPS 提供语义先验，CSD 蒸馏语义一致性 |
| 文本 prompt | RAM（Recognize Anything Model）自动提取 |

## 关键结果

### 定量：单步碾压多步，FID 全场最低

Table 1 三数据集（DRealSR / RealSR / DIV2K 合成集，LQ 128×128 → HQ 512×512），FiDeSR-1s 摘录关键列：

| 数据集 | 方法（步数） | PSNR↑ | SSIM↑ | LPIPS↓ | FID↓ | MUSIQ↑ | MANIQA↑ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DRealSR | StableSR-200s | 27.93 | 0.7491 | 0.3306 | 147.48 | 58.55 | 0.5569 |
| DRealSR | SeeSR-50s | 28.14 | 0.7713 | 0.3141 | 146.98 | 64.73 | 0.6016 |
| DRealSR | OSEDiff-1s | 27.92 | 0.7835 | 0.2967 | 135.45 | 64.70 | 0.5898 |
| DRealSR | PiSA-SR-1s | 28.32 | 0.7804 | 0.2960 | 130.48 | 66.11 | 0.6161 |
| DRealSR | **FiDeSR-1s** | **28.90** | **0.7907** | **0.2836** | **127.97** | 65.78 | **0.6239** |
| RealSR | **FiDeSR-1s** | **26.02** | **0.7457** | **0.2626** | **109.68** | 69.82 | **0.6681** |
| DIV2K | **FiDeSR-1s** | 24.33 | **0.6250** | **0.2678** | **23.30** | 68.87 | **0.6384** |

要点：

- **PSNR/SSIM/LPIPS/DISTS/FID 全部第一**（含 PASD-20s、SeeSR-50s 等多步方法），单步即达全局最低 FID（DRealSR 127.97 vs 最强多步 143.08）——作者强调这意味着"与真实图像分布的贴合度"甚至超过迭代采样方法；
- **感知类指标与 PiSA-SR 接近或反超**（MANIQA 0.6239 > 0.6161），MUSIQ 略低于 PiSA-SR（65.78 vs 66.11）但 PSNR 高出 0.58dB——用可忽略的感知损失换了显著的结构保真；
- 对比 GAN 阵营（Table 5）：FiDeSR 的 LPIPS/DISTS 明显优于 Real-ESRGAN / BSRGAN / LDL，FID 127.97 远低于 LDL 的 155.53。
- 用户研究（20 人 × 20 图）：FiDeSR 得票 21%，远超第二名 OSEDiff/SinSR 的 14%。

### 效率

Table 6（128×128 ×4 SR，单卡 H100）：

| 方法 | 步数 | 推理时间 | 参数量 |
| --- | --- | --- | --- |
| StableSR | 200 | 7.52s | 1.56B |
| DiffBIR | 50 | 2.04s | 1.68B |
| OSEDiff | 1 | 0.087s | 1.77B |
| PiSA-SR | 1 | 0.057s | 1.30B |
| **FiDeSR** | **1** | **0.078s** | **1.29B** |

比 PiSA-SR 慢 ~0.02s（LRRB 8.1% 开销 + LFIM 滤波），换来全面的质量提升；参数量是全场最小的 1.29B。

### 消融

- **LRRB & DAW（Table 2，DIV2K，LFIM 前）**：去掉 LRRB，MUSIQ 67.63→67.95（DAW 单独作用时）；去掉 DAW，MANIQA 0.6285→0.6236。双模块齐上时四项无参考指标（CLIP-IQA 0.6699 / NIQE 4.63 / MUSIQ 68.29 / MANIQA 0.6285）全部最优，两模块互补。
- **LoRA rank（Table 7）**：rank 4/8/16 性能都很稳，rank=8 在保真与感知间最均衡，rank=16 的 NIQE 略好（4.69 vs 5.33）。
- **LFIM 强度（Table 8）**：`(lf_alpha, hf_beta)` 从 (0.2,0.2) 到 (0.6,0.6) 逐步拉大，PSNR/SSIM 单调下降、MUSIQ/MANIQA 单调上升——验证了"低频管结构、高频管锐度"的正交控制。

## 我的理解与疑问

**值得借鉴的工程观：**

1. **"一锤定音"式的残差预测是单步扩散的结构性短板**。PiSA-SR 证明潜空间残差学习收敛快、效率高，但 U-Net 每阶段只出一次全局残差，天然无法修正自己。LRRB 的思路——把"预测残差"变成"预测残差 + 学习修正量 Δr"——本质上是在不增加扩散步数的情况下引入了一级迭代修正。这个 trick 很可能迁移到扩散去噪、inpainting 的其他单步/少步设定里。
2. **LFIM 把"增强强度"做成了推理期旋钮**。频率分解 + 双门控 + 免重训，用户侧只需两个标量 (`lf_alpha`, `hf_beta`) 就能在结构/感知两个轴上滑动。对部署型产品（端侧超分 App、图像编辑软件）这是很实用的设计——一个模型权重覆盖多档风格需求。
3. **DAW 的"误差 × 细节"乘积设计**比单纯 focal 加权或频域 loss 更聪明：它只在"模型当前学不好的高细节区"加权重力，既不浪费容量在易区，也不会放大平坦区的数值噪声。

**疑点与后续可深挖：**

- 全文没有报告**显存占用**和 CPU/移动端可用性，0.078s 是 H100 单卡的 H200 级指标；实际落地的瓶颈大概率还是 1.3B 的 SD2.1 底模本身。
- LFIM 依赖 LQ 图的 Sobel/Laplacian/方差细节图，**极端模糊或强噪声 LQ 输入下门控质量如何**论文没有讨论，这是实场景（手机老照片修复）最可能的失效点。
- 与 GAN 阵营（Table 5）FiDeSR 的 LPIPS 0.2836 vs LDL 0.2792、PSNR 略高但 MANIQA 0.6239 vs LDL 0.4894——感知指标的大幅领先部分来自扩散先验，而非方法本身；与单步方法的同场竞技才真正说明"单步做到感知 SOTA"的贡献。
- 退化管线统一用 Real-ESRGAN，训练/测试分布一致；论文没有报告**跨退化管线**（如 BSRO 真实退化）的泛化性，FID 的大幅领先里有相当部分来自分布匹配。
- 对比 TSD-SR（SD3 底座的单步方法）只出现在 related work（提到其网格伪影），没有同表定量对比，属于遗憾——如果 FiDeSR 想在"单步 SOTA"的位置上站稳，SD3 系基底的消融是必答题。

**一句话评价**：FiDeSR 不是方法上的范式创新，而是对"单步扩散 SR 三大短板"（低频歪、高频糊、残差不稳）逐一打补丁的精准工程——三个组件各自独立、消融干净、开销可控，是典型的"把已知短板逐个填平"的高质量工作。对做端侧/低延迟超分应用的同学，LFIM 的免重训双旋钮是最有直接复用价值的部分。

## 扩展阅读

- 直接前驱：PiSA-SR（CVPR 2025，[arXiv 2502.17005](https://arxiv.org/abs/2502.17005)）——单步潜空间残差 + Dual-LoRA；OSEDiff（NeurIPS 2024）——VSD + LoRA 一步 SR；SinSR（CVPR 2024）——确定性采样单步。
- 多步强基线：DiffBIR（ECCV 2024）、StableSR（IJCV 2024）、SeeSR（CVPR 2024）、PASD（ECCV 2024）。
- 频域 SR：TFDSR（IJCAI 2025）、FreeU（CVPR 2024）、FreqFormer（IJCAI 2024）。
