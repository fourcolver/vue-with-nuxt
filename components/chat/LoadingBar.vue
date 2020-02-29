<template>
  <div class="c-loading-bar">
    <div class="e-bar"></div>
  </div>
</template>

<script>
  export default {
    name: 'loading-bar',
    data () {
      return {}
    },
    methods: {},
    computed: {}
  }
</script>

<style lang="less" type="text/less" scoped>
  @keyframes progress {
    from {
      margin-left: 0;
    }
    to {
      margin-left: 85%;
    }
  }

  .c-loading-bar {
    height: 2px;
    width: 100%;
    background: #fafafa;
    .e-bar {
      height: 100%;
      width: 15%;
      background: #bb381d;
      animation: progress 1s linear infinite;
    }
  }
</style>