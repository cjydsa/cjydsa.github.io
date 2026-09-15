---
title: P2G-HAI：人物图像服装还原模型
date: 2025-12-01
tags: [科研, Stable Diffusion, 生成式AI, 计算机视觉]
summary: 基于 SD1.5 与混合注意力注入的人物图像服装还原（Person → Garment），成果被 ICITES 录用；FID 较基线下降 50%。代码与复现指南已开源。
pinned: true
link: https://github.com/cjydsa/P2G-HAI
---

## 概述

P2G-HAI 是一个基于 **Stable Diffusion 1.5** 的人物图像服装还原模型（Person → Garment Restoration），属于生成式 AI 与计算机视觉方向的研究工作，相关成果被 **ICITES** 录用（2025.06 — 2025.12）。

**代码与完整复现指南：[github.com/cjydsa/P2G-HAI](https://github.com/cjydsa/P2G-HAI)**

## 我的工作

参与模型设计、训练及实验评测，主要负责训练工程化部分：

- **批量数据处理**：训练数据的清洗、组织与流水线化处理
- **训练任务管理**：多组实验任务的调度与跟踪
- **显存优化**：在有限显存下支撑训练任务稳定运行
- **异常恢复**：训练中断后的检查点恢复机制
- **实验日志管理**：实验配置、指标与结果的结构化记录

## 结果

模型 **FID 指标较基线下降 50%**。

## 技术栈

`Stable Diffusion 1.5` · `PyTorch` · 生成式模型训练与评测
