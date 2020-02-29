<template>
  <div class="b-complete-page">
    <template v-if="status === 'success'">
      <div class="b-message">
        <h1>{{ $t('payments.successfully_complete') }}</h1>
        <div class="b-info">
          <btn :text="$t('tariffs.continue')" @click="$router.push(createUrl('/dashboard'))" :isSubmit="false"></btn>
        </div>
      </div>
      <plan-info :hideButton="true"></plan-info>
    </template>

    <template v-else>
      <div class="b-message">
        <h1>{{ $t('payments.failure_complete') }}</h1>
        <div class="b-info" v-if="error_text">
          {{ error_text }}
        </div>
        <div class="b-info">
          <nuxt-link to="/upgrade">{{ $t('payments.click_to_try_again') }}</nuxt-link>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
  import PlanInfo from '../../components/profile/PlanInfo.vue'
  import { raiseError } from '~/utils/helpers'
  import Btn from '~/components/Btn'
  import { mapGetters } from 'vuex'

  export default {
    middleware: ['member', 'owner'],
    components: {
      PlanInfo,
      Btn
    },
    data: () => ({
      status: null,
      amount: null,
      pay_with: null,
      error_text: null,
      error_code: null
    }),
    computed: {
      ...mapGetters({
        createUrl: 'company/createUrl'
      })
    },
    async asyncData ({app, query, store, error}) {
      if (query.hash) {
        try {
          const res = await app.$api.post('payment/status?hash=' + query.hash)
          return res.data
        } catch (e) {
          raiseError(error, e)
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  .b-complete-page {
    width: @center-width;
    margin: 20px auto;
    .b-message {
      padding: 20px;
      color: black;
      background: white;
      box-shadow: 0 0 5px 0 rgba(0, 0, 0, .44);
      h1 {
        font-size: 1.2em;
      }
      .b-info {
        margin-top: 20px;
      }
    }
  }
</style>
