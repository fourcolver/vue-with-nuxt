<template>
  <div class="c-editor-text" v-html="linkify(text)">
  </div>
</template>

<script>
  import playIconImg from '~/assets/img/play.svg'
  import AudioPlayer from '~/components/AudioPlayer.vue'
  import Vue from 'vue'
  import listeners from '~/utils/mixins/listeners'
  import { linkify } from '~/utils/helpers'

  export default {
    name: 'editor-text',
    mixins: [listeners],
    props: {
      text: null,
      files: {
        type: Array,
        default: () => []
      },
      starred: {
        type: Array,
        default: () => []
      },
      is_read: true
    },
    data () {
      return {}
    },
    methods: {
      async prepareContent () {
        this.$el.querySelectorAll('.bu-video-wrapper').forEach(el => {
          let img = document.createElement('img')
          img.setAttribute('src', playIconImg)
          img.classList.add('e-play-icon')
          img.classList.add('js-play-icon')
          el.appendChild(img)
        })

        await this.getLoadingMediaPromise()

        this.$el.querySelectorAll('.bu-image-wrapper').forEach(el => {
          let mainImg = document.createElement('div')
          mainImg.setAttribute('class', 'b-img')
          let overlay = document.createElement('div')
          overlay.setAttribute('class', 'b-overlay js-img-overlay')
          let img = el.querySelector('.bu-image')
          let caption = el.querySelector('.bu-image-comment')
          if (img) {
            let width = img.getBoundingClientRect().width
            let height = img.getBoundingClientRect().height
            if (caption && (width < 300 || height < 300)) {
              if (width < 300) {
                width = 300
              }
              img.classList.add('has-overlay')
            } else if (!caption && (width < 100 || height < 100)) {
              if (width < 100) {
                width = 100
              }
              img.classList.add('has-overlay')
            }
            mainImg.style.maxWidth = width + 'px'
            overlay.appendChild(img)
          }
          mainImg.appendChild(overlay)
          if (caption) {
            mainImg.appendChild(caption)
            el.classList.add('has-caption')
          }
          el.innerHTML = ''
          el.appendChild(mainImg)
        })

        this.$el.querySelectorAll('.bu-file-wrapper').forEach(el => {
          let link = el.querySelector('.bu-file')
          if (link) {
            let href = link.getAttribute('href')
            let file = this.files.find(el => +el.id === +link.getAttribute('data-id'))
            if (file && /\.(mp3|ogg)$/.test(href)) {
              this.mountAudioPlayer(el, file)
            }
          }
        })

        this.$el.querySelectorAll('.js-text > div').forEach(el => {
          if (el.innerHTML.trim() === '<br>') {
            el.classList.add('m-empty')
            el.classList.add('js-empty')
          }
          if (el.getAttribute('data-uid')) {
            if (this.starred.includes(el.getAttribute('data-uid'))) {
              el.classList.add('js-starred')
            }
          }
        })
      },
      mountAudioPlayer (el, file) {
        const Player = Vue.extend(AudioPlayer)
        const instance = new Player({
          propsData: {
            name: this.$t('chat.voice_message'),
            file,
            uid: el.getAttribute('data-uid')
          },
          parent: this
        })
        instance.$mount(el)
      },
      getLoadingMediaPromise () {
        let promises = []
        this.$el.querySelectorAll('img.bu-image').forEach(el => {
          if (!el.complete) {
            promises.push(new Promise(resolve => {
              el.onload = el.onerror = () => resolve()
            }))
          }
        })
        this.$el.querySelectorAll('video.bu-video').forEach(el => {
          if (el.readyState < 2) {
            promises.push(new Promise(resolve => {
              el.addEventListener('loadeddata', () => {
                resolve()
              })
            }))
          }
        })
        return Promise.all(promises)
      },
      linkify
    },
    computed: {},
    mounted () {
      this.addListener(this.$el, 'click', e => {
        if (!this.is_read) {
          return
        }
        const t = e.target
        const showImgModal = img => {
          window.layout.$refs.dialog.activate('image-modal', {
            url: img.getAttribute('src').replace('medium', 'file'),
            waitLoad: true
          })
          e.stopPropagation()
        }
        if (t.tagName.toLowerCase() === 'img' && t.classList.contains('bu-image')) {
          showImgModal(t)
        } else if (t.classList.contains('js-img-overlay')) {
          let img = t.querySelector('img')
          if (img) {
            showImgModal(img)
          }
        } else if (t.tagName.toLowerCase() === 'video' && t.classList.contains('bu-video')) {
          e.preventDefault()
          t.muted = false
          t.loop = false
          t.controls = true
          // ставить только если оно не было активировано руками
          if (!t.getAttribute('data-clicked')) {
            t.currentTime = 0
            t.play()
          } else {
            !t.paused ? t.pause() : t.play()
          }
          t.setAttribute('data-clicked', 1)
          let btn = t.parentElement.querySelector('.e-play-icon')
          if (btn) {
            btn.style.display = 'none'
          }
        }
      })
      this.prepareContent().then(() => this.$emit('load'))
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-editor-text {
    text-align: justify;
    line-height: 1.5em;
    a {
      padding: 3px 0;
    }
    .c-audio-player {
      .b-player {
        display: flex;
        max-width: 300px;
        background: #f8f8f8;
        border: 1px solid #f3f3f3;
        margin: 10px 0;
        > .b-center {
          > .e-name {
            line-height: 1em;
            margin-bottom: 5px;
            color: #000 !important;
            font-weight: bold;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
          }
        }
      }
      .b-player, .b-recognized-text {
        border-radius: 5px;
      }
    }
    .bu-image-wrapper, .bu-video-wrapper {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      margin-top: 10px;
      margin-bottom: 10px;
      img.bu-image, video.bu-video {
        max-width: 100%;
        max-height: 700px;
        height: auto !important;
        width: auto !important;
        border-radius: 5px;
        cursor: pointer;
      }
      .e-play-icon {
        position: absolute;
        align-self: center;
        box-shadow: 0 0 5px rgba(0, 0, 0, .8);
        opacity: 0.85;
        border-radius: 50%;
        pointer-events: none;
      }
    }
    .bu-image-wrapper {
      .b-overlay {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 100px;
        min-height: 100px;
        background: #000;
        border-radius: 5px;
        cursor: pointer;
      }
      img.bu-image {
        background: url(/img/transparent_grid.png);
      }
      img.bu-image.has-overlay {
        border-radius: 0;
      }
      &.has-caption {
        .b-overlay {
          min-width: 150px;
          min-height: 150px;
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }
        .bu-image:not(.has-overlay) {
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }
      }
      .bu-image-comment {
        background: #d7e7ff;
        padding: 10px;
        border-radius: 0 0 7px 7px;
        margin: 0 auto;
        position: relative;
        font-size: 1.1rem;
        text-align: center;
        word-wrap: break-word;
      }
      > .bu-image-comment {
        display: none;
      }
      &.has-caption {
        min-width: 150px;
        min-height: 150px;
      }
    }
    > div {
      i.bu-star {
        display: none;
      }
      &.js-starred {
        background: #fafad2;
        border-radius: 4px;
        border: 2px solid #fafad2;
        &:hover {
          border-color: transparent;
        }
      }
    }
  }
</style>
