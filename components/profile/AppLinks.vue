<template>
  <div class="c-profile-app-links app-form">
    <div class="b-title">
      {{ $t('profile_app_links.title') }}
    </div>
    <div class="b-body">
      <div class="b-links">
        <a v-for="href, app in links" class="b-link" :href="href"
           target="_blank">
          <img :src=" '/os_icons/' + app + '.svg'  ">
          <span class="e-name">{{ app }}</span>
        </a>
      </div>
    </div>
  </div>
</template>
<script>
  import { APP_DOWNLOAD_LINKS } from '~/utils/dict'

  export default {
    name: 'app-links',
    data () {
      return {}
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
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .c-profile-app-links {
    margin-top: 20px;
    .b-body {
      .b-links {
        display: flex;
        justify-content: center;
        a {
          margin: 0 20px;
          padding: 15px;
          text-align: center;
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
    }
  }
</style>