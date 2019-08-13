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
本ウォレットは0から作り始まるのではなく、予め用意しているリポジトリを利用し、不足部のコードを実装して作り上げていきます。

まずは、利用する gitリポジトリ を clone します。

```bash
git clone https://github.com/hukusuke1007/nem2-wallet-workshop.git
```

clone すると nem2-wallet-workshop のディレクトリができているので移動します。

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

<a href="https://imgur.com/ZvJRTQb"><img src="https://i.imgur.com/ZvJRTQb.png" width="50%" height="50%" /></a>

ディレクトリ構成は以下の通りです。

```bash
├── README.md
├── src
│   ├── App.vue
│   ├── assets
│   │   └── logo.png
│   ├── domain
│   │   ├── configure
│   │   │   └── NemNode.ts
│   │   ├── entity
│   │   │   ├── AggregateConsig.ts
│   │   │   ├── AggregateConsigInfo.ts
│   │   │   ├── AggregateEscrowDTO.ts
│   │   │   ├── AssetCreation.ts
│   │   │   ├── AssetForm.ts
│   │   │   ├── AssetMosaic.ts
│   │   │   ├── MosaicAggregate.ts
│   │   │   ├── MosaicDTO.ts
│   │   │   ├── MosaicEntity.ts
│   │   │   ├── NamespaceEntity.ts
│   │   │   ├── SendAsset.ts
│   │   │   ├── TransactionError.ts
│   │   │   ├── TransactionHistory.ts
│   │   │   ├── TransactionHistoryInfo.ts
│   │   │   ├── TransactionResult.ts
│   │   │   └── Wallet.ts
│   │   ├── helper
│   │   │   └── NemHelper.ts
│   │   ├── repository
│   │   │   ├── AggregateTransactionRepository.ts
│   │   │   ├── MosaicRepository.ts
│   │   │   ├── NamespaceRepository.ts
│   │   │   ├── TransactionRepository.ts
│   │   │   └── WalletRepository.ts
│   │   └── usecase
│   │       ├── AssetExchangeUseCase.ts
│   │       ├── LoadBalanceUseCase.ts
│   │       ├── LoadTransactionHistoryUseCase.ts
│   │       ├── LoadWalletUseCase.ts
│   │       └── SendCoinUseCase.ts
│   ├── infrastructure
│   │   ├── datasource
│   │   │   ├── AggregateTransactionDataSource.ts
│   │   │   ├── MosaicDataSource.ts
│   │   │   ├── NamespaceDataSource.ts
│   │   │   ├── TransactionDataSource.ts
│   │   │   └── WalletDataSource.ts
│   │   └── wrapper
│   │       └── ListenerWrapper.ts
│   ├── main.ts
│   ├── presentation
│   │   └── views
│   │       ├── AssetExchangePage.vue
│   │       ├── HomePage.vue
│   │       └── TransactionPage.vue
│   ├── provide.ts
│   ├── registerServiceWorker.ts
│   ├── router.ts
│   ├── shims-tsx.d.ts
│   ├── shims-vue.d.ts
│   └── store.ts
├── tsconfig.json
├── tslint.json
├── vue.config.js
└── yarn.lock
```


### 設計指針

本ウォレットは クリーンアーキテクチャ を採用しています。

presentation層、domain層、infrastructure層に役割を分けて実装しています。

各層の役割は以下の通りです。


| 層 | 役割 |
|:---|:---|
|presentation | UI/UX部の実装とそれらに依存するロジックを実装します。<br> フォームやボタンの表示や押下イベントをトリガーにdomain層へリクエストします。 |
|domain | 各機能のロジックを実装します。<br> domain層はインターフェース（repository）を経由してinfrastructure層へリクエストします。|
|infrastructure | 外部とのやりとりするロジックを実装します。 |


各層の関係性を示すために、例として HomePage.vue 上にNEM2-SDKライブラリ経由でウォレットの残高を取得する設計図を示します。

<a href="https://imgur.com/XcgNmje"><img src="https://i.imgur.com/XcgNmje.png" width="70%" height="70%" /></a>

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

.env で設定しています。

```bash
# Network
#  MAIN_NET = 104
#  TEST_NET = 152
#  MIJIN = 96
#  MIJIN_TEST = 144
NETWORK = 144

# Node URL
NODE_HOST = 'https://catapult-test.opening-line.jp'
NODE_WS = 'wss://catapult-test.opening-line.jp'
NODE_PORT = '3001'

# Generation hash
# ex. http://elephant.48gh23s.xyz:3000/block/1 is meta.generationHash
NETWORK_GENERATION_HASH = '453052FDC4EB23BF0D7280C103F7797133A633B68A81986165B76FCE248AB235'

# Faucet. It cloud get a xem of catapult.
FAUCET_URL = 'https://ol-catapult-faucet.herokuapp.com/'

# Blockchain explorer.
EXPLORER_URL = 'http://catapult-test.opening-line.jp:8000'
```

本ウォレットはテストネットを利用しています。

今後、メインネットが稼働しましたら .env の設定を変更するだけで、容易にメインネットへの切り替えができます。

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