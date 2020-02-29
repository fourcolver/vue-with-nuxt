<template>
  <div class="b-avatar" @click="$emit('click')" :class="{'has-user': !!user, 'm-inactive': !!user && user.is_active === false}"
       @mouseenter="$emit('mouseenter')" @mouseleave="$emit('mouseleave')">
    <img :width="size" :height="size" v-if="_src" :src="_src">
    <div v-else class="e-empty-avatar" :style="{height: size + 'px', width: size + 'px', 'font-size': (Math.floor(size * .43)) + 'px'}"
         :class=" 'm-' + uid ">
      {{ letters }}
    </div>
    <div class="e-online"
         :style="onlineStyle"
         v-if="showOnline && !!user && user.is_active !== false && onlineWidth >= 3"
         :class="{'m-online': isOnline, 'm-timer-online': user && user.is_timer_online, 'm-offline': !isOnline && !(user && user.is_timer_online)}">
      <div class="e-dot"
           :style="{width: (Math.round(onlineWidth * 0.8)) + 'px', height: (Math.round(onlineWidth * 0.8)) + 'px'}"></div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'avatar',
    props: {
      'src': null,
      'size': null,
      'name': null,
      'userId': null,
      'isEmpty': {
        default: false
      },
      'showOnline': {
        default: true
      }
    },
    computed: {
      letters () {
        let ret = ''
        const name = this._name.trim()
        if (!name) {
          return '?'
        }
        let words = name.split(/[-. ]+/)
        const firstWords = words.slice(0, 2)
        if (firstWords && firstWords.length) {
          for (let k in firstWords) {
            if (words[k][0]) {
              ret += words[k][0]
            } else {
              ret = '?'
            }
          }
        }
        return ret
      },
      uid () {
        if (!this._name) {
          return ''
        }
        let num = this._name.toLowerCase().charCodeAt(0).toString()
        return num[num.length - 1]
      },
      user () {
        if (this.userId) {
          return this.$store.getters['getCompanyUser'](this.userId)
        }
      },
      _src () {
        if (this.isEmpty) {
          return ''
        }
        if (this.src) {
          return this.src
        }
        if (this.user && this.user.avatar_url) {
          return this.user.avatar_url
        }
        return ''
      },
      _name () {
        return (this.user && this.user.name ? this.user.name : this.name) || ''
      },
      onlineWidth () {
        return this.size * (this.size > 35 ? 0.2 : 0.4)
      },
      onlinePos () {
        return this.size / 2 + (this.size / 2 * Math.sqrt(2) / 2) - this.onlineWidth / 2
      },
      isOnline () {
        if (!this.userId) {
          return false
        }
        return (this.user && this.user.is_online) || (+this.userId === +this.$store.state.webuser.user.id)
      },
      onlineStyle () {
        return {
          left: this.onlinePos + 'px',
          top: this.onlinePos + 'px',
          width: this.onlineWidth + 'px',
          height: this.onlineWidth + 'px'
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';

  .b-avatar {
    position: relative;
    &.m-inactive {
      filter: grayscale(100%);
    }
    img {
      border-radius: 50%;
      vertical-align: top;
    }
    .e-empty-avatar {
      overflow: hidden;
      border-radius: 50%;
      white-space: nowrap;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #6495ed;
      text-transform: uppercase;
      &.m-1 {
        background: #556b2f;
      }
      &.m-2 {
        background: #cd5c5c;
      }
      &.m-3 {
        background: #ff7f39;
      }
      &.m-4 {
        background: #228b22;
      }
      &.m-5 {
        background: #a0512e;
      }
      &.m-6 {
        background: #ed874f;
      }
      &.m-7 {
        background: #8B008B;
      }
      &.m-8 {
        background: #B22222;
      }
      &.m-9 {
        background: #9400D3;
      }
    }
    .e-online {
      border-radius: 50%;
      position: absolute;
      background: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      &.m-online .e-dot {
        background: @green-color;
      }
      &.m-timer-online .e-dot {
        background: #589ae8;
      }
      &.m-offline .e-dot {
        background: @red-color;
      }
      .e-dot {
        border-radius: 50%;
      }
    }
    &.has-user {
      position: relative;
    }
  }
</style>
