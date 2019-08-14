import { MosaicHttp, Account, Deadline, UInt64,
  MosaicId, MosaicNonce, MosaicDefinitionTransaction, MosaicSupplyChangeTransaction, MosaicProperties, MosaicSupplyType } from 'nem2-sdk'
// import { mergeMap, map, combineAll, filter } from 'rxjs/operators'
import { MosaicRepository } from '@/domain/repository/MosaicRepository'
import { MosaicEntity } from '@/domain/entity/MosaicEntity'
import { NemNode } from '@/domain/configure/NemNode'
import { ListenerWrapper } from '@/infrastructure/wrapper/ListenerWrapper'
import { AssetCreation } from '@/domain/entity/AssetCreation'
import { MosaicAggregate } from '@/domain/entity/MosaicAggregate'
import { map } from 'rxjs/operators';

type MosaicDefinitionTransactionInfo = {
  mosaicId: string,
  transaction: MosaicDefinitionTransaction,
}

export class MosaicDataSource implements MosaicRepository {
  nemNode: NemNode
  listenerWrapper: ListenerWrapper
  private mosaicHttp: MosaicHttp

  constructor(nemNode: NemNode) {
    this.nemNode = nemNode
    // this.accountHttp = new AccountHttp(nemNode.endpoint)
    this.mosaicHttp = new MosaicHttp(nemNode.endpoint)
    this.listenerWrapper = new ListenerWrapper(nemNode.wsEndpoint)
  }

  async loadMosaicInfo(id: string): Promise<MosaicEntity>  {
    return new Promise((resolve, reject) => {
      this.mosaicHttp.getMosaic(new MosaicId(id))
      .pipe(
        map((item) => new MosaicEntity(
          id,
          item.owner.address.plain(),
          item.owner.publicKey,
          item.divisibility,
        )),
      ).subscribe(
        (response) => resolve(response),
        (error) => reject(error))
    })
  }

  createMosaicDefinitionTxAggregate(privateKey: string, asset: AssetCreation): MosaicAggregate {
    const account = Account.createFromPrivateKey(privateKey, this.nemNode.network)
    // TODO: モザイク、ネームスペース作成（アグリゲートトランザクション
    // return new MosaicAggregate('', undefined)

    // commentout
    const nonce = MosaicNonce.createRandom()
    const mosaicId = MosaicId.createFromNonce(nonce, account.publicAccount)
    const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
        Deadline.create(),
        nonce,
        mosaicId,
        MosaicProperties.create({
          supplyMutable: asset.supplyMutable,
          transferable: asset.transferable,
          divisibility: asset.divisibility,
          duration: asset.durationCount !== undefined ? UInt64.fromUint(asset.durationCount) : undefined }),
        this.nemNode.network)
    const txInfo = { mosaicId: mosaicId.toHex(), transaction: mosaicDefinitionTransaction }
    return new MosaicAggregate(txInfo.mosaicId, txInfo.transaction.toAggregate(account.publicAccount))
  }

  createMosaicSupplyChangeTxAggregate(privateKey: string, mosaicId: string, maxAmount: number): any {
    const account = Account.createFromPrivateKey(privateKey, this.nemNode.network)
    // TODO: モザイク、ネームスペース作成（アグリゲートトランザクション

    // commentout
    const mosaicSupplyChangeTransaction = MosaicSupplyChangeTransaction.create(
      Deadline.create(),
      new MosaicId(mosaicId),
      MosaicSupplyType.Increase,
      UInt64.fromUint(maxAmount),
      this.nemNode.network)
    return mosaicSupplyChangeTransaction.toAggregate(account.publicAccount)
  }
}
