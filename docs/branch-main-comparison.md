# main 与成员 1 分支：已完成 action items 对照

核验日期：2026-10-24。当前分支：`feat/matter-intake-workflow`。

本次读取了 Git 历史、main 文件与分支 diff，并通过 `git ls-remote origin refs/heads/main` 核验远端。**本地 main、origin/main 和远端 main 均为 `d6145a7`。** 下述功能差异快照截至 `ba2d140`；随后本轮修改的是规划、范围及协作约定，未增加应用功能。

## 1. main 已有什么

| 区域 | main 已有的内容 | 实现边界 |
| --- | --- | --- |
| 律师端 | 事项列表、新建事项、事项概览、问卷查看、清单、文件列表／审阅、补件操作、财务画像、活动、模板、设置 | 可点击原型；部分校验和跨页面状态规则尚未补齐 |
| 客户端 | 首页、分段问卷、清单、选择文件或复用文件、无法提供说明、补件请求 | 选文件后只把文件名写入前端状态；没有真实上传及完整版本／补交流程 |
| 业务骨架 | 问卷生成要求、文件和要求分离、一文件支持多要求、接受／退回、收集状态、样例账户发现 | 浏览器内存与 seed 数据；刷新重置 |
| 架构与阶段计划 | `architecture.md`、`nj-cis-plan.md` | 目标架构和 CIS 路线，不表示对应后端已实现 |

main 没有生产认证、数据库持久化、S3 文件存储、邮件发送、真人会话模块、Wise AI 面板／真实模型调用、确认事实工作流或 CIS/PDF 生成。已有 `requests.message` 是补件文字，`AI_DISCOVERY` 是样例要求来源，不能算 M3 消息或 AI 已完成。

main 中已有 `Party.role = CLIENT / OTHER_PARTY`，它区分事项中的当事人资料。**OTHER_PARTY 不代表对方拥有登录账号或第三种产品视图。**

## 2. 截至上一轮的三个提交

| 提交 | 具体新增内容 |
| --- | --- |
| `91e475c` | M1-01–M1-07 前端业务实现；对应测试和运行脚本；首页进入登录演示的路由调整 |
| `e1db8c0` | Turbopack CSS loader 使用 workerThreads，解决已复现的 EPERM；README 记录 production build 与版本兼容边界 |
| `ba2d140` | 新增法律流程地图、项目总览及路线图；本轮正在按用户澄清修正其分工范围 |

该快照相对 main 共 35 个文件变化。应用业务增量主要属于 M1，此外还包含测试、构建与文档，不能简写成“只改了 7 个文件”或“三人的业务都完成了”。

## 3. M1 每项完成了什么

| ID | 具体 action／完成结果 | 主要代码入口 |
| --- | --- | --- |
| M1-01 | 创建与模板统一为 NJ Divorce；未支持的州／事项类型不再作为可用选项 | `new-matter.tsx`、`templates-view.tsx` |
| M1-02 | 使用自定义事项名称显示和搜索；保留双方当事人及 county 查找 | `matters-list.tsx`、`format.ts`、`work-queues.ts` |
| M1-03 | 律师演示登录、客户邀请／验证码演示；输入／错误／过期／重置、邀请确认、复制反馈与返回；首页进入演示登录 | `attorney-sign-in.tsx`、`client-invitation.tsx`、`matter-overview.tsx`、sign-in／invite 路由 |
| M1-04 | 补齐 12 个问卷分段的必要／条件校验；当前会话草稿与已确认答案分离；Back／侧栏返回可保留草稿，刷新／关闭提示边界明确 | `portal-intake.tsx`、`intake-validation.ts`、`store.tsx`、`types.ts` |
| M1-05 | 账户新增／改名／移除同步资料要求；保留稳定关联和历史决定，恢复账户时恢复适用状态；样例税年／月份明确标示 | `requirements.ts`、`store.tsx`、`types.ts` |
| M1-06 | 增加 Overview 队列及状态筛选入口；待审、等客户、草稿、完成使用同源计数并跳转正确事项 | `workspace-overview.tsx`、`matters-list.tsx`、`work-queues.ts`、律师路由／shell |
| M1-07 | 律所资料和提醒参数校验；必填、邮箱、正整数及提醒顺序；保存反馈 | `settings-view.tsx`、`workspace-validation.ts` |

上述是前端内存演示行为；真实身份、邮件、保存与权限是老板后续服务的职责。测试位于 `tests/*.test.ts`，由 `scripts/run-tests.mjs` 运行。

历史验证：上一轮实际执行了 28 项测试、lint、production build 和代表性 production 浏览器流程。本次对照采用 Git／代码检查，未重新执行全部业务验收。

## 4. M2、M3 的边界

- 文件上传、文件审阅、客户补件／清单、财务画像等主要组件相对 main 未改动。共享 store 的审阅调整用于保留 M1 退役要求的历史决定，不能算 M2 的新文件版本闭环。
- 客户 `SUBMIT` 和律师 `MARK_COMPLETE` 的完成条件仍需 M2-07 补齐。
- M3 的真人消息数据模型、消息页面、AI 入口／面板没有在这三个提交中实现。
- 其他队友是否已在自己的分支完成，需要读取其分支或 PR 后判断；本文件只对当前分支作结论。

## 5. 后续 commit／PR 如何记录

已有提交保持原历史；从本次起按 action item 写标题和正文。规则见 [AGENTS.md](../AGENTS.md)，PR 使用 [模板](../.github/pull_request_template.md)。

示例格式（说明格式，不表示以下工作现在已完成）：

```text
feat(M2-03,M2-04): preserve rejection context when replacing files

Actions:
- M2-03: Show the rejected filename and reason in the client request.
- M2-04: Submit the replacement as a new pending-review version; retain history.

Verification:
- List commands actually run and observed results.
- Record the client -> attorney -> client scenario actually checked.

Remaining:
- State incomplete acceptance criteria and backend contract dependencies.
```

本轮范围修正 action items：

- **PLAN-01**：以原 21 项前端业务包为起点，重写后续前端 breakdown。
- **PLAN-02**：明确三名前端／老板后端，以及 attorney／client 两视图边界。
- **DOC-01**：核验 main，并记录 M1、测试、构建、文档及未完成工作的差异。
- **TRACE-01**：将 action item、具体结果与验证证据写入后续 commit／PR 约定。
