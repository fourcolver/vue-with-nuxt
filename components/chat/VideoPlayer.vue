<template>
  <div class="c-chat-video-player">
    <video ref="video" loop muted @click="open">
      <source :src="file.info.file.url" :type="file.mime_type">
    </video>
    <slot name="info"></slot>
  </div>
</template>

<script>
  export default {
    name: 'chat-video-player',
    props: ['message'],
    data () {
      return {
        active: false,
        isFullscreen: false
      }
    },
    methods: {
      open () {
        this.$refs.video.pause()
        window.layout.$refs.dialog.activate('chat-video-modal', {
          message: this.message,
          onClose: () => this.$refs.video.play()
        })
      }
    },
    computed: {
      file () {
        return this.message.file
      }
    }
  }
</script>

<style lang="less" type="text/less">
  .c-chat-video-player {
    position: relative;
    .b-info {
      font-size: .8em;
      position: absolute;
      bottom: 9px;
      right: 14px;
      background: rgba(0, 0, 0, .3);
      color: #fff;
      padding: 3px 3px 2px 7px;
      border-radius: 3px;
      display: none;
      .e-read {
        margin-right: 3px;
      }
    }
    &:hover {
      .b-info {
        display: flex;
      }
    }
  }
</style>
