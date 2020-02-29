<template>
  <div class="la-ball-clip-rotate la-sm c-spinner" v-else>
    <div></div>
  </div>
</template>

<script>
  export default {
    name: 'quwi-spinner',
    data () {
      return {}
    },
    methods: {},
    computed: {}
  }
</script>

<style lang="less" type="text/less">
  @import '../assets/css/libs/load_awesome/load_awesome.less';

  @width: 16px;
  .c-spinner {
    width: @width !important;
    height: @width !important;
    > div {
      width: @width !important;
      height: @width !important;
      /*width: inherit;*/
      /*height: inherit;*/
    }
  }
</style>
