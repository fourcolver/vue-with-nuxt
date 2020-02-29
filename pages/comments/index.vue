<template>
  <div class="comments-index" :class="{disabled, 'm-replying': replyComment.id}">
    <issue-top :issue="issue"></issue-top>
    <div class="b-comments" :class="{'m-hidden': !allCommentsLoaded}">
      <quwi-comment @load="loadComment" v-for="comment, i in comments"
                    @star="starIssue"
                    :comment="comment" :key="comment.id" :next="comments[i + 1]" :prev="comments[i - 1]"
                    :showUser="isShowUser(comment, i)" @reply="c => replyComment = c"
                    :class="{'m-last-level': !comments[i + 1] || comments[i + 1].depth != comment.depth}">
      </quwi-comment>
    </div>
    <div class="b-typing" :class="{'m-hidden': !allCommentsLoaded}">{{ typingMessage }}</div>
    <reply-form :class="{'m-hidden': !allCommentsLoaded}" ref="replyForm"
                :parent="replyComment.id ? replyComment : null"
                v-key-escape="() => cancelReply()" v-click-outside="() => cancelReply()"
                @createComment="cancelReply"
                @editorReady="editorReady"></reply-form>
    <div class="b-bottom-menu" :class="{'m-hidden': !allCommentsLoaded}">
      <issue-menu @remove="disabled = true" :issue="issue"></issue-menu>
      <issue-workers :issue="issue"></issue-workers>
    </div>
    <div v-if="issue.unread_comments" @click="scrollToUnread" v-show="unreadBelow" class="b-unread"
         :class="{'m-hidden': !allCommentsLoaded}">
      <div class="e-unread js-unread-below">{{ unreadBelow }}</div>
      <div class="e-arrow"></div>
    </div>
    <doc-viewer ref="docViewer"></doc-viewer>
  </div>
</template>

