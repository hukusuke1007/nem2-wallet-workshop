import { TransactionRepository } from '@/domain/repository/TransactionRepository'
import { WalletRepository } from '@/domain/repository/WalletRepository'
import { AggregateTransactionRepository } from '@/domain/repository/AggregateTransactionRepository'
import { MosaicRepository } from '@/domain/repository/MosaicRepository'
import { NamespaceRepository } from '@/domain/repository/NamespaceRepository'
import { AssetCreation } from '@/domain/entity/AssetCreation'
import { AggregateEscrowDTO } from '@/domain/entity/AggregateEscrowDTO'
import { AggregateConsig } from '@/domain/entity/AggregateConsig'
import { AggregateConsigInfo } from '@/domain/entity/AggregateConsigInfo'
import { AssetForm } from '@/domain/entity/AssetForm'

export interface AssetExchangeUseCase {
  createAsset(asset: AssetCreation): Promise<string>
  exchangeAsset(exchangeNemAmount: number, distributorPublicKey: string, distributeAmount: number, distributeAssetId: string): Promise<string>
  approvalConsigAggregate(dto: AggregateConsig): Promise<string>
  approvalConsigAggregateAll(): Promise<string>
  loadAggregateBondedTransactions(limit: number, id?: string): Promise<AggregateConsigInfo>
}

export class AssetExchangeUseCaseImpl implements AssetExchangeUseCase {
  private transactionRepository: TransactionRepository
  private walletRepository: WalletRepository
  private aggregateRepository: AggregateTransactionRepository
  private mosaicRepository: MosaicRepository
  private namespaceRepository: NamespaceRepository

  constructor(transactionRepository: TransactionRepository, walletRepository: WalletRepository, aggregateRepository: AggregateTransactionRepository, mosaicRepository: MosaicRepository, namespaceRepository: NamespaceRepository) {
    this.transactionRepository = transactionRepository
    this.walletRepository = walletRepository
    this.aggregateRepository = aggregateRepository
    this.mosaicRepository = mosaicRepository
    this.namespaceRepository = namespaceRepository
  }

  async createAsset(asset: AssetCreation) {
    let message: string = ''
    try {
      // TODO: モザイク、ネームスペース作成（アグリゲートトランザクション）
    } catch (error) {
      throw error
    }
    return message
  }


  async exchangeAsset(exchangeNemAmount: number, distributorPublicKey: string, distributeAmount: number, distributeAssetId: string) {
    let message: string
    try {
      const wallet = await this.walletRepository.loadWallet()
      const privateKey = wallet!.privateKey!
      const mosaicInfo = await this.mosaicRepository.loadMosaicInfo(distributeAssetId)
      const distributeRawAmount = distributeAmount * Math.pow(10, mosaicInfo.divisibility)
      const dto = new AggregateEscrowDTO(privateKey, exchangeNemAmount, distributorPublicKey, distributeRawAmount, distributeAssetId)
      const result = await this.aggregateRepository.requestAggregateEscrowAsset(dto)
      message = `SUCCESS: ${result.hash}`
      console.log('aggregateEscrowAsset', message)
    } catch (error) {
      throw error
    }
    return message
  }

  async approvalConsigAggregate(dto: AggregateConsig) {
    let message: string
    try {
      const wallet = await this.walletRepository.loadWallet()
      const privateKey = wallet!.privateKey!
      const result = await this.aggregateRepository.approvalConsigAggregate(privateKey, dto)
      message = `SUCCESS: ${result.hash}`
      console.log('consigAggregate', message)
    } catch (error) {
      throw error
    }
    return message
  }

  async approvalConsigAggregateAll() {
    let message: string
    try {
      const wallet = await this.walletRepository.loadWallet()
      const privateKey = wallet!.privateKey!
      const result = await this.aggregateRepository.approvalConsigAggregateAll(privateKey)
      message = `SUCCESS: ${result.hash}`
      console.log('consigAggregate', message)
    } catch (error) {
      throw error
    }
    return message
  }

  async loadAggregateBondedTransactions(limit: number, id?: string) {
    let result: AggregateConsigInfo
    try {
      const wallet = await this.walletRepository.loadWallet()
      const privateKey = wallet!.privateKey!
      result = await this.aggregateRepository.aggregateBondedTransactions(privateKey, limit, id)
      console.log('loadAggregateBondedTransactions', result)
    } catch (error) {
      throw error
    }
    return result
  }

}
