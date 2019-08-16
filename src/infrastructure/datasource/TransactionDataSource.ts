import { AccountHttp, TransactionHttp, BlockHttp, Account, Address,
  TransferTransaction, Deadline, Mosaic, MosaicId, NetworkCurrencyMosaic, PlainMessage,
  PublicAccount, QueryParams, TransactionInfo, Order, UInt64, MosaicHttp, MosaicInfo, NamespaceHttp, NamespaceId } from 'nem2-sdk'
import { TransactionRepository } from '@/domain/repository/TransactionRepository'
import { of, zip } from 'rxjs'
import { mergeMap, map, combineAll, filter, zipAll, catchError } from 'rxjs/operators'
import { ListenerWrapper } from '@/infrastructure/wrapper/ListenerWrapper'
import { TransactionHistory } from '@/domain/entity/TransactionHistory'
import { TransactionHistoryInfo } from '@/domain/entity/TransactionHistoryInfo'
import { NemNode } from '@/domain/configure/NemNode'
import { NemHelper } from '@/domain/helper/NemHelper'
import { TransactionResult } from '@/domain/entity/TransactionResult'
import { SendAsset } from '@/domain/entity/SendAsset'

export class TransactionDataSource implements TransactionRepository {
  nemNode: NemNode
  listenerWrapper: ListenerWrapper
  private accountHttp: AccountHttp
  private transactionHttp: TransactionHttp
  private blockHttp: BlockHttp
  private mosaicHttp: MosaicHttp

  constructor(nemNode: NemNode) {
    this.nemNode = nemNode
    this.accountHttp = new AccountHttp(nemNode.endpoint)
    this.transactionHttp = new TransactionHttp(nemNode.endpoint)
    this.blockHttp = new BlockHttp(nemNode.endpoint)
    this.listenerWrapper = new ListenerWrapper(nemNode.wsEndpoint)
    this.mosaicHttp = new MosaicHttp(nemNode.endpoint)
  }

  async sendAsset(privateKey: string, asset: SendAsset): Promise<TransactionResult> {
    return new Promise((resolve, reject) => {
      // TODO: 送金
      resolve(undefined)
    })
  }

  async transactionHistory(id: string): Promise<TransactionHistory> {
    return new Promise((resolve, reject) => {
      let transaction: TransferTransaction
      this.transactionHttp.getTransaction(id)
      .pipe(
        map((item) => {
          console.log('transactionHistory', item)
          return item
        }),
        filter((item) => item instanceof TransferTransaction),
        map((item) => {
          transaction = item as TransferTransaction
          return transaction
        }),
        map((item) => this.blockHttp.getBlockByHeight(item.transactionInfo!.height.compact())),
        mergeMap((_) => _),
        map((block) => new TransactionHistory(
          transaction.transactionInfo!.id,
          transaction.mosaics.length !== 0 ? transaction.mosaics[0].amount.compact() / NemHelper.divisibility() : 0,  // ココ暫定. 後回し.
          transaction.maxFee.compact(),
          transaction.recipient instanceof Address ? transaction.recipient.plain() : '',
          transaction.signer !== undefined ? transaction.signer!.address.plain() : '',
          transaction.message.payload,
          block !== undefined ? new Date(block.timestamp.compact() + Date.UTC(2016, 3, 1, 0, 0, 0, 0)) : undefined,
          transaction.transactionInfo!.hash,
          transaction)),
      ).subscribe(
        (response) => resolve(response),
        (error) => reject(error))
      })
  }

  async transactionHistoryAll(publicKey: string, limit: number, id?: string): Promise<TransactionHistoryInfo> {
    return new Promise((resolve, reject) => {
      // TODO: トランザクション履歴取得
      resolve(undefined)
    })
  }

  // TODO
  async unconfirmedTransactions(publicKey: string, limit: number, id?: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const publicAccount = PublicAccount.createFromPublicKey(publicKey, this.nemNode.network)
      this.accountHttp.unconfirmedTransactions(publicAccount, new QueryParams(limit, id, Order.DESC))
      .pipe(
        map((items) => {
          console.log('unconfirmedTransactions', items)
          return items
        }),
      ).subscribe(
        (response) => resolve(response),
        (error) => reject(error))
      })
  }
}
