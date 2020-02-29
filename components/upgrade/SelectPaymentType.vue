<template>
  <div class="c-select-payment-type">
    <div class="b-main-wrap" v-key-escape="hide" @click="hide">
      <div class="b-main" @click.stop="()=>{}" v-if="tariff.sname === 'free'">
        <div class="b-confirm">
          <div class="b-copy">{{$t('tariffs.confirm_changing_tariff_to_free')}}</div>
          <btn :text="$t('tariffs.confirm')" :isSubmit="false" :loading="sending" @click="downgrade()"></btn>
        </div>
      </div>

      <div class="b-main" @click.stop="()=>{}" v-else>
        <div class="b-periods">
          <div class="b-period" v-if="tariff.periods[1]">
            <input type="radio" id="months-1" value="1" v-model="months">
            <label for="months-1">${{tariff.periods[1].toFixed(2)}} {{$t('tariffs.monthly')}}</label>
          </div>

          <div class="b-period" v-if="tariff.periods[12]">
            <input  type="radio" id="months-12" value="12" v-model="months">
            <label for="months-12">${{tariff.periods[12].toFixed(2)}} {{$t('tariffs.annually')}}</label>
          </div>
        </div>

        <div class="b-buttons">
          <btn iconClass="bu bu-paypal" text="Paypal" :isSubmit="false" :loading="sending && payWith === 'paypal'" @click="submit('paypal')"></btn>

          <btn iconClass="bu bu-credit-card" text="Card" :isSubmit="false" :loading="sending && payWith === 'commercegate'" @click="submit('commercegate')"></btn>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
  import { getErrorFromResponse } from '~/utils/helpers'
  import Btn from '~/components/Btn'
  import { mapGetters } from 'vuex'

  export default {
    name: 'select-payment-type',
    components: {
      Btn
    },
    props: ['tariff'],
    data () {
      return {
        months: 1,
        sending: false,
        payWith: null
      }
    },
    computed: {
      ...mapGetters({
        createUrl: 'company/createUrl',
        createAbsoluteUrl: 'company/createAbsoluteUrl'
      })
    },
    methods: {
      hide () {
        this.$emit('hide')
      },
      downgrade () {
        if (this.sending) {
          return true
        }
        this.sending = true
        return this.$api.post('payment/downgrade')
          .then(res => {
            window.location.reload(true)
          })
          .catch(err => {
            alert(getErrorFromResponse(err))
            this.sending = false
          })
      },
      submit (payWith) {
        if (this.sending) {
          return true
        }
        this.payWith = payWith
        this.sending = true
        let params = {
          tariff: this.tariff.sname,
          months: this.months,
          pay_with: payWith,
          return_url: this.createAbsoluteUrl('/upgrade/wait'),
          cancel_url: this.createAbsoluteUrl('/upgrade')
        }
        return this.$api.post('payment/upgrade', params)
          .then(res => {
            if (res.data.status === 'pending' && res.data.redirect_url) {
              if (res.data.pay_with === 'commercegate' && res.data.hash) {
                this.$router.push(this.createUrl({path: '/upgrade/commercegate', query: {hash: res.data.hash}}))
              } else {
                window.location = res.data.redirect_url
              }
            } else {
              this.$router.push(this.createUrl({path: '/upgrade/complete', query: {hash: res.data.hash}}))
            }
          })
          .catch(err => {
            alert(getErrorFromResponse(err))
            this.sending = false
          })
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';

  .c-select-payment-type {
    @top-height: 46px;
    z-index: 9999;
    height: 100%;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    overflow: hidden;
    background-color: rgba(0, 0, 0, 0.7);
    touch-action: none;
    .b-main-wrap {
      position: absolute;
      width: 100vw;
      height: calc(100vh ~'-' @top-height);
      display: flex;
      align-items: center;
      justify-content: center;
      top: @top-height;
      left: 0;
      .b-main {
        background: #fff;
        width: 300px;
        padding: 25px;
        margin: 0 auto;
        .b-confirm {
          text-align: center;
          .b-copy {
            margin-bottom: 15px;
          }
        }

        .b-periods {
          .b-period {
            margin-bottom: 20px;
            label {
              margin-left: 25px;
              font-size: 1.2em;
            }
          }
        }
        .b-buttons {
          display: flex;
          justify-content: space-between;
          .btn {
            width: 110px !important;
            .e-icon {
              font-size: 1.5em;
              &.bu-paypal {
                margin-right: 2px;
              }
            }
          }
        }
      }
    }
  }
</style>
