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

NEM2-SDKを利用してウォレットを作成します。

「送金先アドレス、公開鍵、秘密鍵」の生成は全てSDKが行なっているため、アプリ側からはSDKのAPIを呼ぶだけです。

src/infrastructure/datasource/WalletDataSource.ts の createWallet 関数を実装していきます。

```typescript
const account = Account.generateNewAccount(this.nemNode.network)
```

作成されたウォレット情報が account の中にあるので「送金先アドレス、公開鍵、秘密鍵、ネットワークタイプ」を Walletクラス に入れ直します。


```typescript
const wallet = new Wallet(
  account.address.plain(),
  account.publicKey,
  account.privateKey,
  account.address.networkType.valueOf(),
)
```


ブラウザ上のローカルストレージに保存します。保存形式はJSON形式で保存します。

```typescript
await localForage.setItem(this.localStorageKey, wallet.toJSON())
```


全体の実装は以下の通りです。


```typescript
async createWallet() {
  const account = Account.generateNewAccount(this.nemNode.network)
  const wallet = new Wallet(
    account.address.plain(),
    account.publicKey,
    account.privateKey,
    account.address.networkType.valueOf(),
  )
  await localForage.setItem(this.localStorageKey, wallet.toJSON())
  return wallet
}
```

実装後、yarn serveで立ち上げてください。

ブラウザの検証ツールより、ローカルストレージを確認して nem2-wallet-workshop のkeyに紐づいて JSON形式でウォレットが保存されていれば成功です。

<a href="https://imgur.com/rVSTw4l"><img src="https://i.imgur.com/rVSTw4l.png" width="70%" height="70%" /></a>


保存したウォレットの取得処理を実装します。

src/infrastructure/datasource/WalletDataSource.ts の loadWallet 関数を実装していきます。

ローカルストレージから先ほど保存したウォレットに紐づく key を指定して取得します。

```typescript
const item: any = await localForage.getItem(this.localStorageKey)
```


取得したウォレットはJSONのままですので、Walletクラス に入れ直します。

```typescript
if (item !== null) {
  return new Wallet(
    'address' in item ? item.address : undefined,
    'publicKey' in item ? item.publicKey : undefined,
    'privateKey' in item ? item.privateKey : undefined,
    'networkType' in item ? item.networkType : undefined,
  )
} else {
  return undefined
}
```

全体の実装は以下の通りです。

```typescript
async loadWallet() {
  const item: any = await localForage.getItem(this.localStorageKey)
  if (item !== null) {
    return new Wallet(
      'address' in item ? item.address : undefined,
      'publicKey' in item ? item.publicKey : undefined,
      'privateKey' in item ? item.privateKey : undefined,
      'networkType' in item ? item.networkType : undefined,
    )
  } else {
    return undefined
  }
}
```

HomePage.vue の画面上に送金先アドレス（40文字の英数字）が表示されれば成功です。

## 残高取得

ウォレットの残高取得処理を実装します。

実装する前に、ウォレット作成で作った送金先アドレスへテストネット用のNEMを送りましょう。

以下のFaucet URLにアクセスして、送金先アドレスと送る数量を設定して CLAIM! を選択してください。<br>
（HomePage.vueの画面の上部からFaucetへアクセスすることもできます）

https://ol-catapult-faucet.herokuapp.com/

<a href="https://imgur.com/eUBPpUr"><img src="https://i.imgur.com/eUBPpUr.png" width="60%" height="60%" /></a>


では、残高取得処理を実装します。

src/infrastructure/datasource/WalletDataSource.ts の loadBalance 関数を実装していきます。

残高はブロックチェーンノードをアクセスして取得するため、非同期処理になります。

NEM2-SDKではこの非同期処理を RxJS を利用して結果を返すようにしています。

本ウォレット内では非同期処理を容易に扱うため infrastructure層では RxJS で結果を受け取った後に Promise を使って domain層 へ結果を返すようにします。


mosaicsAmountViewFromAddress を用いて送金先アドレスが保持する全ての 残高 を取得します。

なお、accountHttpにあるgetAccountInfoからも残高を取得することができますが、NEM以外のモザイクの残高は取得できないため、ここではmosaicsAmountViewFromAddressを利用します。


