<template>
  <div class="c-comment js-comment" @click="read"
       :class="{['m-level-' + comment.depth]: true, 'm-system': comment.type === 'system' || !comment.is_active, 'm-unread': !comment.is_read && +comment.id_user !== +$store.state.webuser.user.id && !comment.is_init, 'js-init': comment.is_init}"
       :data-id="comment.id">
    <div class="b-inner">
      <div class="b-box" :class="{'no-top': prev && prev.depth == 1, 'no-bottom': next && next.depth == 1}">
        <slot name="header"></slot>
        <div class="b-main">
          <div class="b-left">
            <user-menu v-if="showUser" size="30" :userId="comment.id_user"></user-menu>
          </div>
          <div class="b-center" :class="{'m-can-reply': canReply, 'm-edited': comment.is_edited}" ref="center">
            <user-menu v-if="showUser" type="name" :userId="comment.id_user"></user-menu>
            <editor-text ref="commentText" class="b-text js-text"
                         :is_read="comment.is_read"
                         :text="comment.is_active ? comment.text : $t('comment.comment_deleted')"
                         :starred="comment.sections"
                         :files="comment.comment_files" @load="$emit('load')"></editor-text>
            <div class="e-edited" v-if="comment.is_edited">{{ $t('comment.edited') }}</div>
          </div>
          <div class="b-right" @mousemove="setToolbarPosition" @mouseout="removeAllHovers">
            <template v-if="+comment.id_user === +$store.state.webuser.user.id">
              <div class="b-seen" v-if="comment.seen_by.length">
                <context-menu trigger="hover" direction="left" :delay="1000">
                  <div slot="content">
                    <div class="e-check">
                      <i class="bu-check-double"></i>
                    </div>
                  </div>
                  <div slot="items" class="b-faces">
                    <div class="b-row" v-for="user in comment.seen_by" :key="user.id">
                      <avatar class="e-face" :userId="user.id" size="25" :title="user.name"></avatar>
                      <div class="e-name">{{ capitalize(user.name) }}</div>
                    </div>

                  </DIV>
                </context-menu>
              </div>
              <div class="e-check" v-else>
                <i class="bu-check-single"></i>
              </div>
            </template>
            <div class="e-device" v-if="comment.device && comment.device !== 'desktop'">
              <i class="bu-windows" v-if="comment.device.toLowerCase() === 'windows' "></i>
              <i class="bu-android" v-if="comment.device.toLowerCase() === 'android' "></i>
              <i class="bu-mail-alt" v-if="comment.device.toLowerCase() === 'email' "></i>
            </div>
            <div class="e-date" v-if="!canEdit">{{ $dateAgo(comment.dta_create) }}</div>
            <context-menu direction="left" trigger="hover" delay="300" class="b-edit-menu" :autoClose="true" v-else>
              <div class="e-date m-active" slot="content">{{ $dateAgo(comment.dta_create) }}</div>
              <div slot="items">
                <div class="b-item" @click="edit">{{ $t('comment.edit') }}</div>
                <div class="b-item" @click="remove" v-if="!comment.is_init">
                  {{ $t('comment.delete') }}
                </div>
              </div>
            </context-menu>
            <div class="b-toolbar" ref="toolbar" v-if="canReply">
              <div class="e-reply" @click.stop="reply">
                <i class="bu-reply"></i>
              </div>
              <div class="e-star" @click.stop="star" ref="starBtn">
                <i class="bu-star"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Avatar from '../Avatar.vue'
  import ContextMenu from '../ContextMenu.vue'
  import { capitalize } from '~/utils/helpers'
  import UserMenu from '../UserMenu.vue'
  import { scrollTo } from '~/utils/dom'
  import EditorText from '../EditorText.vue'

  export default {
    components: {
      EditorText,
      UserMenu,
      ContextMenu,
      Avatar
    },
    name: 'quwi-comment',
    data () {
      return {}
    },
    props: {
      comment: null,
      prev: null,
      next: null,
      showUser: {
        type: Boolean,
        default: false
      }
    },
    methods: {
      setToolbarPosition (e) {
        if (!this.$refs.toolbar) {
          return
        }
        let index = -1
        let children = this.$refs.commentText.$el.children
        if (!children || !children.length) {
          return
        }

        index = Array.from(children).findIndex((item) => {
          if (item.classList.contains('js-empty')) {
            return null
          }

          let rect = item.getBoundingClientRect()

          return rect.top < e.clientY && rect.bottom > e.clientY
        })

        for (let i = 0; i < children.length; i++) {
          if (children[i].classList.contains('js-empty')) {
            continue
          }
          children[i].classList.remove('m-hover')
        }

        if (index === -1) {
          this.removeAllHovers()
          this.$refs.toolbar.style.display = 'none'
          this.$refs.center.classList.remove('js-toolbar-active')
          return
        } else {
          children[index].classList.add('m-hover')
        }

        this.$refs.toolbar.style.display = ''
        this.$refs.toolbar.setAttribute('data-paragraph', index)
        const rect = children[index].getBoundingClientRect()
        const parentRect = this.$refs.commentText.$el.getBoundingClientRect()
        let bottom = parentRect.bottom - (rect.bottom < window.innerHeight ? rect.bottom : window.innerHeight - 10)
        if (this.$refs.center.classList.contains('m-edited')) {
          bottom += 14
        }
        if (this.$refs.center.querySelector('.c-audio-player')) {
          bottom += 10
        }
        this.$refs.toolbar.style.bottom = bottom + 'px'
        this.$refs.center.classList.add('js-toolbar-active')
        if (children[index].classList.contains('js-starred')) {
          this.$refs.starBtn.classList.add('m-active')
        } else {
          this.$refs.starBtn.classList.remove('m-active')
        }
      },
      removeAllHovers () {
        let children = this.$refs.commentText.$el.children
        if (children && children.length) {
          for (let i = 0; i < children.length; i++) {
            children[i].classList.remove('m-hover')
          }
        }
      },
      reply () {
        const replyForm = this.$parent.$refs.replyForm
        let form = replyForm.$el
        this.$parent.$refs.replyForm.isBordered = true
        form.style.position = 'relative'
        form.style.top = '-' + (form.getBoundingClientRect().top - (parseFloat(form.style.top) || 0) - 40 - this.$refs.toolbar.getBoundingClientRect().top) + 'px'
        if (form.getBoundingClientRect().bottom > window.innerHeight) {
          window.scroll(window.scrollX, window.scrollY + form.getBoundingClientRect().bottom - window.innerHeight)
        }
        replyForm.resetComment()
        replyForm.$refs.editor.focus()
        replyForm.$refs.editor.editor.updateInitialStates()
        let index = +this.$refs.toolbar.getAttribute('data-paragraph') || 0
        let div = this.getSectionDiv(index)
        let uid = div ? div.getAttribute('data-uid') : null
        this.highlightParagraph(index)
        this.$emit('reply', {
          id: this.comment.id,
          uid_section: uid
        })
      },
      star () {
        let div = this.getSectionDiv(+this.$refs.toolbar.getAttribute('data-paragraph') || 0)
        if (div && div.getAttribute('data-uid')) {
          const isStarred = !div.classList.contains('js-starred')
          this.$api.put('comments/starred-section?id=' + this.comment.id, {
            uid_section: div.getAttribute('data-uid'),
            is_starred: isStarred
          })
          if (isStarred) {
            div.classList.add('js-starred')
            this.$refs.starBtn.classList.add('m-active')
            this.$emit('star')
          } else {
            div.classList.remove('js-starred')
            this.$refs.starBtn.classList.remove('m-active')
          }
        }
      },
      read () {
        if (this.comment.is_read) {
          return
        }
        this.comment.is_read = 1
        this.apiRead(this, this.comment)
      },
      async remove () {
        await this.$confirm(this.$t('comment.delete_confirm'))
        this.$api.delete('comments/' + this.comment.id).then(() => {
          this.$store.dispatch('updateComments', {issue: this.$route.query.issue})
        })
      },
      edit () {
        this.$parent.$refs.replyForm.edit(this.comment)
      },
      getSectionDiv (index) {
        return this.$el.querySelector(`.js-text > div:nth-child(${index + 1})`)
      },
      highlightParagraph (index) {
        let div = this.getSectionDiv(index)
        if (div) {
          div.classList.add('m-highlight')
          div.classList.add('js-highlight')
        }
      },
      apiRead () {
        this.$api.put('events/read-by-comment', {id_comment: this.comment.id})
      },
      capitalize,
      scrollTo
    },
    computed: {
      author () {
        return this.$store.getters.getCompanyUser(this.comment.id_user) || {}
      },
      canReply () {
        return this.comment.type === 'simple' && +this.comment.id_user !== +this.$store.state.webuser.user.id
      },
      canEdit () {
        return this.comment.type === 'simple' && this.comment.is_active && +this.comment.id_user === +this.$store.state.webuser.user.id
      }
    },
    watch: {
      'comment.text': {
        handler: function (val) {
          this.$refs.commentText.prepareContent()
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-comment {
    width: 100%;
    transition: background 1s linear;
    > .b-inner {
      width: @comments-width;
      margin: auto;
      .b-box {
        transition: background 1s linear;
        > .b-main {
          display: flex;
          padding-top: 10px;
          padding-bottom: 10px;
          padding-right: 15px;
          > .b-left {
            width: 45px;
          }
          > .b-center {
            flex: 1;
            word-wrap: break-word;
            .e-name {
              color: @basic-blue;
              margin-bottom: 6px;
            }
            .b-text {
              overflow-wrap: anywhere;
              word-break: break-word;
              .m-highlight {
                background: #ededed;
                border-radius: 2px;
              }
            }
            &.m-can-reply + .b-right:hover {
              .b-toolbar {
                display: flex;
              }
            }
            &.m-can-reply.js-toolbar-active + .b-right:hover {
              .e-date, .e-check, .b-seen, .e-device {
                display: none;
              }
            }
            &.m-can-reply {
              .b-text > div.m-hover {
                background: #eee;
                border-radius: 2px;
                width: calc(100% ~'+' 75px);
                padding-right: 75px;
              }
            }
            .e-edited {
              font-size: .8em;
              color: #6f6f6f;
              height: 14px;
            }
          }
          > .b-right {
            width: 75px;
            min-height: 16px;
            display: flex;
            justify-content: flex-end;
            align-items: flex-start;
            margin-top: 1px;
            position: relative;
            .e-date, .e-device {
              font-size: .8em;
              white-space: nowrap;
              color: #6f6f6f;
            }
            .e-date.m-active {
              color: @basic-blue;
              cursor: pointer;
            }
            .b-edit-menu {
              .b-menu-content {
                .e-date {
                  top: -1px;
                  position: relative;
                }
              }
              .b-menu-items {
                padding: 5px 0;
                .b-item {
                  padding: 10px 15px;
                  .hover-mixin();
                }
              }
            }
            .e-check {
              color: @green-color;
            }
            .e-check, .e-device {
              margin-right: 5px;
            }
            > .b-seen {
              .e-check {
                cursor: default !important;
              }
              .b-menu-items {
                padding: 10px;
                .b-faces {
                  max-width: 400px;
                  .b-row {
                    display: flex;
                    overflow: hidden;
                    align-items: center;
                    &:not(:last-child) {
                      margin-bottom: 10px;
                    }
                    > .b-avatar {
                      margin-right: 7px;
                    }
                    > .e-name {
                      display: inline;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    }
                  }
                }
              }
            }
            .b-toolbar {
              display: none;
              border-radius: 3px;
              border: 1px solid #ccc;
              box-shadow: @image-shadow;
              position: absolute;
              user-select: none;
              margin-left: 3px;
              background: #fff;
              > div {
                padding: 3px 5px;
                cursor: pointer;
                .hover-mixin();
                &.e-star {
                  &.m-active {
                    color: @red-color;
                  }
                }
              }
            }
          }
        }
      }
    }
    &.m-level-1 {
      > .b-inner {
        .b-box {
          background: #fff;
          &.no-top {
            border-top: none;
            border-top-left-radius: 0;
            border-top-right-radius: 0;
          }
          &.no-bottom {
            border-bottom: none;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
          }
          .b-main {
            padding: 15px 15px 15px 50px;
          }
        }
      }
      &:first-child > .b-inner .b-box .b-main {
        padding-top: 30px;
      }
      &.m-last-level > .b-inner .b-box .b-main {
        padding-bottom: 30px;
      }
    }
    &:not(.m-level-1) {
      @border: 1px solid #dedede;
      > .b-inner {
        padding-left: 5px;
        .b-box {
          background: #fafafa;
        }
      }
      .b-main {
        padding-left: 125px;
      }
      &:last-child {
        > .b-inner {
          .b-box {
            border-bottom: @border;
            padding-bottom: 10px;
          }
        }
      }
    }
    &.m-unread {
      background: #69a2ef;
      > .b-inner {
        .b-box {
          background: #e1ecfc;
        }
      }
    }
    &.m-level-2 {
      .b-main {
        padding-left: 80px;
      }
    }
    &.m-level-3 {
      .b-main {
        padding-left: 125px;
      }
    }
    &.m-system {
      .b-main .b-center .b-text {
        color: @green-color;
        font-size: 0.9em;
        font-style: italic;
      }
    }
  }
</style>
