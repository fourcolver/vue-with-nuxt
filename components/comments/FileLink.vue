<template>
  <div class="b-file-link">
    <div class="b-file">
      <div class="b-icon" @click="download()">
        <i class="bu-file-circle"></i>
      </div>
      <div class="b-meta" @click="download()">
        <div class="e-name">{{ file.base_name }}</div>
        <div class="e-size">{{ formatFileSize(file.size) }}</div>
      </div>
      <div v-if="removable" @click.stop="remove" class="b-remove">
        <i class="bu-trash-empty"></i>
      </div>
    </div>
    <div class="b-player" v-if="playing" v-show="videoLoaded">
      <video @canplay="onLoad" controls autoplay>
        <source :src="fileUrl" type="video/mp4">
      </video>
    </div>
  </div>
</template>

<script>
  import { formatFileSize } from '~/utils/helpers'

  export default {
    props: ['file', 'removable'],
    data () {
      return {
        playing: false,
        videoLoaded: false
      }
    },
    computed: {
      fileUrl () {
        const url = this.file.file_url
        return url + (url.indexOf('?') > 0 ? '&' : '?') + 'access_token=' + this.$store.state.webuser.tokens.access_token
      }
    },
    methods: {
      download () {
        window.location.href = this.fileUrl
      },
      remove () {
        this.$emit('remove')
      },
      onLoad () {
        this.videoLoaded = true
      },
      formatFileSize
    }
  }
</script>

<style lang="less">

  @import '~assets/css/mixins.less';

  .b-file-link {
    > .b-file {
      display: flex;
      &:after {
        .after-clearfix();
      }
      padding: 15px 0;
      &:first-child {
        padding-top: 0;
      }
      &:last-child {
        padding-bottom: 0;
      }
      margin-left: -5px;
      > div {
        cursor: pointer;
      }
      @icon-size: 40px;
      .b-icon {
        float: left;
        margin-right: 5px;
        i {
          font-size: @icon-size;
          color: #2975dc;
          vertical-align: top;
        }
      }
      .b-meta {
        height: @icon-size;
        float: left;
        .e-name {
          color: #2567c0;
          margin-bottom: 5px;
          margin-top: 1px;
        }
        .e-size {
          color: #aaa;
        }
      }
      .b-play {
        margin-left: 10px;
        display: flex;
        align-items: center;
        i {
          color: #727272;
          font-size: 20px;
          cursor: pointer;
          &:hover {
            opacity: .7;
          }
        }
      }
      > .b-remove {
        align-self: center;
        margin-left: 10px;
        i {
          visibility: hidden;
        }
      }
      &:hover .b-remove i {
        visibility: visible;
      }
    }

    .b-player {
      max-width: 100%;
      box-shadow: 0 0 3px #aaa;
      margin-top: 10px;
      video {
        max-width: 100%;
      }
    }
  }
</style>