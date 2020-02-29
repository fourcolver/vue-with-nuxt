<template>
  <div class="c-image-modal m-modal" v-show="visible" v-key-escape="() => close()" @click="close()">
    <div class="b-top">
      <div class="b-left"></div>
      <div class="b-right">
        <div class="e-download m-button" @click.stop="download">
          <i class="bu-down"></i>
        </div>
        <div class="e-close m-button">
          <i class="bu-cross"></i>
        </div>
      </div>
    </div>
    <div class="b-main">
      <protected-image ref="image" :preview="false" :src="url" :width="w ? w + 'px' : null"
                       :height="h ? h + 'px' : null"></protected-image>
    </div>
    <slot name="bottom"></slot>
  </div>
</template>

<script>
  import ProtectedImage from './ProtectedImage.vue'

  export default {
    components: {ProtectedImage},
    name: 'image-modal',
    props: ['url', 'mime', 'onOpen', 'onClose', 'w', 'h', 'waitLoad'],
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
      },
      loaded () {
        this.visible = true
        if (typeof this.onOpen === 'function') {
          this.onOpen()
        }
      }
    },
    mounted () {
      window.imgModal = this
      if (!this.waitLoad) {
        this.visible = true
      } else {
        if (this.$refs.image.$el.complete) {
          this.loaded()
        } else {
          this.$refs.image.$el.addEventListener('load', e => {
            this.loaded()
          })
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/modal.less';
</style>