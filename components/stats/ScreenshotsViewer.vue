<template>
  <div v-if="visible && screen.id" class="c-screenshots-viewer" v-key-escape="hide">
    <div class="b-overlay" @click="hide()">
      <div class="b-top">
        <div class="b-left" v-if="user">
          <div class="b-user">
            <avatar :userId="user.id" size="35"></avatar>
            <div class="b-info">
              <div class="e-name">{{ user.name }}</div>
              <div class="e-task" v-if="screen.working_on">
                <span v-if="screen.issue_number">#{{ screen.issue_number}} </span>
                <span>{{ screen.working_on}}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="b-right">
          <div class="e-close" @click="hide()"><span>&times;</span></div>
        </div>
      </div>
      <div class="b-main-wrap">
        <div class="b-main">
          <div class="b-img-data" v-show="imgDataVisible">
            <div class="b-left">
              <div class="e-time">{{ formatDate(screen.dta, 'D MMM H:mm', $i18n.locale) }}</div>
              <div class="b-keyboard" v-if="screen.activity_keyboard !== null">
                <div class="e-icon">
                  <i class="bu-keyboard"></i>
                </div>
                <div class="b-bar">
                  <progress-bar :percent="+screen.activity_keyboard"></progress-bar>
                </div>
                <div class="e-number">{{ Math.floor(+screen.activity_keyboard)}}</div>
              </div>
              <div class="b-mouse" v-if="screen.activity_mouse !== null">
                <div class="e-icon">
                  <i class="bu-mouse"></i>
                </div>
                <div class="b-bar">
                  <progress-bar :percent="+screen.activity_mouse"></progress-bar>
                </div>
                <div class="e-number">{{ Math.floor(+screen.activity_mouse)}}</div>
              </div>
            </div>
            <div class="b-right">
              <div class="b-check" v-if="selectable" @click.stop="">
                <checkbox :model="screen.selected" @change="selectionChange()"></checkbox>
              </div>
              <div class="e-download">
                <i @click.stop="download" class="bu-down"></i>
              </div>
            </div>
          </div>
          <div class="b-image-wrap">
            <div class="b-left" :class="{hidden: isFirst}" @click.stop="prev">
              <i class="bu-left-dir"></i>
            </div>
            <div class="b-image">
              <protected-image @click.native.self="hide()" :src="screen.sizes.file.url"></protected-image>
            </div>
            <div class="b-right" @click.stop="next" :class="{hidden: isLast}">
              <i class="bu-right-dir"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import ProtectedImage from '~/components/ProtectedImage.vue'
  import Avatar from '~/components/Avatar.vue'
  import { formatDate } from '~/utils/time'
  import ProgressBar from '~/components/ProgressBar.vue'
  import listeners from '~/utils/mixins/listeners'
  import Checkbox from '../Checkbox.vue'
  import { addPrefetchLink } from '~/utils/dom'

  export default {
    components: {
      Checkbox,
      ProgressBar,
      Avatar,
      ProtectedImage
    },
    name: 'screenshots-viewer',
    mixins: [listeners],
    props: {
      screens: {
        default: () => []
      },
      headers: {
        default: () => {}
      },
      currentUser: {
        default: () => {}
      },
      hideOnScroll: {
        default: true
      },
      isLoadMore: {
        default: false
      },
      selectable: {
        default: false
      },
      prefetch: {
        default: false
      },
      singlePage: {
        default: false
      }
    },
    data () {
      return {
        visible: false,
        screen: {},
        loading: false,
        loadingDirection: '',
        imgDataVisible: false
      }
    },
    methods: {
      show (screen) {
        this.screen = this.screens.find(el => +el.id === +screen.id)
        this.visible = true
        this.$nextTick(() => {
          const img = this.$el.querySelector('.b-image img')
          if (img) {
            if (img.complete) {
              this.imgDataVisible = true
            } else {
              img.onload = () => {
                this.imgDataVisible = true
              }
            }
          }
        })
      },
      hide () {
        if (this.visible) {
          this.screen = {}
          this.visible = false
        }
      },
      getScreenUrl (screen) {
        const url = screen.sizes.file.url
        return url + (url.indexOf('?') === -1 ? '?' : '&') + 'access_token=' + this.$store.state.webuser.tokens.access_token
      },
      download () {
        window.open(this.getScreenUrl(this.screen) + '&download=1', '_self')
      },
      prev () {
        if (!this.visible || this.loading || this.isFirst) {
          return
        }
        if (this.screenIndex > 0) {
          this.screen = this.screens[this.screenIndex - 1]
        } else {
          this.loading = true
          this.loadingDirection = 'prev'
          this.$emit('prev')
        }
      },
      next () {
        if (!this.visible || this.loading || this.isLast) {
          return
        }
        if (this.screenIndex < this.screens.length - 1) {
          this.screen = this.screens[this.screenIndex + 1]
        } else {
          this.loading = true
          this.loadingDirection = 'next'
          this.$emit('next')
        }
      },
      selectionChange (selected) {
        this.$set(this.screen, 'selected', !this.screen.selected)
        this.$store.commit('stats/UPDATE_SCREEN', {id: this.screen.id, selected: this.screen.selected})
      },
      prefetchScreens () {
        this.screens.filter(el => !el.preloaded).forEach(el => {
          addPrefetchLink(this.getScreenUrl(el))
          el.preloaded = 1
        })
      },
      formatDate
    },
    computed: {
      screenIndex () {
        const screen = this.screens.find(el => +el.id === +this.screen.id)
        return screen ? this.screens.indexOf(screen) : -1
      },
      isFirst () {
        if (this.isLoadMore) {
          return +this.screen.id === +this.screens[0].id
        }
        return this.screenIndex === 0 && +this.headers['x-pagination-current-page'] === 1
      },
      isLast () {
        if (this.singlePage) {
          return this.screenIndex === this.screens.length - 1
        }
        const cntPages = +this.headers['x-pagination-page-count']
        const perPage = +this.headers['x-pagination-per-page']
        const total = this.headers['x-pagination-total-count']
        let lastIndex
        if (this.isLoadMore) {
          lastIndex = this.screens.length - 1
        } else {
          lastIndex = total - perPage * (cntPages - 1) - 1
        }
        return this.screenIndex === lastIndex && +this.headers['x-pagination-current-page'] === cntPages
      },
      user () {
        if (!this.screen) {
          return null
        }
        const user = this.$store.state.companyUsers.find(el => +el.id === +this.screen.id_user)
        if (user) {
          return user
        } else if (this.currentUser && this.currentUser.id) {
          return this.currentUser
        }
      }
    },
    mounted () {
      window.screenViewer = this
      if (this.hideOnScroll) {
        this.addListener(window, 'scroll', () => this.hide())
      }
      this.addListener(document, 'keydown', e => {
        if (e.key === 'ArrowRight') {
          this.next()
        } else if (e.key === 'ArrowLeft') {
          this.prev()
        }
      })
    },
    watch: {
      screens (val, old) {
        if (old && val.length === old.length) {
          return
        }
        if (this.screen && val.length) {
          if (this.isLoadMore) {
            this.screen = val[this.screenIndex + 1]
          } else {
            let isNextPage
            if (this.loadingDirection) {
              isNextPage = this.loadingDirection === 'next'
            } else {
              isNextPage = +(new Date(this.screen.dta)) >= +(new Date(val[0].dta))
            }
            if (isNextPage) {
              this.screen = val[0]
            } else {
              this.screen = val[val.length - 1]
            }
          }
        }
        if (this.prefetch) {
          this.prefetchScreens()
        }
        this.loading = false
        this.loadingDirection = ''
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';

  .c-screenshots-viewer {
    @top-height: 46px;
    @top-margin: 20px;
    @black-hover: rgba(0, 0, 0, .4);
    @arrow-width: 46px;
    @img-v-margins: 2 * (@top-height + @top-margin);
    @img-h-margins: 2 * @arrow-width;
    user-select: none;
    .b-overlay {
      z-index: 9999;
      height: 100%;
      width: 100%;
      position: fixed;
      top: 0;
      left: 0;
      overflow: hidden;
      background-color: rgba(0, 0, 0, 0.7);
      touch-action: none;
      .b-top {
        height: @top-height;
        display: flex;
        align-items: center;
        padding: 0 10px;
        color: #fff;
        > .b-left {
          flex: 1;
          .b-user {
            display: flex;
            .b-avatar {
              margin-right: 10px;
              img {
                display: block;
              }
            }
            .b-info {
              justify-content: center;
              display: flex;
              flex-direction: column;
              font-size: .9em;
              .e-name {
                margin-bottom: 2px;
                font-weight: bold;
              }
              .e-task {
                color: #ccc;
              }
            }
          }
        }
        > .b-right {
          .e-close {
            @size: 32px;
            font-size: @size;
            width: @size;
            line-height: @size;
            text-align: center;
            cursor: pointer;
            &:hover {
              background-color: @black-hover;
            }
          }
        }
      }
      .b-main-wrap {
        position: absolute;
        width: 100vw;
        height: calc(100vh ~'-' @top-height);
        display: flex;
        align-items: center;
        justify-content: center;
        top: @top-height;
        left: 0;
        .b-main {
          .b-img-data {
            color: #fff;
            display: flex;
            height: 32px;
            align-items: center;
            font-size: .8em;
            margin: 0 @arrow-width;
            > .b-left {
              flex: 1;
              display: flex;
              height: 100%;
              align-items: center;
              > .b-keyboard, .b-mouse {
                display: flex;
                height: 100%;
                align-items: center;
                .e-icon {
                  color: #ccc;
                  i:before {
                    width: 1.4em;
                  }
                }
                .b-bar {
                  margin: 0 8px;
                  .c-progress-bar {
                    .e-bar {
                      width: 75px;
                      border-radius: 2px;
                      background: #414141;
                      height: 6px;
                      .e-fill {
                        border-radius: 2px;
                        background: #ccc;
                      }
                    }
                  }
                }
              }
              .e-time {
                margin-left: 5px;
                min-width: 29px;
              }
              .e-time, .b-keyboard {
                margin-right: 20px;
              }
            }
            > .b-right {
              display: flex;
              align-items: center;
              .b-check {
                margin-right: 5px;
                font-size: 1.3em;
              }
              .e-download {
                @size: 24px;
                font-size: 17px;
                line-height: @size;
                width: @size;
                text-align: center;
                cursor: pointer;
                &:hover {
                  background: @black-hover;
                }
              }
            }
          }
          .b-image-wrap {
            display: flex;
            > .b-left, .b-right {
              width: @arrow-width;
              display: flex;
              align-items: center;
              justify-content: center;
              &.hidden {
                visibility: hidden;
              }
              &:hover {
                background: rgba(0, 0, 0, .2);
                cursor: pointer;
              }
              i {
                color: #fff;
                font-size: 1.4em;
              }
            }
          }
          img {
            user-select: none;
            cursor: pointer;
            max-width: calc(100vw ~'-' @img-h-margins);
            max-height: calc(100vh ~'-' @img-v-margins);
            display: block;
          }
        }
      }
    }
  }
</style>