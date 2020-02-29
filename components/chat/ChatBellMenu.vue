<template>
  <context-menu class="c-chat-bell-menu" trigger="click" ref="menu">
    <div slot="content">
      <div class="b-toggle">
        <i class="bu-bell" :class="{'m-crossed': settings.dta_mute_until }"></i>
      </div>
    </div>
    <div slot="items" v-bar>
      <div class="b-scroll">
        <div class="b-headline m-row">{{ $t('chat_menu.notifications') }}</div>
        <div class="m-row">
          <checkbox v-tooltip="!pushEnabled ? $t('chat_menu.push_disabled') : null" :disabled="!pushEnabled"
                    v-model="allowPush" :value="true"
                    :label="$t('chat_menu.allow_push')"></checkbox>
        </div>
        <div class="m-row">
          <checkbox :disabled="!allowPush || !pushEnabled" v-model="isPreview" :value="true"
                    :label="$t('chat_menu.preview')"></checkbox>
        </div>
        <div class="m-row">
          <checkbox v-model="isSound" :value="true" :label="$t('chat_menu.sound')"></checkbox>
        </div>
        <template v-if="isSound">
          <div class="m-row e-change-sound" @click="showSoundOptions = !showSoundOptions">
            {{ $t('chat_menu.change_sound') }}
          </div>
          <template v-if="showSoundOptions">
            <div class="m-row b-sound-option" v-for="option in soundOptions">
              <radio-btn :label="option.name" v-model="soundUid" :value="option.uid"
                         @change="playSound(option.url)"></radio-btn>
            </div>
          </template>
        </template>
        <template v-if="!settings.dta_mute_until">
          <div class="b-headline m-row">{{ $t('chat.pause_notifications') }}</div>
          <div class="b-pause m-row" @click="stopNotifications(minutes)"
               v-for="minutes in [30, 60, 120, 240]">
            {{ formatDuration(minutes) }}
          </div>
        </template>
        <template v-else>
          <div class="b-dnd">
            <div class="e-on">{{ $t('chat.dnd_on') }}</div>
            <div class="e-until">
              {{ $t('chat.paused_until') + ' ' + $date(settings.dta_mute_until).format('D MMM H:mm')}}
            </div>
          </div>
          <div class="b-resume m-row" @click="stopNotifications(0)">{{ $t('chat.resume_notifications') }}
          </div>
        </template>
      </div>
    </div>
  </context-menu>
</template>

<script>
  import ContextMenu from '../ContextMenu.vue'
  import { mapState } from 'vuex'
  import { formatDuration } from '~/utils/chat'
  import Checkbox from '../Checkbox.vue'
  import RadioBtn from '../RadioBtn.vue'

  export default {
    components: {
      RadioBtn,
      Checkbox,
      ContextMenu
    },
    name: 'chat-bell-menu',
    data () {
      return {
        settingsUpdating: false,
        showSoundOptions: false
      }
    },
    methods: {
      stopNotifications (m) {
        if (this.settingsUpdating) {
          return
        }
        this.settingsUpdating = true
        this.$store.dispatch('updateUserSettings', {mute_until_period: m * 60}).then(() => {
          this.settingsUpdating = false
        })
        this.$refs.menu.toggle(false)
      },
      formatDuration (minutes) {
        return formatDuration(this, minutes)
      },
      playSound (url) {
        const a = new Audio(url)
        a.play()
      }
    },
    computed: {
      ...mapState({
        settings: state => state.userSettings,
        pushEnabled: state => state.pushEnabled,
        soundOptions: state => state.userSettings.chat_sound_options
      }),
      allowPush: {
        get () {
          return this.settings.allow_chat_push_notifications
        },
        set (val) {
          this.$store.dispatch('updateUserSettingsSync', {allow_chat_push_notifications: !!val})
        }
      },
      isPreview: {
        get () {
          return this.settings.is_preview_in_notification
        },
        set (val) {
          this.$store.dispatch('updateUserSettingsSync', {is_preview_in_notification: !!val})
        }
      },
      isSound: {
        get () {
          return this.settings.is_sound_on_notification
        },
        set (val) {
          this.$store.dispatch('updateUserSettingsSync', {is_sound_on_notification: !!val})
        }
      },
      soundUid: {
        get () {
          return this.settings.chat_sound_uid
        },
        set (val) {
          this.$store.dispatch('updateUserSettingsSync', {chat_sound_uid: val})
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-chat-bell-menu {
    .b-menu-items {
      @menu-height: calc(100vh~'-'2 * @navbar-height);
      max-height: @menu-height;
      padding: 0 !important;
      .vb, .b-scroll {
        max-height: @menu-height;
      }
      .b-scroll {
        min-width: calc(100% + 17px);
        padding: 5px 0;
      }
      .m-row {
        .b-checkbox {
          width: 100%;
          height: 100%;
        }
        &.e-change-sound {
          color: @basic-blue;
          .hover-mixin();
          padding-left: 35px;
        }
        &.b-sound-option {
          .hover-mixin();
          .c-radio-btn {
            padding-left: 32px;
            width: 100%;
            height: 100%;
            align-items: center;
            max-width: calc(100% ~'-' 50px);
            overflow: hidden;
            .b-icon {
              margin-right: 3px;
            }
            .b-label {
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
        }
      }
    }
  }
</style>
