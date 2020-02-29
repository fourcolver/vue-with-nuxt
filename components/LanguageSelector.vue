<template>
  <context-menu trigger="click" class="c-language-selector" :autoClose="true">
    <div class="b-flag" slot="content">
      <flag :iso="currentLanguage.iso" :title="currentLanguage.title" :squared="false"></flag>
      <span class="e-iso" v-if="showAbbr">{{ currentLanguage.abbr }}</span>
      <span class="e-title" v-if="showTitle">{{ currentLanguage.title }}</span>
    </div>
    <div class="b-items" slot="items">
      <div @click="$emit('change', language.locale)" class="b-item" v-for="language in languages"
           v-if="language.iso != currentLanguage.iso" :key="language.iso">
        <flag :iso="language.iso" :squared="false"></flag>
        <span class="e-name">{{ language.title }}</span>
      </div>
    </div>
  </context-menu>
</template>

<script>
  import ContextMenu from './ContextMenu.vue'
  import 'flag-icon-css/css/flag-icon.css'
  import Flag from './Flag.vue'

  export default {
    components: {
      Flag,
      ContextMenu
    },
    name: 'language-selector',
    props: ['showAbbr', 'lang', 'showName', 'showTitle'],
    model: {
      prop: 'lang',
      event: 'change'
    },
    data () {
      return {
        languages: [
          {
            iso: 'ru',
            abbr: 'ru',
            locale: 'ru-RU',
            title: 'Русский'
          },
          {
            iso: 'us',
            abbr: 'en',
            locale: 'en-US',
            title: 'English'
          }
        ]
      }
    },
    computed: {
      currentLanguage () {
        return this.languages.find(el => el.locale === this.lang)
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';

  .c-language-selector.b-context-menu {
    display: inline-flex;
    vertical-align: top;
    > .b-trigger {
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      padding: 5px 10px;
      &:hover {
        background-color: @hover-color;
      }
      .b-flag {
        .flag-icon{
          box-shadow: 0 0 1px 0 rgba(0, 0, 0, .44);
          margin-right: 7px;
        }
        .e-iso{
          text-transform: uppercase;
          color: #636363;
          font-size: .8em;
        }
      }
      .b-items {
        .b-item {
          padding: 0 15px;
          display: flex;
          align-items: center;
          height: 35px;
          .flag-icon {
            margin-right: 10px;
          }
        }
      }
    }
  }
</style>
