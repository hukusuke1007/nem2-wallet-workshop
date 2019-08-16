import { AccountHttp, MosaicHttp, MosaicService, Account, Address, MosaicId } from 'nem2-sdk'
import localForage from 'localforage'
import { mergeMap, map, combineAll } from 'rxjs/operators'
import { WalletRepository } from '@/domain/repository/WalletRepository'
import { Wallet } from '@/domain/entity/Wallet'
import { AssetMosaic } from '@/domain/entity/AssetMosaic'
import { NemNode } from '@/domain/configure/NemNode'
import { combineLatest } from 'rxjs';

export class WalletDataSource implements WalletRepository {
  nemNode: NemNode
  private accountHttp: AccountHttp
  private mosaicHttp: MosaicHttp
  private mosaicService: MosaicService
  private localStorageKey: string

  constructor(nemNode: NemNode) {
    this.nemNode = nemNode
    this.accountHttp = new AccountHttp(nemNode.endpoint)
    this.mosaicHttp = new MosaicHttp(nemNode.endpoint)
    this.mosaicService = new MosaicService(this.accountHttp, this.mosaicHttp)
    this.localStorageKey = 'nem2-wallet-workshop'
  }

  async createWallet() {
    // TODO: ウォレット作成
    return new Wallet()
  }

  async loadWallet() {
    // TODO: ウォレット作成
    return undefined
  }

  async loadAccount(addr: string): Promise<any> {
    const address = Address.createFromRawAddress(addr)
    return new Promise((resolve, reject) => {
      this.accountHttp.getAccountInfo(address)
        .subscribe(
          (accountInfo) => {
            accountInfo.mosaics.forEach((item) => {
              console.log('mosaic', item.id.toHex(), item.amount.compact())
            })
            resolve(accountInfo)
          },
          (error) => reject(error))
    })
  }

  async loadBalance(addr: string): Promise<AssetMosaic[]> {
    return new Promise((resolve, reject) => {
      // TODO: 残高取得
      resolve([])
    })
  }

  async loadBalanceAndNamespace(addr: string) {
    return new Promise((resolve, reject) => {
      const address = Address.createFromRawAddress(addr)
      this.mosaicService.mosaicsAmountViewFromAddress(address)
        .pipe(
          combineAll(),
          map((items) => {
            const mosaicIds = items.map((item) => item.mosaicInfo.mosaicId)
            console.log('mosaicIds', mosaicIds)
            return this.mosaicHttp.getMosaicsNames(mosaicIds)
          }),
          mergeMap((_) => _),
        ).subscribe(
          (items) =>  {
            console.log(items)
            resolve(items)
          }, (error) => console.error(error))
    })
  }
}