```typescript
const address = Address.createFromRawAddress(addr)
this.mosaicService.mosaicsAmountViewFromAddress(address)
  .pipe(
    combineAll(),
    map((items) => items.map((item) => new AssetMosaic(item.fullName(), item.relativeAmount(), item.mosaicInfo.divisibility, item))),
  ).subscribe(
    (items) => resolve(items),
    (error) => reject(error))
```

mosaicsAmountViewFromAddress はモザイクがそれぞれ独立してストリームへ流れてくるため combineAll を利用して次のストリームへまとめて流すようにします。

map では AssetMosaicクラス へ入れ直した配列を次のストリームへ流し、resolve で Promiseに結果に入れます。

なお、エラーが発生した場合は reject にエラー内容を入れると、利用側の try - catch の例外処理として動いてくれます。

全体の実装は以下の通りです。

```typescript
async loadBalance(addr: string): Promise<AssetMosaic[]> {
  return new Promise((resolve, reject) => {
    const address = Address.createFromRawAddress(addr)
    this.mosaicService.mosaicsAmountViewFromAddress(address)
      .pipe(
        combineAll(),
        map((items) => items.map((item) => new AssetMosaic(item.fullName(), item.relativeAmount(), item.mosaicInfo.divisibility, item))),
      ).subscribe(
        (items) => resolve(items),
        (error) => reject(error))
  })
}
```

実装後、HomePage.vue の画面の　Balance を確認すると 16進数のid と 先ほどFaucetで送った数量が表示されます。

この16進数のid が NEM の namespaceId です。

<a href="https://imgur.com/e4QLoDq"><img src="https://i.imgur.com/e4QLoDq.png" width="50%" height="50%" /></a>

## 送金

送金処理の実装をします。

src/infrastructure/datasource/TransactionDataSource.ts の sendAsset 関数を実装していきます。

送金用のトランザクションを作成します。

TransferTransaction.create を利用します。

「トランザクションの有効期限、送金先のアドレス、送金するモザイクの種類と数量、メッセージ、ネットワークタイプ」を指定して作成します。

```typescript
const recipientAddress = Address.createFromRawAddress(asset.address)
const transferTransaction = TransferTransaction.create(
    Deadline.create(),
    recipientAddress,
    [new Mosaic(new MosaicId(asset.mosaicId), UInt64.fromUint(asset.getRawAmount()))],
    asset.message !== undefined ? PlainMessage.create(asset.message) : PlainMessage.create(''),
    this.nemNode.network)
```

なお、今回はNEMとNEM以外のモザイクも送れるよう 第3引数に Mosaic を指定しています。NEMだけを扱いたい場合は NetworkCurrencyMosaic.createRelative(asset.relativeAmount) を指定すればできます。


トランザクションを作った後、自身の秘密鍵で署名を行います。

```typescript
const account = Account.createFromPrivateKey(privateKey, this.nemNode.network)
const signedTransaction = account.sign(transferTransaction, this.nemNode.networkGenerationHash)
```


ブロックチェーンノードへリクエストします。

```typescript
this.listenerWrapper.loadStatus(account.address.plain(), signedTransaction.hash)
  .then((response) => resolve(response))
  .catch((error) => reject(error))
this.transactionHttp
  .announce(signedTransaction)
  .subscribe(
    (response) => console.log(response),
    (error) => reject(error))
```

リクエストの結果は listenerWrapper 経由で返ってきます。

NEM2では announce 後はリクエストの受け取りの応答が返ってきます。実行処理の結果はウェブソケット（Listener）経由で受け取らなければなりません。

Listener をラップしたクラス ListenerWrapper で受け取り処理を実装しています。

全体の実装は以下の通りです。

