<template>
  <img class="c-protected-image"
       @mouseenter="changeSlide"
       @mouseleave="clearTimeouts"
       v-img="{enabled: preview, src: addToken(previewSrc || src), group, changed: i => $emit('changed', i)}"
       :src="addToken(slide || src)"/>
</template>

<script>
  import { addPrefetchLink } from '~/utils/dom'
  export default {
    props: ['preview', 'src', 'previewSrc', 'group', 'prefetchSrc', 'skipToken', 'slides'],
    name: 'protected-image',
    data () {
      return {
        slide: null,
        timers: []
      }
    },
    methods: {
      addToken (url) {
        if (!url || !this.$store.state.webuser.tokens) {
          return
        }
        if (this.skipToken) {
          return url
        }
        return url + (url.indexOf('?') !== -1 ? '&' : '?') + 'access_token=' + this.$store.state.webuser.tokens.access_token
      },
      changeSlide () {
        if (!this.slides || !this.slides.length) {
          return
        }

        let delay = 0

        this.slides.forEach((item) => {
          delay += 500

          let timer = setTimeout(() => {
            this.slide = item.sizes.thumb.url
          }, delay)

          this.timers.push(timer)
        })
      },
      clearTimeouts () {
        this.slide = null
        this.timers.forEach((item) => {
          clearTimeout(item)
        })
      }
    },
    mounted () {
      if (this.previewSrc || this.prefetchSrc) {
        addPrefetchLink(this.addToken(this.previewSrc || this.prefetchSrc))
      }
    }
  }
</script>
<style lang="less" type="text/less">
  .c-protected-image {
    background: url(/img/transparent_grid.png);
  }
</style>
