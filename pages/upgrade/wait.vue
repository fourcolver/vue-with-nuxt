<template>
  <div class="b-wait-page" ref="waitPage">
    <div class="b-message">
      <h1>
        <quwi-spinner></quwi-spinner>
        <span>{{ $t('payments.please_wait') }}</span>
      </h1>
    </div>
  </div>
</template>

<script>
  import QuwiSpinner from '~/components/Spinner'

  export default {
    components: { QuwiSpinner },
    middleware: ['member', 'owner'],
    data () {
      return {
        timer: null
      }
    },
    created () {
      if (!this.$route.query.hash) {
        return this.$router.push({path: '/upgrade'})
      }
      if (!process.server) {
        this.$nextTick(() => {
          this.getStatus()
        })
      }
    },
    methods: {
      getStatus () {
        if (!this.$refs.waitPage) {
          return
        }
        return this.$api.post('payment/status?hash=' + this.$route.query.hash, this.$route.query)
          .then(res => {
            if (res.data.status === 'pending') {
              this.timer = setTimeout(() => {
                this.getStatus()
              }, 3000)
            } else {
              this.$router.push({path: '/upgrade/complete', query: {hash: this.$route.query.hash}})
            }
          })
          .catch(() => {
            this.$router.push({path: '/upgrade/complete', query: {hash: this.$route.query.hash}})
          })
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  .b-wait-page {
    width: @center-width;
    margin: 20px auto;
    .b-message {
      padding: 20px;
      color: black;
      background: white;
      box-shadow: 0 0 5px 0 rgba(0, 0, 0, .44);
      h1 {
        display: flex;
        align-items: center;
        font-size: 1.2em;
        .c-spinner {
          color: #000;
          margin-right: 10px;
        }
      }
      .b-info {
        margin-top: 20px;
      }
    }
  }
</style>
