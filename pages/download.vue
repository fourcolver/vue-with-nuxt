<template>
  <div class="app-download">
    <div class="b-active">
      <a class="b-link" :href="links[platform]" target="_blank">
        <img :src=" '/os_icons/' + platform + '.svg'  ">
        <span class="e-name">{{ platform }}</span>
      </a>
    </div>
    <div class="b-other">
      <a v-for="href, app in links" class="b-link" :href="href" target="_blank" v-if="app != platform">
        <img :src=" '/os_icons/' + app + '.svg'  ">
        <span class="e-name">{{ app }}</span>
      </a>
    </div>
  </div>
</template>

<script>
  import { APP_DOWNLOAD_LINKS } from '~/utils/dict'

  export default {
    data () {
      return {
        platform: 'windows'
      }
    },
    asyncData ({req}) {
      let platform = 'windows'
      if (process.server) {
        let ua = req.headers['user-agent']
        if (ua) {
          ua = ua.toLowerCase()
          if (ua.indexOf('linux') !== -1) {
            platform = 'linux'
          } else if (ua.indexOf('macintosh') !== -1 || ua.indexOf('mac os') !== -1) {
            platform = 'mac'
          } else if (ua.indexOf('android') !== -1) {
            platform = 'android'
          }
        }
      } else {
        let p = navigator.platform
        if (p) {
          p = p.toLowerCase()
          if (p.indexOf('android') === 0) {
            platform = 'android'
          } else if (p.indexOf('linux') === 0) {
            platform = 'linux'
          } else if (p.indexOf('mac') === 0) {
            platform = 'mac'
          }
        }
      }
      return {platform}
    },
    methods: {},
    computed: {
      links () {
        return APP_DOWNLOAD_LINKS
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .app-download {
    padding-top: 20px;
    .b-active {
      text-align: center;
      margin: 30px 0;
      a.b-link {
        padding: 20px;
        img {
          width: 100px;
          height: 100px;
        }
      }
    }
    .b-other {
      text-align: center;
    }
    a.b-link {
      margin: 0 20px;
      padding: 15px;
      text-align: center;
      display: inline-block;
      img {
        width: 70px;
        height: 70px;
      }
      .e-name {
        text-transform: capitalize;
        display: block;
        margin-top: 15px;
        color: @green-color;
        font-size: 1.2em;
      }
      .hover-mixin();
    }
  }
</style>