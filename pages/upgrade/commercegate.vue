<template>
  <div class="b-commercegate-page">
    <iframe frameborder="0" width="100%" height="1000" :src="redirect_url"></iframe>
  </div>
</template>

<script>
  import { raiseError } from '~/utils/helpers'
  export default {
    middleware: ['member', 'owner'],
    data: () => ({
      redirect_url: null
    }),
    asyncData ({app, query, redirect, error}) {
      if (!query.hash) {
        return redirect('/upgrade')
      }
      return app.$api.post('payment/status?hash=' + query.hash)
        .then(res => {
          if (!res.data.redirect_url) {
            return redirect('/upgrade/complete?hash=' + query.hash)
          }
          return res.data
        }).catch((e) => raiseError(error, e))
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  .b-commercegate-page{
    margin: 20px auto;
    max-width: 400px;
  }
</style>