```typescript
async sendAsset(privateKey: string, asset: SendAsset): Promise<TransactionResult> {
  return new Promise((resolve, reject) => {
    const recipientAddress = Address.createFromRawAddress(asset.address)
    const transferTransaction = TransferTransaction.create(
        Deadline.create(),
        recipientAddress,
        [new Mosaic(new MosaicId(asset.mosaicId), UInt64.fromUint(asset.getRawAmount()))],
        asset.message !== undefined ? PlainMessage.create(asset.message) : PlainMessage.create(''),
        this.nemNode.network)
    const account = Account.createFromPrivateKey(privateKey, this.nemNode.network)
    const signedTransaction = account.sign(transferTransaction, this.nemNode.networkGenerationHash)

    this.listenerWrapper.loadStatus(account.address.plain(), signedTransaction.hash)
      .then((response) => resolve(response))
      .catch((error) => reject(error))
    this.transactionHttp
      .announce(signedTransaction)
      .subscribe(
        (response) => console.log(response),
        (error) => reject(error))
  })
}
```

送金処理の動作確認のため、試しに以下のウォレットへNEMを送金してみてください。

```
SAD5BN2GHYNLK2DIABNJHUTJXGYCVBOXOJX7DQFF
```

送金後、以下のような画面になると成功です。ResultにはトランザクションIDが表示されます。Balanceの右側の更新アイコンを押下すると最新の残高が画面上に反映されます。

<a href="https://imgur.com/GIDdaOV"><img src="https://i.imgur.com/GIDdaOV.png" width="50%" height="50%" /></a>

## トランザクション履歴取得

送金履歴の取得処理を実装します。

src/infrastructure/datasource/TransactionDataSource.ts の transactionHistoryAll 関数を実装していきます。

トランザクション履歴の取得は accountHttp の transactions で取得できますが、送金履歴だけを取得するとなると一手間かけなければいけません。

また、取得したトランザクションのタイムスタンプやモザイクの可分性を同時に取得しないといけないため、実装がやや複雑になります。

それらの処理はすべて RxJS の pipe の中で実装していきます。

```typescript
let lastTransactionId: string
let transactions: TransferTransaction[] = []
const publicAccount = PublicAccount.createFromPublicKey(publicKey, this.nemNode.network)
this.accountHttp.transactions(publicAccount, new QueryParams(limit, id, Order.DESC))
  .pipe(
    // これ以降の処理を実装していく...
```

まずは、取得したトランザクション履歴が空の場合の処理を行います。空の場合は TransactionHistoryInfo に undefined を指定して返します。

```typescript
map((items) => {
  if (items.length === 0) {
    resolve(new TransactionHistoryInfo(undefined))
  }
  return items
}),
```


取得したトランザクションを TransferTransaction のみにフィルタリングして、TransferTransactionの場合は TransferTransaction にキャスト変換します。

さらに、キャスト変換した TransferTransaction の transactionInfo が TransactionInfo のみにフィルタリングして transactions へ入れて、ストリームへ流します。

transactions は 後に配列要素の最後のトランザクションIDを取得するために使用します。

```typescript
mergeMap((items) => transactions = items.filter((item) => item instanceof TransferTransaction)
  .map((item) => item as TransferTransaction)
  .filter((item) => item.transactionInfo !== undefined && item.transactionInfo instanceof TransactionInfo)),
```

それぞれのトランザクション履歴から タイムスタンプとモザイクの可分性を取得します。

zip を用いて並列リクエストを行います。

第1引数は今までストリームから流れてきたトランザクション履歴、第2引数はトランザクションIDのブロック取得API、第3引数はモザイク情報を取得APIです。

（なお、今回はトランザクション履歴には１つのモザイクのみを扱う前提で実装しています。複数のモザイクが入ったトランザクション履歴がある場合は期待通りに動作しませんので予めご了承ください）

```typescript
mergeMap((item) => {
  return zip(
    of(item),
    this.blockHttp.getBlockByHeight(item!.transactionInfo!.height.compact()),
    item!.mosaics[0].id instanceof MosaicId ?
      this.mosaicHttp.getMosaic(new MosaicId(item!.mosaics[0].id.toHex())).pipe(
        map((mosaic) => mosaic.divisibility),
        catchError((error) => of(0)), // Errorの場合は0を返すようにする
      ) : of(6), // NEMの場合はnamespaceIdしかとれないのでof(6)を返すようにする
  )
}),
```

必要な情報が揃ったので TransactionHistoryクラス に入れ直します。

combineAll で全てのトランザクション履歴が入るまで待ちます。

