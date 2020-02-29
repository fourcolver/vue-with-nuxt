<template>
  <div class="c-misc-settings app-form">
    <div class="b-title">{{ $t('misc_settings.title') }}</div>
    <div class="b-form">
      <div class="b-row">
        <toggle v-model="showInlineText"></toggle>
        <div class="e-label">{{ $t('misc_settings.show_inline_audio_text') }}</div>
      </div>
    </div>
  </div>
</template>

<script>
  import Toggle from '../Toggle.vue'

  export default {
    components: {Toggle},
    name: 'misc-settings',
    data () {
      return {}
    },
    methods: {},
    computed: {
      showInlineText: {
        get () {
          return this.$store.state.userSettings.show_inline_recognized_text
        },
        set (val) {
          this.$store.dispatch('updateUserSettingsSync', {show_inline_recognized_text: val})
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  .c-misc-settings {
    margin-top: 20px;
    .b-row {
      display: flex;
      align-items: center;
      .c-toggle {
        margin-right: 20px;
      }
    }
  }
</style>