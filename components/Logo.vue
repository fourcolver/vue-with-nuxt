<template>


  <div>
    <div class="b-logo m-all" v-if="!currentProject">
      <div class="e-logo waves" @click="$emit('click', $event)">
        <div class="b-icon">
          <img src="~assets/img/pad.svg" width="16" height="16">
        </div>
      </div>
      <div class="e-name">
        <span class="e-text">{{ $t('All projects') }}</span>
      </div>
    </div>

    <div class="b-logo" v-if="currentProject">
      <div v-if="cntProjectEvents" class="e-cnt-events">{{ cntProjectEvents }}</div>
      <div v-if="currentProject.has_starred" class="e-star">
        <i class="bu-star"></i>
      </div>
      <div class="e-logo" v-event-class="'click'" @click="$emit('click', $event)">
        <avatar :src="currentProject.logo_url" :size="logoSize" :name="currentProject.name"></avatar>
      </div>
      <div class="e-name">
        <span class="e-text">{{ currentProject.name }}</span>
      </div>
    </div>
  </div>
</template>

<script>
  import Avatar from '~/components/Avatar.vue'

  export default {
    name: 'logo',
    components: {Avatar},
    props: {
      logoSize: {
        'default': 30
      },
      projectUid: {}
    },
    computed: {
      currentProject () {
        if (!this.projectUid) {
          return null
        }
        let project = this.$store.state.projects.find(el => el.uid === this.projectUid.toString())
        return project || null
      },
      projectLetters () {
        let words = this.currentProject.name.split(' ')
        let ret = ''
        for (let k in words.slice(0, 2)) {
          ret += words[k][0]
        }
        return ret
      },
      cntProjectEvents () {
        if (!this.currentProject) return
        let cnt = 0
        let projectEntry = this.$store.state.eventsCounts.find(el => +el.id_project === +this.currentProject.id)
        if (projectEntry) {
          cnt = +projectEntry.count
        }
        return cnt
      }
    }
  }
</script>

<style lang="less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .b-logo {
    @height: @navbar-height;
    width: 100%;
    cursor: default;
    &:after {
      .after-clearfix();
    }
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    .e-cnt-events {
      position: absolute;
      left: 52px;
      bottom: 7px;
      cursor: pointer;
      pointer-events: none;
      z-index: 10;
      .cnt-events-mixin();
    }
    &.m-all .e-logo {
      margin-top: 3px;
      img {
        display: block;
      }
    }
    .e-logo {
      justify-content: center;
      display: flex;
      align-items: center;
      height: @height - 2px;
      width: @height - 2px;
      cursor: pointer;
      border-radius: 50%;
      .expand-hover();
      &:before {
        width: 44px;
        height: 44px;
      }
      .e-logo-letter {
        font-weight: bold;
        margin-left: 10px;
        font-size: 2em !important;
        font-family: "Google Sans", sans-serif;
      }
      .b-avatar {
        img {
          display: block;
        }
      }
    }
    .e-name {
      @name-max-width: 200px;
      @font-size: 15px;
      font-size: @font-size;
      height: 100%;
      max-width: @name-max-width;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      position: absolute;
      left: 100%;
      top: 0;
      padding-left: 10px;
      font-weight: normal;
      visibility: hidden;
      display: flex;
      align-items: center;
      .e-text {
        color: white;
        height: 28px;
        display: inline-block;
        padding: 5px 20px;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 24px;
        .str-truncate;
        min-width: 0;
      }
      .e-arrow {
        margin-left: 2px;
        font-size: .9em;
      }
    }
    .e-star {
      position: absolute;
      bottom: 4px;
      left: 4px;
      color: @red-color;
    }
  }
</style>
