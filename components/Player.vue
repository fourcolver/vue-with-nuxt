<template>
  <div class="c-player" :style="{width: width + 'px', height: height + 'px'}">
    <video ref="video" v-bind="opts" @click="videoClick">
      <source :src="src" :type=" 'video/' + ext ">
    </video>
    <div class="b-overlay" @click="videoClick">
      <div class="b-top" @click.stop="">
        <div class="b-left">
          <div class="e-name">{{ name || baseName }}</div>
        </div>
        <div class="b-right">
          <div v-if="size" class="e-size">{{ formatFileSize(size) }}</div>
          <i @click.stop="download" :title="$t('Download')" class="bu-download-cloud"></i>
        </div>
      </div>
      <div class="b-controls" v-if="showControls" @click.stop="">
        <div ref="progressBar" class="b-progress" @click.stop="seek">
          <div class="e-played" :style="{width: playedPercent + '%'}"></div>
          <div ref="progressHandle" @mousedown="dragEnabled = true"
               class="b-handle" :style="{left: `calc(${playedPercent}% - 10px)`}">
            <div class="e-circle"></div>
          </div>
          <div class="e-remaining"></div>
        </div>
        <div class="b-buttons">
          <context-menu trigger="hover">
            <div slot="content">
              <i @click="mute = !mute" class="e-volume" :class=" 'bu-volume-' + volumeClass "></i>
            </div>
            <div slot="items">
              <input ref="volumeRange" :value="volume * 100" @input="changeVolume" type="range">
            </div>
          </context-menu>
          <i v-if="!playing" class="bu-play" @click="play"></i>
          <i class="bu-pause" @click.stop="pause" v-else></i>

          <i @click.stop="fullScreen" class="bu-resize-full"></i>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
  import { formatFileSize } from '~/utils/helpers'
  import ContextMenu from './ContextMenu.vue'
  import { Drag, Drop } from 'vue-drag-drop'
  import listeners from '~/utils/mixins/listeners'

  export default {
    components: {
      ContextMenu,
      Drag,
      Drop
    },
    props: [
      'src',
      'size',
      'name',
      'width',
      'height',
      'opts'
    ],
    name: 'player',
    data () {
      return {
        playedPercent: 0,
        interval: null,
        playing: false,
        loop: true,
        mute: true,
        volume: 0.5,
        dragEnabled: false,
        showControls: true,
        videoTimeout: null,
        isFullScreen: false
      }
    },
    mixins: [listeners],
    methods: {
      formatFileSize,
      download () {
        window.location.href = this.src
      },
      play (fromStart = true) {
        const v = this.$refs.video
        if (this.loop) {
          if (fromStart) {
            v.currentTime = 0
          }
          this.mute = false
        }
        v.removeAttribute('loop')
        v.play()
        this.playing = true
        this.loop = false
      },
      pause () {
        this.$refs.video.pause()
        this.playing = false
      },
      videoClick () {
        const destroyTimeout = () => {
          clearTimeout(this.videoTimeout)
          this.videoTimeout = null
        }
        if (this.videoTimeout) {
          destroyTimeout()
          this.fullScreen()
        } else {
          this.videoTimeout = setTimeout(() => {
            this.playing ? this.pause() : this.play()
            destroyTimeout()
          }, 300)
        }
      },
      fullScreen () {
        if (!this.isFullScreen) {
          const elem = this.$refs.video
          if (elem.requestFullscreen) {
            elem.requestFullscreen()
          } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen()
          } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen()
          }
        } else {
          if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen()
          }
        }
        this.isFullScreen = !this.isFullScreen
      },
      seek (e) {
        const pb = this.$refs.progressBar
        let rect = pb.getBoundingClientRect()
        let start = rect.x || rect.left
        const selectedSize = e.clientX - start
        const width = rect.width
        if (selectedSize >= 0 && selectedSize <= width) {
          const percent = Math.floor(selectedSize / width * 100)
          if (percent) {
            const v = this.$refs.video
            v.currentTime = v.duration * percent * 0.01
            if (this.loop) {
              this.play(false)
            }
            this.setProgressPosition()
          }
        }
      },
      setProgressPosition () {
        const v = this.$refs.video
        if (!v) {
          return 0
        }
        if (!v.currentTime) {
          return 0
        }
        if (this.dragEnabled) {
          return
        }
        this.playedPercent = Math.ceil(v.currentTime / v.duration * 100)
        if (this.playedPercent === 100) {
          this.playing = false
        }
      },
      changeVolume (e) {
        if (this.mute) {
          this.mute = false
        }
        this.$refs.video.volume = this.volume = this.$refs.volumeRange.value * 0.01
      },
      drag (e) {
        if (!this.dragEnabled) {
          return true
        }
        const el = this.$refs.progressHandle
        const rect = this.$refs.progressBar.getBoundingClientRect()
        const left = rect.x || rect.left
        if (e.clientX >= left - 10 && e.clientX <= left + rect.width + 10) {
          el.style.left = Math.round(e.clientX - left - 10) + 'px'
        }
      },
      canPlay () {
        this.showControls = true
      }
    },
    computed: {
      ext () {
        const m = this.src.split('?')[0].match(/[^.?]+$/)
        if (m) {
          return m[0]
        }
      },
      baseName () {
        const m = this.src.split('?')[0].match(/[^/+]+$/)
        if (m) {
          return m[0]
        }
      },
      volumeClass () {
        if (this.mute) {
          return 'mute'
        }
        const volume = this.volume
        if (!volume) {
          return 'off'
        }
        if (volume < 0.3) {
          return 1
        } else if (volume <= 0.9) {
          return 2
        } else if (volume > 0.9) {
          return 3
        }
      }
    },
    mounted () {
      this.$refs.video.volume = 0
      this.interval = setInterval(this.setProgressPosition, 10)
      this.addListener(document, 'mousemove', this.drag)
      this.addListener(document, 'mouseup', () => {
        this.dragEnabled = false
      })
    },
    watch: {
      mute (val) {
        if (val) {
          this.volume = this.$refs.video.volume
          this.$refs.video.volume = 0
        } else {
          this.$refs.video.volume = this.volume
        }
      }
    },
    beforeDestroy () {
      if (this.interval) {
        clearInterval(this.interval)
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';

  .c-player {
    position: relative;
    video {
      max-width: 100%;
      width: 100%;
      height: 100%;
      box-shadow: @box-shadow;
    }
    .b-overlay {
      cursor: pointer;
      position: absolute;
      width: 100%;
      height: 100%;
      z-index: 1;
      top: 0;
      left: 0;
      color: #fff;
      @stroke: 0 1px black, 0 -1px black, 1px 0 black, -1px 0 black;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      .b-top, .b-controls {
        height: 10%;
        opacity: 0;
        display: flex;
        align-items: center;
        padding: 0 10px;
        cursor: default;
        &:not(:hover) {
          transition: opacity linear .3s;
        }
      }
      &:hover {
        .b-controls, .b-top {
          opacity: 1;
        }
      }
      .b-top {
        @gradient: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAADGCAYAAAAT+OqFAAAAdklEQVQoz42QQQ7AIAgEF/T/D+kbq/RWAlnQyyazA4aoAB4FsBSA/bFjuF1EOL7VbrIrBuusmrt4ZZORfb6ehbWdnRHEIiITaEUKa5EJqUakRSaEYBJSCY2dEstQY7AuxahwXFrvZmWl2rh4JZ07z9dLtesfNj5q0FU3A5ObbwAAAABJRU5ErkJggg==);
        background-image: @gradient;
        justify-content: space-between;
        align-items: center;
        height: 40px;
        .e-name, .e-size, i {
          text-shadow: @stroke;
          opacity: .7;
        }
        i {
          cursor: pointer;
          &:hover {
            opacity: 1;
          }
        }
        .b-right {
          .e-size {
            display: inline;
            margin-right: 8px;
          }
        }
      }
      .b-controls {
        height: 80px;
        bottom: 0;
        flex-direction: row;
        flex-wrap: wrap;
        width: 100%;
        .b-progress {
          cursor: pointer;
          width: 90%;
          margin: auto;
          position: relative;
          display: flex;
          .e-played, .e-remaining {
            height: 10px;
            background: #fff;
            border-top: 1px solid rgba(160, 160, 160, .5);
            border-bottom: 1px solid rgba(160, 160, 160, .5);
          }
          .b-handle {
            cursor: pointer;
            width: 20px;
            height: 20px;
            position: absolute;
            top: -5px;
            border-radius: 50%;
            background-image: linear-gradient(to bottom, #dbe0e1, #cdd3d5, #c0c6ca, #b2babe, #a6adb3);
            .e-circle {
              width: 10px;
              height: 10px;
              background: #fff;
              border-radius: 50%;
              margin-top: 5px;
              margin-left: 5px;
            }
          }
          .e-played {
            opacity: .4;
          }
          .e-remaining {
            flex: 1;
          }
        }
        .b-buttons {
          width: 70%;
          margin: auto;
          display: flex;
          justify-content: space-around;
          align-items: center;
          i {
            color: #fff;
            text-shadow: @stroke;
            font-size: 1.6em;
            cursor: pointer;
            opacity: .7;
            &.e-volume {
              font-size: 1.2em;
            }
            &:hover {
              opacity: 1;
            }
          }
          .b-volume {
          }
          .b-context-menu {
            .b-menu-items {
              padding: 10px 15px;
              input {
                cursor: pointer;
                outline: none;
              }
            }
          }
        }
      }
    }
  }
</style>