# NEM2 wallet

## 概要

初めまして、shoheiです。

iOS/Android/Webアプリ開発をしているフリーランスエンジニアです。また、ブロックチェーンを用いたプロダクト開発も行っております。


今回はVue.js + TypeScript + NEM2-SDKを用いてWebウォレットを作成します。

予め用意している gitリポジトリ を clone してウォレット機能を実装していきます。

最後に静的ホスティングサービスの Github Pages を利用して、Web上にNEM2ウォレットアプリを公開します。


なお、本解説は macOS 環境下を前提に解説しています。

## 事前準備

事前にnode.js、yarn、vue-cliのインストールをしてください。

・Node.js公式サイト<br>
[https://nodejs.org/ja/](https://nodejs.org/ja/)


### Vue cliの導入
```bash
npm install -g @vue/cli
```

### yarnの導入
```bash
npm install -g yarn
```

バージョンが表示されればインストール成功です。

```bash
node --version
v10.15.1vue

npm --version
6.4.1

vue --version
3.4.0

yarn --version
1.16.0
```

動作確認は Google Chrome を利用します。


## 目次

- はじめに
- ウォレット作成
- 残高取得
- 送金
- トランザクション履歴取得
- モザイク、ネームスペース作成（アグリゲートトランザクション）
- モザイク送信

## はじめに
今回利用するgitリポジトリをcloneします。

```bash
git clone https://github.com/hukusuke1007/nem2-wallet-workshop.git
```

cloneすると nem2-wallet-workshop のディレクトリができているので移動します。

```bash
cd nem2-wallet-workshop
```

移動後、yarnコマンドを使って依存ライブラリをインストールします。

```bash
yarn
```

実行します。

```bash
yarn serve
```

ブラウザで http://localhost:8080/ へアクセスし、以下の画面が表示できれば準備完了です。

<a href="https://imgur.com/ZvJRTQb"><img src="https://i.imgur.com/ZvJRTQb.png" width="60%" height="60%" /></a>

### 設計指針

本ウォレットの設計は クリーンアーキテクチャ を採用しています。

presentation層、domain層、infrastructure層に役割を分けて実装しています。

各層の役割は以下の通りです。


| 層 | 役割 |
|:---|:---|
|presentation | UI/UX部の実装とそれらに依存するロジックを実装します。<br> フォームやボタンの表示や押下イベントをトリガーにdomain層へリクエストします。 |
|domain | 各機能のロジックを実装します。<br> domain層はインターフェース（repository）を経由してinfrastructure層へリクエストします。|
|infrastructure | 外部とのやりとりするロジックを実装します。 |




（クリーンアーキテクチャの詳しい説明については割愛します）


NEM2-SDK や ローカルストレージなどの外部との直接やりとりは、**infrastructure層**で行います。


実装部は provide.ts 上で依存注入（DI）しています。

src/provide.ts 

```typescript
const host = process.env.NODE_HOST
const ws = process.env.NODE_WS
const port = process.env.NODE_PORT
const network: number = Number(process.env.NETWORK)
const generateHash = process.env.NETWORK_GENERATION_HASH
const nemNode = new NemNode(host, ws, port, network, generateHash)

const walletDataSource = new WalletDataSource(nemNode)
const transactionDataSource = new TransactionDataSource(nemNode)
const aggregateTransactionDataSource = new AggregateTransactionDataSource(nemNode)
const mosaicDataSource = new MosaicDataSource(nemNode)
const namespaceDataSource = new NamespaceDataSource(nemNode)

export const provide = {
  LoadBalanceUseCase: new LoadBalanceUseCaseImpl(walletDataSource, namespaceDataSource),
  LoadWalletUseCase: new LoadWalletUseCaseImpl(walletDataSource),
  SendCoinUseCase: new SendCoinUseCaseImpl(transactionDataSource, walletDataSource),
  LoadTransactionHistoryUseCase: new LoadTransactionHistoryUseCaseImpl(transactionDataSource, walletDataSource),
  AssetExchangeUseCase: new AssetExchangeUseCaseImpl(transactionDataSource, walletDataSource, aggregateTransactionDataSource, mosaicDataSource, namespaceDataSource),
}
```


### ブロックチェーンノードの設定

### 進め方

## ウォレット作成

## 残高取得

## 送金

## トランザクション履歴取得

## モザイク、ネームスペース作成（アグリゲートトランザクション）

## モザイク送信


## 著者
**shohei（中川祥平）**

2013年からエンジニアとして京セラ株式会社のグループ会社へ入社し、組み込みソフトウェア開発、ディレクションに従事。在籍中、趣味でiOS/Androidアプリの開発を行い、個人アプリを数本リリース。その後、Web系ベンチャーへ転職。

2017年末にブロックチェーン技術に出会い、世の中を変えれる技術だと確信し、ブロックチェーントークンを使った健康促進アプリ「FiFiC」の開発、 現在はフリーランスエンジニアとして活動し、主にiOS/Android、Web、ブロックチェーンを使ったアプリの開発を行っている。

同時に「未経験から自走できるエンジニアとして成長できるコミュニティ」をコンセプトに開発コミュニティ「もくdev」 を発足。関東・関西合わせて500人以上の規模のコミュニティを運営。

Twitter	https://twitter.com/hobbydevelop<br>
もくdev 大阪 https://mokudev.connpass.com/<br>
もくdev 東京  https://mokudev-tokyo.connpass.com/<br>

## 備考
・NEM2-SDK<br>
[https://nemtech.github.io/ja/index.html](https://nemtech.github.io/ja/index.html)

・Vue.js公式サイト<br>
[https://jp.vuejs.org/index.html](https://jp.vuejs.org/index.html)

・Node.js公式サイト<br>
[https://nodejs.org/ja/)](https://nodejs.org/ja/)