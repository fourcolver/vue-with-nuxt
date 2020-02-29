<template>
  <div class="b-help">
    <h1>{{$t('Help')}}</h1>
    <h2>{{$t('Coming soon')}}</h2>
  </div>
</template>

<script>
    export default {
      mounted () {
        window.scrollTo(0, 0)
      }
    }
</script>

<style lang="less" type="text/less">
    @import '~assets/css/mixins.less';
    @import '~assets/css/variables.less';
    @import '~assets/css/animation.less';
    @import '~assets/css/menu.less';
    @import '~assets/css/libs/load_awesome/load_awesome.less';

    .b-help {
      width: 700px;
      margin: 20px auto;

      h1 {
        text-align: center;
        color: #c33a24;
        font-size: 24px;
        padding: 15px 0;
      }
      h2 {
        font-size: 20px;
        font-style: italic;
        padding: 25px 0 15px 0;
      }
    }
</style>
