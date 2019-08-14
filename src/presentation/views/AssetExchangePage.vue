<template>
  <div class="assetexchangepage">
    <v-flex xs12 sm6 offset-sm3>
      <v-flex style="margin-top: 24px;"> 
        <h1>Create asset</h1>
      </v-flex>
      <v-flex style="margin-top: 8px;">
        <v-card>
          <v-card-actions>
            <v-card-title>
              <h4>Create</h4>
            </v-card-title>
          </v-card-actions>
          <v-form style="margin: 0 26px;">
            <v-text-field
              label="name"
              v-model="assetForm.name"
              placeholder="shohei-ticket"
              required />
            <v-text-field
              label="supply max amount"
              v-model="assetForm.maxAmount"
              type="number"
              required />
          </v-form>
          <v-flex style="padding-bottom: 20px;">
            <v-btn
              color="blue"
              class="white--text"
              @click="onCreateAsset()"
              :loading="isLoading"
              :disabled="isLoading">CREATE</v-btn>
          </v-flex>
        </v-card>
      </v-flex>
    </v-flex>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Inject, Watch, Prop } from 'vue-property-decorator'
import { mapState } from 'vuex'
import { format } from 'date-fns'
import { AssetExchangeUseCase } from '@/domain/usecase/AssetExchangeUseCase'
import { TransactionHistory } from '@/domain/entity/TransactionHistory'
import { AssetCreation } from '@/domain/entity/AssetCreation'
import { AssetForm } from '@/domain/entity/AssetForm'
import { NemHelper } from '@/domain/helper/NemHelper'

@Component({
  name: 'AssetExchangePage',
  computed: mapState(['isLoading']),
	filters: {
		dateFormat(date: Date) {
			return format(date, 'YYYY/MM/DD HH:mm:ss')
    },
	},
})
export default class AssetExchangePage extends Vue {
  @Inject('AssetExchangeUseCase') assetExchangeUseCase!: AssetExchangeUseCase

  // Create asset
  assetForm: { name: string, maxAmount: number, exchangeNemAmount: number } = { name: '', maxAmount: 0, exchangeNemAmount: 0 }

  async onCreateAsset() {
    this.$store.commit('startLoading')
    let message: string = ''
    try {
      const assetName = this.assetForm.name
      const maxAmount = Number(this.assetForm.maxAmount)
      const exchangeAmount = Number(this.assetForm.exchangeNemAmount)
      const asset = new AssetCreation(assetName, maxAmount, exchangeAmount, true, true, 0)
      console.log('onCreateAsset', asset)
      message = await this.assetExchangeUseCase.createAsset(asset)
      this.clearForm()
    } catch (error) {
      console.error('onCreateAsset', error)
      message = error.message
    }
    Vue.prototype.$toast(message)
    this.$store.commit('stopLoading')
  }

  clearForm() {
    this.assetForm = { name: '', maxAmount: 0, exchangeNemAmount: 0 }
  }

}
</script>
<style lang="stylus" scoped>
.assetexchangepage
  word-break break-all

.errorLabel
  color red

.table
  &__list
    margin 0 auto
  &__key
    font-size 16px
    text-align center
    padding 8px
  &__value
    font-size 16px
    text-align right
    padding 8px

.asset--list
  &__value
    text-align left

.v-data-table th
  text-align center
</style>