<script>
  import TagLabel from '~/components/TagLabel.vue'
  import IssueMenu from '~/components/comments/IssueMenu.vue'
  import FileLink from '~/components/comments/FileLink.vue'
  import IssueStar from '../../components/IssueStar.vue'
  import listeners from '~/utils/mixins/listeners'
  import typing from '~/utils/mixins/typing'
  import { debounce, raiseError } from '~/utils/helpers'
  import ReplyForm from '~/components/comments/ReplyForm.vue'
  import { mapState, mapGetters } from 'vuex'
  import { trimHTML, scrollTo, videosAutoPlay } from '~/utils/dom'
  import DocViewer from '../../components/DocViewer.vue'
  import IssueWorkers from '../../components/comments/IssueWorkers.vue'
  import IssueTop from '../../components/comments/IssueTop.vue'
  import QuwiComment from '../../components/comments/QuwiComment.vue'

  export default {
    components: {
      QuwiComment,
      IssueTop,
      IssueWorkers,
      DocViewer,
      IssueStar,
      TagLabel,
      FileLink,
      IssueMenu,
      ReplyForm
    },
    middleware: 'member',
    mixins: [listeners, typing],
    head () {
      let title = this.issue.number + '. '
      if (this.issue.tag1) {
        title += this.issue.tag1
      }
      if (this.issue.name) {
        title += this.issue.name
      }
      if (!this.issue.tag1 && !this.issue.name) {
        title += this.issue.description || ''
      }
      return {title}
    },
    sockets: {
      typing (data) {
        if ((data.type && data.type !== 'comment') || !data.id_issue || +data.id_issue !== +this.issue.id) {
          return
        }
        this.socketTyping(data)
      },
      async new_issue_comment (data) {
        if (this.$refs.replyForm && this.$refs.replyForm.length && this.$refs.replyForm[0].createCommentPromise) {
          return
        }
        if (data && data.id_issue && data.id_comment && +data.id_issue === this.issue.id) {
          this.$store.dispatch('updateComments', {issue: this.$route.query.issue})
        }
      },
      async delete_issue_comment (data) {
        if (data && data.id_issue && data.id_comment && +data.id_issue === this.issue.id) {
          this.$store.dispatch('updateComments', {issue: this.$route.query.issue})
        }
      }
    },
    data () {
      return {
        loading: false,
        unreadBelow: 0,
        disabled: false,
        replyComment: {},
        cntLoadedComments: 0,
        activeCommentId: null,
        needEditorFocus: false
      }
    },
    computed: {
      ...mapState({
        issue: state => state.Issues.issue,
        screens: state => state.stats.screens,
        screensHeaders: state => state.stats.screensHeaders,
        comments: state => state.comments
      }),
      ...mapGetters({
        'getProject': 'company/getProject',
        'createIssueUrl': 'company/createIssueUrl',
        'createProjectUrl': 'company/createProjectUrl'
      }),
      allCommentsLoaded () {
        return +this.cntLoadedComments === +this.comments.length
      }
    },
    mounted () {
      this.addListener(window, 'scroll', debounce(this.setInputFocus, 20))
      this.addListener(window, 'resize', debounce(this.setInputFocus, 20))
      this.addListener(window, 'resize', this.setUnreadPosition)
      this.addListener(window, 'scroll', () => {
        this.setUnreadPosition()
        this.scrollVideos(this)
      })
      this.setUnreadPosition()
      this.videosAutoPlay()
      this.addListener(document, 'click', this.viewDoc)
      this.readInitComments()
      this.removeHash()
      window.commentsPage = this
    },
    fetch ({store, query, redirect, error, params}) {
      if (!query.issue) {
        redirect(store.getters['company/createProjectUrl']())
      }
      let promises = []
      promises.push(store.dispatch('Issues/loadIssue', query.issue))
      let project
      if (params.project) {
        project = store.getters['company/getProject'](params.project)
        if (project) {
          promises.push(store.dispatch('Issues/updateLastEvents', project.id))
        }
      }
      promises.push(store.dispatch('updateComments', {issue: query.issue}))
      if (!store.state.Issues.priorities.length || process.server) {
        promises.push(store.dispatch('Issues/updatePriorities'))
      }
      return Promise.all(promises).then(() => {
        if (!project || +store.state.Issues.issue.id_project !== +project.id) {
          const correctProject = store.getters['company/getProject'](store.state.Issues.issue.id_project)
          if (correctProject) {
            return redirect(store.getters['company/createIssueUrl']({
              uid: correctProject.uid,
              number: query.issue
            }))
          }
        }
      }).catch((e) => raiseError(error, e))
    },
    asyncData ({store, query}) {
      return store.dispatch('stats/getScreens', {
        filters: {issue_number: query.issue},
        'per-page': 6
      })
    },
    methods: {
      setInputFocus () {
        let list = [...document.querySelectorAll('.b-comment-edit textarea, .b-reply-form textarea')]
        list = list.filter((el) => {
          let rect = el.getBoundingClientRect()
          let top = +(rect.y || rect.top)
          return top >= 0 && top + rect.height < window.innerHeight
        })
        if (list.length === 1) {
          list[0].focus()
        }
      },
      getIssueTitle () {
        if (this.issue.name) return ' - ' + this.issue.name
        else return ''
      },
      goToIssue (issue) {
        const project = this.getProject(issue.id_project)
        this.$router.push(this.createIssueUrl({project: project && project.uid, number: issue.number}))
      },
      readComments () {
        const comments = document.querySelectorAll('.b-comment-wrap.js-unread')
        for (let i = 0; i < comments.length; i++) {
          let rect = comments[i].getBoundingClientRect()
          let top = +(rect.top || rect.y)
          let bottom = top + rect.height
          if ((top > 0 && top < window.innerHeight) || (bottom > 0 && bottom < window.innerHeight)) {
            comments[i].classList.remove('js-unread')
            let id = +comments[i].getAttribute('data-id')
            let storeComment = this.$store.state.comments.find(el => +el.id === id)
            if (storeComment) {
              storeComment.is_read = 1
              if (this.issue.unread_comments > 0) {
                this.issue.unread_comments--
              }
            }
          }
        }
      },
      scrollToUnread () {
        let firstUnread = document.querySelector('.b-comment-wrap.js-unread')
        if (firstUnread) {
          let rect = firstUnread.getBoundingClientRect()
          if (rect) {
            let top = rect.y || rect.top
            if (top) {
              let scroll = top - 60 + window.scrollY
              window.scrollTo(0, scroll > 0 ? scroll : 0)
            }
          }
        }
      },
      setUnreadPosition () {
        const box = document.querySelector('.b-comment .b-box')
        if (box) {
          let rect = box.getBoundingClientRect()
          let unread = document.querySelector('.b-unread')
          if (unread) {
            unread.style.left = ((rect.left || rect.x) - 55) + 'px'
          }
          let unreadBelow = 0
          let allUnread = document.querySelectorAll('.b-comment-wrap.js-unread')
          for (let i = 0; i < allUnread.length; i++) {
            let unreadRect = allUnread[i].getBoundingClientRect()
            if (unreadRect && +(unreadRect.top || unreadRect.y) > window.innerHeight) {
              unreadBelow++
            }
          }
          this.unreadBelow = unreadBelow
        }
      },
      scrollToComment (idComment = null) {
        if (!idComment && this.activeCommentId) {
          idComment = this.activeCommentId
          this.activeCommentId = null
        }
        if (idComment) {
          let commentBlock = document.querySelector(`.js-comment[data-id="${idComment}"]`)
          if (commentBlock) {
            this.$nextTick(() => {
              if (commentBlock.classList.contains('js-init')) {
                window.scroll(0, 0)
              } else {
                scrollTo(commentBlock, -50)
              }
            })
          }
        }
      },
      viewDoc (e) {
        if (e.target.tagName.toLowerCase() === 'a' && e.target.classList.contains('bu-file')) {
          if (e.target.getAttribute('href').match(/\.docx?$/)) {
            this.$refs.docViewer.show(e.target.getAttribute('href'))
            e.preventDefault()
          }
        }
      },
      isShowUser (comment, i) {
        if (comment.is_init) {
          return true
        }
        if (!this.comments[i - 1]) {
          return true
        }
        let prev = this.comments[i - 1]
        if (+prev.depth !== +comment.depth) {
          return true
        }
        return +this.comments[i - 1].id_user !== +comment.id_user
      },
      async cancelReply () {
        if (!this.replyComment || !this.replyComment.id) {
          return
        }
        if (!this.$refs.replyForm.$refs.editor.isEmpty()) {
          await this.$confirm(this.$t('comments.cancel_reply_confirm'))
        }
        this.replyComment = {}
        setTimeout(() => {
          this.$refs.replyForm.$el.style.top = ''
          this.$refs.replyForm.isBordered = false
        })
        let divs = this.$el.querySelectorAll('.c-comment .js-highlight')
        if (divs && divs.length) {
          divs.forEach(el => {
            el.classList.remove('js-highlight')
            el.classList.remove('m-highlight')
          })
        }
        this.$refs.replyForm.resetComment()
      },
      scrollVideos: debounce((vm) => {
        vm.videosAutoPlay()
      }, 500),
      videosAutoPlay () {
        videosAutoPlay(this.$el.querySelectorAll('video.bu-video'))
      },
      readInitComments () {
        let comments = this.$store.state.comments.filter(el => el.is_init)
        comments.forEach(el => {
          if (!el.is_read) {
            this.$api.put('events/read-by-comment', {id_comment: el.id})
          }
        })
      },
      removeHash () {
        let m = window.location.hash.match(/comment_(\d+)/)
        if (m) {
          this.activeCommentId = m[1]
          history.pushState('', document.title, window.location.pathname + window.location.search)
        }
      },
      loadComment () {
        this.cntLoadedComments++
      },
      starIssue () {
        this.$store.dispatch('Issues/setStarred', {id: this.issue.id, is_starred: true})
        this.issue.is_starred = true
      },
      editorReady () {
        this.allCommentsLoaded && this.needEditorFocus && this.focusEditor()
      },
      focusEditor () {
        this.$refs.replyForm.$refs.editor.focus()
      },
      scrollTo
    },
    beforeDestroy () {
      window.onbeforeunload = null
    },
    beforeRouteEnter (to, from, next) {
      next(vm => {
        if (from && from.matched.length && !/comment_\d+/.test(vm.$route.hash)) {
          vm.needEditorFocus = true
          if (vm.allCommentsLoaded) {
            vm.focusEditor()
          }
        }
      })
    },
    beforeRouteLeave (to, from, next) {
      if (this.$store.state.sidebarForceShow) {
        this.$store.commit('SET_SIDEBAR_FORCE_SHOW', false)
        this.$store.commit('Issues/REMOVE_FILTER', 'tag')
      }
      const commentEditor = document.querySelector('#editor-element')
      if (commentEditor) {
        const editorHTML = trimHTML(commentEditor.innerHTML)
        if (editorHTML.length) {
          if (confirm(this.$t('There are unsaved comments on this page. Discard changes?'))) {
            next()
          }
        } else {
          next()
        }
      } else {
        next()
      }
    },
    beforeRouteUpdate (to, from, next) {
      const commentEditor = document.querySelector('#editor-element')

      if (commentEditor) {
        const editorHTML = trimHTML(commentEditor.innerHTML)
        if (editorHTML.length) {
          if (confirm(this.$t('There are unsaved comments on this page. Discard changes?'))) {
            this.$refs.replyForm.$refs.editor.clear()
            this.cancelReply()
            next()
          } else {
            next(false)
          }
        } else {
          this.cancelReply()
          next()
        }
      } else {
        next()
      }
    },
    watch: {
      '$route.query.issue': function (val) {
        this.$nuxt.$loading.start()
        this.loading = true
        this.removeHash()
        this.cntLoadedComments = 0
        this.needEditorFocus = false

        return Promise.all([
          this.$store.dispatch('Issues/loadIssue', val),
          this.$store.dispatch('updateComments', {issue: val})
        ]).then(() => {
          this.readInitComments()
          this.loading = false
          this.$nuxt.$loading.finish()
        })
      },
      allCommentsLoaded: function (val) {
        if (val) {
          this.scrollToComment()
          if (this.needEditorFocus) {
            this.$nextTick(() => this.focusEditor())
          }
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .comments-index {
    @col-right-width: 42px;
    &.disabled {
      opacity: .5;
      pointer-events: none;
    }
    > .b-comments {
      @outer-border-radius: 6px;
      .c-comment:first-child > .b-inner > .b-box {
        border-top-left-radius: @outer-border-radius;
        border-top-right-radius: @outer-border-radius;
      }
      .c-comment:last-child > .b-inner > .b-box {
        border-bottom-left-radius: @outer-border-radius;
        border-bottom-right-radius: @outer-border-radius;
      }
    }
    > .b-bottom-menu {
      width: @comments-width;
      margin: 0 auto 90px auto;
      position: relative;
    }
    > .b-unread {
      height: auto;
      position: fixed;
      bottom: 20px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      padding: 7px;
      &:hover {
        background: @hover-dark;
      }
      .e-unread {
        background: @red-color;
        color: white;
        border-radius: 50%;
        font-size: 0.75em;
        padding: 2px;
        width: 17px;
        height: 17px;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
      }
      .e-arrow {
        width: 20px;
        height: 20px;
        border-color: @red-color;
        border-style: solid;
        /* border-bottom-width: 0; */
        /* border-top-width: 0; */
        border-top: none;
        border-left: none;
        transform: rotate(45deg);
        border-width: 3px;
        position: relative;
        top: -3px;
      }
    }
    .b-typing {
      width: @comments-width;
      margin: 10px auto;
      padding-left: 3px;
      position: relative;
      font-size: .9em;
      height: 15px;
      pointer-events: none;
    }
    &.m-replying {
      .c-comment {
        .b-reply {
          display: none !important;
        }
      }
    }
    .m-hidden {
      visibility: hidden !important;
    }
  }
</style>
