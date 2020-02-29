<template>
  <div class="app-draw-screen">
    <img ref="image" :src="url" v-if="url" class="e-screen" :width="width + 'px'" :height="height + 'px'">
  </div>
</template>

<script>
  export default {
    head: {
      title: 'Screenshot created with Quwi'
    },
    data () {
      return {
        url: null,
        width: null,
        height: null
      }
    },
    asyncData ({params, app}) {
      if (params.hash) {
        return app.$api.get('/draw-screens/view', {hash: params.hash}).then(res => {
          const file = res.data.info.file
          return {url: file.url, width: file.sizes.w, height: file.sizes.h}
        })
      }
    },
    computed: {}
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';

  .app-draw-screen {
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh ~'-' @navbar-height);
    img {
      border: 8px solid #fff;
      border-radius: 4px;
      box-shadow: 0 0 3px rgba(1, 1, 1, .3);
      height: auto;
      max-width: 100%;
    }
  }
</style>
