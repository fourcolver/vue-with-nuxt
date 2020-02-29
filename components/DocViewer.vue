<template>
  <div class="c-doc-viewer modal" v-if="visible" v-key-escape="hide" @click="hide">
    <iframe v-key-escape="hide" frameborder="0" v-if="file" :src="frameUrl"></iframe>
  </div>
</template>

<script>
  export default {
    name: 'doc-viewer',
    props: {
      engine: {
        default: 'ms'
      }
    },
    data () {
      return {
        visible: false,
        file: null
      }
    },
    methods: {
      show (file) {
        this.file = file
        this.visible = true
      },
      hide () {
        this.file = null
        this.visible = false
      }
    },
    computed: {
      frameUrl () {
        const url = this.file + (this.file.indexOf('?') === -1 ? '?' : '&') + 'access_token=' + this.$store.state.webuser.tokens.access_token
        const baseUrl = this.engine === 'ms' ? 'https://view.officeapps.live.com/op/embed.aspx?src=' : 'https://docs.google.com/gview?embedded=true&url='
        return baseUrl + encodeURI(url)
      }
    }
  }
</script>

<style lang="less" type="text/less">
  .c-doc-viewer {
    iframe {
      width: 100%;
      max-width: 850px;
      min-height: 500px;
      outline: none;
      border: none;
    }
    &.modal {
      position: fixed;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, .4);
      z-index: 9999;
      top: 0;
      left: 0;
      text-align: center;
      cursor: pointer;
      iframe {
        margin: 20px auto;
        height: calc(100% ~'-' 30px);
      }
    }
  }
</style>