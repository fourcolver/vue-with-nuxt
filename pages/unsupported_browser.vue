<template>
  <div class="app-unsupported-browser">
    <div class="b-box">
      <div>{{ $t('unsupported_browser.not_supported') }}</div>
      <div>{{ $t('unsupported_browser.recommend') }}</div>
      <div><a href="https://chrome.google.com" target="_blank">Google Chrome</a></div>
      <div><a href="https://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a></div>
    </div>
  </div>
</template>

<script>
  export default {
    layout: 'guest',
    data () {
      return {}
    },
    methods: {},
    computed: {}
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .app-unsupported-browser {
    .b-box {
      .white-box();
      width: @issues-width;
      margin: 50px auto;
      padding: 20px;
      > div:not(:last-child) {
        margin-bottom: 10px;
      }
    }
  }
</style>
