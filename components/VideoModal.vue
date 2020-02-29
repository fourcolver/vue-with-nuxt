<template>
  <div class="c-video-modal m-modal" v-show="visible" v-key-escape="() => close()" @click="close()">
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
      <video :width="w ? w + 'px' : null" :height="h ? h + 'px' : null" ref="video" loop controls @click.stop="">
        <source :src="url" :type="mime">
      </video>
    </div>
    <slot name="bottom"></slot>
  </div>
</template>

<script>
  export default {
    name: 'video-modal',
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
        window.open(this.url, '_blank')
      }
    },
    mounted () {
      window.videoModal = this
      this.$refs.video.play()
      if (!this.waitLoad) {
        this.visible = true
      } else {
        this.$refs.video.addEventListener('loadeddata', () => {
          this.visible = true
          if (typeof this.onOpen === 'function') {
            this.onOpen()
          }
        })
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';
  @import '~assets/css/modal.less';
</style>