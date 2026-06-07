# ハムスター体重管理

## Overview
ハムスターの微量な体重変化を記録・可視化することで、飼い主がペットの体調の変化にいち早く気づけるようにする。

## Target User
ハムスターを大切に飼育している個人。

## Problem Statement
ハムスターは捕食される側の動物であるため、体調不良を隠す習性がある。体重の減少は病気の重要なサインであるが、日々のわずかな変化は目視では気づきにくい。

## MVP
最小限の入力で体重を記録し、その推移を視覚的に確認できる機能。

### Feature List
- 体重記録機能（日付とグラム数）
- 体重推移グラフ表示
- 個体プロフィール登録（名前のみ）

## Screens

### Home
- 最新の体重表示
- 今日の体重入力フォーム
- 過去数日間の簡易リスト

### Graph
- 期間を指定した体重推移グラフ（折れ線グラフ）

### Settings
- ハムスターの名前変更・削除

## Data Model

### Hamster
- id: string
- name: string

### WeightRecord
- id: string
- hamsterId: string
- weight: number (float)
- date: string (ISO8601)

## API

### GET /api/hamsters
個体一覧の取得

### POST /api/hamsters
個体の登録

### GET /api/weights/:hamsterId
特定個体の体重履歴取得

### POST /api/weights
体重の新規記録

## Non Functional Requirements

### Security
- ユーザーデータはローカルストレージ、またはシンプルなユーザー認証で保護。

### Performance
- グラフ表示時のデータ読み込みと描画の低遅延。

## Future Features
- 急激な体重減少（例：3日連続減少、または前週比10%減）時のアラート通知
- 給餌内容（ペレットの種類、量）のメモ機能
- 複数個体の同時管理・比較
- 通院記録のメモ

## Monetization
- 画面下部への広告表示
- 有料版での広告非表示・データ書き出し機能（CSV）
