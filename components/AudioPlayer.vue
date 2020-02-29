<template>
  <div class="c-audio-player" :data-uid="uid">
    <div class="b-player">
      <div class="b-left">
        <i class="bu-play" v-if="!playing" @click="play"></i>
        <i class="bu-pause" @click="pause" v-else></i>
      </div>
      <div class="b-center" @click="download">
        <div class="e-name">{{ name || file.base_name}}</div>
        <div class="b-static-info" v-if="!active">
          <div class="e-size">{{ formatFileSize(file.size)}}</div>
        </div>
        <div class="b-play-info" v-else>
          <div class="b-timer">
            <span>{{ secondsToHIS(Math.floor(playedTime), 'i:s', false)}}</span>
            <span class="e-slash">/</span>
            <span>{{ secondsToHIS(Math.floor(duration), 'i:s', false) }}</span>
          </div>
          <progress-bar @click="p => seek(p * 0.01 * duration)"
                        :percent="Math.ceil(playedTime/duration * 100)" stop-propagation="true"></progress-bar>
        </div>
      </div>
      <div class="b-right" v-if="file.recognized_text && !isInlineText"
           @click="showRecognizedText = !showRecognizedText">
        <i class="bu bu-recognize"></i>
      </div>
      <template v-if="!active">
        <slot name="info"></slot>
      </template>
      <audio @timeupdate="timeUpdate" @durationchange="setDuration" ref="audio">
        <source :src="file.info.file.url" :type="file.mime_type">
      </audio>
    </div>
    <div class="b-recognized-text" v-if="file.recognized_text && (isInlineText || showRecognizedText)">
      {{ $t('audio_player.recognized_text') + ': ' + file.recognized_text }}
    </div>
  </div>
</template>

<script>
  import { formatFileSize } from '~/utils/helpers'
  import { secondsToHIS } from '~/utils/time'
  import listeners from '~/utils/mixins/listeners'
  import ProgressBar from '~/components/ProgressBar.vue'
  import TextModal from './TextModal.vue'

  export default {
    components: {
      TextModal,
      ProgressBar
    },
    name: 'audio-player',
    props: ['file', 'name', 'uid'],
    mixins: [listeners],
    data () {
      return {
        playing: false,
        playedTime: 0,
        duration: 0,
        active: false,
        durationListener: null,
        showRecognizedText: false
      }
    },
    methods: {
      async play () {
        if (!this.duration || this.duration === Infinity || isNaN(this.duration)) {
          await this.getDuration()
        }
        this.playing = true
        this.active = true
        this.$refs.audio.play()
        this.$emit('play')
      },
      async setDuration (e) {
        const aud = this.$refs.audio
        if (!aud || aud.duration === Infinity) {
          this.duration = await this.getDuration()
        } else {
          this.duration = aud.duration
        }
      },
      pause () {
        this.$refs.audio.pause()
        this.playing = false
      },
      timeUpdate () {
        if (!this.playing) {
          return
        }
        this.playedTime = this.$refs.audio.currentTime
        if (this.playedTime >= this.duration) {
          this.playing = false
          this.active = false
          this.$refs.audio.currentTime = 0
          this.$refs.audio.pause()
          this.playedTime = 0
        }
      },
      getDuration () {
        return new Promise(resolve => {
          let a = new Audio(this.file.info.file.url)
          if (a.duration === Infinity || isNaN(a.duration)) {
            a.currentTime = 1e6
            const interval = window.setInterval(() => {
              if (a.duration !== Infinity && !isNaN(a.duration)) {
                resolve(a.duration)
                a = null
                window.clearInterval(interval)
              }
            }, 20)
          } else {
            resolve(a.duration)
          }
        })
      },
      seek (time) {
        this.$refs.audio.currentTime = time
        this.playedTime = time
        if (!this.playing) {
          this.play()
        }
      },
      download () {
        window.location.href = this.file.info.file.url
      },
      showText () {
        this.$alert({
          text: this.file.recognized_text,
          yesLabel: 'ok'
        })
      },
      secondsToHIS,
      formatFileSize
    },
    computed: {
      isInlineText () {
        return this.$store.state.userSettings.show_inline_recognized_text
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';

  .c-audio-player {
    padding: 0 !important;
    min-width: 295px !important;
    .b-player {
      min-width: 295px !important;
      flex: 1;
      display: flex;
      .b-left, .b-right {
        min-width: 42px;
        padding: 5px;
        display: flex;
        justify-content: center;
        align-items: center;
        .hover-mixin();
        i.bu-pause {
          font-size: 1.6em !important;
        }
        i.bu-play {
          font-size: 1.9em !important;
        }
        i.bu-recognize {
          font-size: 1.7em;
        }
        height: initial !important;
      }
      .b-center {
        width: 100%;
        padding: 5px;
        .hover-mixin();
        flex: 1;
        .b-play-info, .b-static-info {
          display: flex;
          align-items: center;
          height: 16px;
          .e-download {
            .hover-mixin();
            margin-left: 5px;
          }
        }
        .b-play-info {
          .b-timer {
            color: #999;
            margin-right: 10px;
          }
          .c-progress-bar {
            flex: 1;
            width: 100%;
            height: 5px;
            .e-bar, .e-fill {
              border-radius: 0;
              height: 5px;
            }
            .e-bar {
              width: 100%;
              .e-fill {
                background: #000;
              }
            }
          }
        }
        .b-static-info {
        }
      }
      > .b-right {
        display: none;
      }
      &:hover > .b-right {
        display: flex;
      }
    }
    .b-recognized-text {
      background: #fcfac8;
      border: 1px solid #f5f5ac;
      padding: 5px 10px;
      font-style: italic;
    }
  }
</style>