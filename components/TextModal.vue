<template>
  <div class="c-text-modal m-modal" v-key-escape="() => close()" @click="close()">
    <div class="b-box">
      <div class="b-title" v-if="title">{{ title }}</div>
      <div class="b-body" v-html="text"></div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'text-modal',
    props: ['title', 'text'],
    data () {
      return {
        visible: false
      }
    },
    methods: {
      close () {
        if (typeof this.onClose === 'function') {
          this.onClose()
        }
        this.$emit('close')
      },
      download () {
        window.open(this.url + (this.url.indexOf('?') === -1 ? '?' : '&') + 'download=1', '_blank')
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/modal.less';
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-text-modal {
    display: flex;
    align-items: center;
    justify-content: center;
    .b-box {
      .white-box();
      color: #000;
      min-width: 400px;
      max-width: 70vw;
      padding: 15px;
      max-height: 80vh;
      overflow: auto;
      .b-title {
        font-weight: bold;
        margin-bottom: 5px;
      }
    }
  }
</style>
