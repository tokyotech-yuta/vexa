# Codex Review — direct-login operator allowlist — 2026-07-14

## メタ情報

| 項目 | 値 |
|---|---|
| 実施日時 | 2026-07-14 (JST) — pre-commit review（未コミット working tree 対象） |
| Thread ID | `019f60e6-a2ca-7230-8cb6-02092e937996` |
| 使用モデル | gpt-5.5 (`~/.codex/config.toml`) |
| 対象 | `clients/terminal/src/app/api/auth/login/route.ts` + `deploy/compose/docker-compose.yml`（DIRECT_LOGIN_EMAILS 追加） |
| スコープ | auth bypass / impersonation surface / Next.js runtime-env 取扱い / cache・cookie |

## Punchlist

- **P0**: なし
- **P1** (1 件): 許可リストは password-less の identity assertion — terminal を LAN/ドメイン公開した場合、listed identity への なりすまし bypass になる。localhost バインドの現構成では許容。→ **fail-closed ガードを提案**
- **P2** (2 件): (a) エラーメッセージが「test accounts only」のままで実態と不一致。(b) 許可リストの正規化・境界ケースのテスト未整備

### Clean 判定の根拠（Codex 所見）

- 非リスト・非 test メールの侵入経路なし（両側 trim+lowercase、空エントリ filter、完全一致）
- plus-addressing / trailing dot / Unicode confusable は完全一致に阻まれる
- `process.env.DIRECT_LOGIN_EMAILS` はサーバールートの request 時読み込み（`force-dynamic`、非 NEXT_PUBLIC）で build-time inlining の落とし穴なし
- NO_STORE ヘッダ・cookie フラグ（httpOnly / sameSite lax / secure 判定）は不変

## 是正状況（全件取込み、同日）

| 指摘 | 対応 | 検証 |
|---|---|---|
| P1 fail-closed ガード | `NEXTAUTH_URL`/`TERMINAL_URL` が非 local の場合は許可リスト無効化、`ALLOW_DIRECT_LOGIN_OVER_NETWORK=1` で明示 opt-in。compose コメントにも文書化 | unit test 2 件 + ライブ確認 |
| P2a メッセージ | 「restricted to test accounts or configured operator emails」へ修正 | 目視 |
| P2b テスト | `login.test.ts` に 8 ケース追加（完全一致 / 正規化 / 空エントリ / plus-addressing / trailing dot / confusable / fail-closed+opt-in / localhost 維持 / test 併存） | **vitest 12/12 pass** |

ライブ検証（再ビルド後）: takagi@（listed）200 / foo@（非リスト）403 / test@ 200。

## Handoff / follow-up

- なし（指摘全消化）。upstream 還元する場合は NEXT_PUBLIC_BOT_NAME と合わせて 1 PR 候補
