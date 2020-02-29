<template>
  <div class="c-issues-menu">
    <context-menu :autoClose="true" ref="gearMenu" trigger="click">
      <div class="e-content" slot="content">
        <i class="bu-gear"></i>
      </div>
      <div slot="items">
        <div class="b-options">
          <div class="e-option" :class="{active: thumbOption === 'big'}" @click="setThumbs('big')">
            {{ $t('Big thumbnails')}}
          </div>
          <div class="e-option" :class="{active: !thumbOption}" @click="setThumbs('')">
            {{ $t('Small thumbnails')}}
          </div>
          <div class="e-option" :class="{active: thumbOption === 'hide'}" @click="setThumbs('hide')">
            {{ $t('Hide thumbnails') }}
          </div>
          <div class="e-option" :class="{active: thumbOption === 'subject'}" @click="setThumbs('subject')">
            {{ $t('Only subject') }}
          </div>
        </div>
        <checkbox :label="$t('New events on top')"
                  v-model="$store.state.userSettings.tasks_with_event_on_top" :value="1"
                  @change="val => setIsRead(val)"></checkbox>
        <checkbox v-if="$store.getters['Issues/getFilter']('is_open')" :label="$t('issues_menu.group_tasks')"
                  v-model="groupTasks" :value="1"></checkbox>

        <checkbox :label="$t('issues_menu.show_files')" v-model="showFiles" :value="1"></checkbox>
      </div>
    </context-menu>
  </div>
</template>

<script>
  import ContextMenu from '../ContextMenu.vue'
  import Checkbox from '../Checkbox.vue'

  export default {
    components: {
      Checkbox,
      ContextMenu
    },
    name: 'issues-menu',
    data () {
      return {}
    },
    methods: {
      setThumbs (option) {
        this.$store.dispatch('updateUserSettings', {issues_thumb: option})
      },
      setIsRead (val) {
        this.$store.dispatch('updateUserSettings', {tasks_with_event_on_top: +val})
          .then((res) => {
            this.$store.dispatch('Issues/fetch')
          })
      }
    },
    computed: {
      thumbOption () {
        return this.$store.state.userSettings.issues_thumb
      },
      showFiles: {
        get () {
          return this.$store.state.userSettings.is_show_files_section
        },
        set (val) {
          this.$store.dispatch('updateUserSettings', {is_show_files_section: +val})
        }
      },
      groupTasks: {
        get () {
          return !this.$store.state.userSettings.grouping_disabled
        },
        set (val) {
          this.$store.dispatch('updateUserSettings', {grouping_disabled: +!val}).then(res => this.$store.dispatch('Issues/fetch'))
        }
      }
    },
    mounted () {
      window.issuesMenu = this
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-issues-menu {
    .b-context-menu {
      .b-menu-items {
        @v-padding: 7px;
        @h-padding: 20px;
        right: 0;
        left: auto;
        min-width: 200px;
        font-weight: normal;
        padding: 5px 0;
        .b-options {
          .e-option {
            .hover-mixin(true);
            padding: @v-padding @h-padding;
            &:hover, &.active {
              color: @red-color;
            }
          }
        }
        .b-checkbox {
          .hover-mixin(true);
          padding: @v-padding @h-padding - 3;
          display: block;
          width: 100%;
        }
      }
    }
  }
</style>