```typescript
map(([tx, block, divisibility]) =>
  of(new TransactionHistory(
    tx.transactionInfo!.id,
    tx.mosaics.length !== 0 ? tx.mosaics[0].amount.compact() / Math.pow(10, divisibility) : 0,
    tx.maxFee.compact(),
    tx.recipient instanceof Address ? tx.recipient.plain() : '',
    tx.signer !== undefined ? tx.signer!.address.plain() : '',
    tx.message.payload,
    tx !== undefined ? new Date(block.timestamp.compact() + Date.UTC(2016, 3, 1, 0, 0, 0, 0)) : undefined,
    tx.transactionInfo!.hash,
    tx,
  )),
),
combineAll(),
```


最後に後処理です。

ページング処理ができるよう最後のトランザクションIDと、先ほど入れ直した TransactionHistory を降順にソートしたものを TransactionHistoryInfo に入れます。

```typescript
map((items) => {
  lastTransactionId = transactions.slice(-1)[0].transactionInfo!.id
  return new TransactionHistoryInfo(lastTransactionId, items.sort((a, b) => {
    const aTime = a.date!.getTime()
    const bTime = b.date!.getTime()
    if (aTime > bTime) { return -1 }
    if (aTime < bTime) { return 1 }
    return 0
  }))
}),
```

全体の実装は以下の通りです。


```typescript
async transactionHistoryAll(publicKey: string, limit: number, id?: string): Promise<TransactionHistoryInfo> {
  return new Promise((resolve, reject) => {
    let lastTransactionId: string
    let transactions: TransferTransaction[] = []
    const publicAccount = PublicAccount.createFromPublicKey(publicKey, this.nemNode.network)
    this.accountHttp.transactions(publicAccount, new QueryParams(limit, id, Order.DESC))
      .pipe(
        map((items) => {
          if (items.length === 0) {
            resolve(new TransactionHistoryInfo(undefined))
          }
          return items
        }),
        mergeMap((items) => transactions = items.filter((item) => item instanceof TransferTransaction)
          .map((item) => item as TransferTransaction)
          .filter((item) => item.transactionInfo !== undefined && item.transactionInfo instanceof TransactionInfo)),
        mergeMap((item) => {
          return zip(
            of(item),
            this.blockHttp.getBlockByHeight(item!.transactionInfo!.height.compact()),
            item!.mosaics[0].id instanceof MosaicId ?
              this.mosaicHttp.getMosaic(new MosaicId(item!.mosaics[0].id.toHex())).pipe(
                map((mosaic) => mosaic.divisibility),
                catchError((error) => of(0)), // Errorの場合は0を返すようにする
              ) : of(6), // NEMの場合はnamespaceIdしかとれないのでof(6)を返すようにする
          )
        }),
        map(([tx, block, divisibility]) =>
          of(new TransactionHistory(
            tx.transactionInfo!.id,
            tx.mosaics.length !== 0 ? tx.mosaics[0].amount.compact() / Math.pow(10, divisibility) : 0,
            tx.maxFee.compact(),
            tx.recipient instanceof Address ? tx.recipient.plain() : '',
            tx.signer !== undefined ? tx.signer!.address.plain() : '',
            tx.message.payload,
            tx !== undefined ? new Date(block.timestamp.compact() + Date.UTC(2016, 3, 1, 0, 0, 0, 0)) : undefined,
            tx.transactionInfo!.hash,
            tx,
          )),
        ),
        combineAll(),
        map((items) => {
          lastTransactionId = transactions.slice(-1)[0].transactionInfo!.id
          return new TransactionHistoryInfo(lastTransactionId, items.sort((a, b) => {
            const aTime = a.date!.getTime()
            const bTime = b.date!.getTime()
            if (aTime > bTime) { return -1 }
            if (aTime < bTime) { return 1 }
            return 0
          }))
        }),
      ).subscribe(
        (response) => resolve(response),
        (error) => reject(error))
  })
}
```

HomePage.vue の画面からトランザクション履歴の一覧が表示されると成功です。

<a href="https://imgur.com/6RpE6L6"><img src="https://i.imgur.com/6RpE6L6.png" width="50%" height="50%" /></a>


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