<template>
  <div class="c-chat-message-placeholder b-message-row m-mine">
    <div class="b-message m-placeholder"
         :class="{'m-file': !!message.file, 'm-text': !!message.text, 'm-img': !!message.image, 'has-caption': !!message.caption}">
      <div class="b-left"></div>
      <div class="b-bubble" v-if="message.file">
        <div class="b-icon">
          <i class="bu-file-circle"></i>
        </div>
        <div class="b-center">
          <div class="e-name">{{ message.file.name }}</div>
          <div class="e-size">{{ formatFileSize(message.file.size) }}</div>
        </div>
        <div class="b-info">
          <div class="e-time"></div>
          <div class="e-read">
            <i class="bu-clock"></i>
          </div>
        </div>
      </div>
      <div class="b-right" v-else-if="message.text">
        <div class="b-bubble">
          <div class="e-text" v-html="message.text"></div>
          <div class="e-info">
            <div class="e-read">
              <i class="bu-clock"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="b-right m-img-col" v-else-if="message.image">
        <div class="b-img-wrap">
          <img ref="image" :src="message.image"/>
          <div class="b-caption" v-if="!!message.caption">
            <div class="b-text">
              <div class="e-text" v-if="!!message.caption" v-html="message.caption"></div>
            </div>
            <div class="b-time">
              <div class="e-read">
                <i class="bu-clock"></i>
              </div>
            </div>
          </div>
          <div class="b-info" v-else>
            <div class="e-read">
              <i class="bu-clock"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { formatFileSize } from '~/utils/helpers'

  export default {
    name: 'message-placeholder',
    props: ['message'],
    methods: {
      formatFileSize
    },
    mounted () {
      if (!this.message.image || (this.$refs.image && this.$refs.image.complete)) {
        this.$emit('load')
      } else if (this.$refs.image) {
        this.$refs.image.onload = () => {
          this.$emit('load')
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  .c-chat-message-placeholder {
    img, .b-bubble {
      cursor: default !important;
    }
    .b-img-wrap .b-info .e-read {
      margin: 0 !important;
    }
  }
</style>