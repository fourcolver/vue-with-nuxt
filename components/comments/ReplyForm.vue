<template>
  <div class="b-reply-form">
    <div class="b-editing" v-if="comment.id">{{ $t('replyform.editing', {date: $date(comment.dta).format('D MMM YYYY')})
      }}
    </div>
    <div class="b-middle">
      <div class="b-input">
        <no-ssr>
          <quwi-editor class="quwi-comment-editor" ref="editor"
                       @input="editorInput"
                       @pasteImage="editorPasteImage"
                       @updateImage="editorUpdateImage"
                       @pasteFile="editorPasteFile"
                       @pasteVideo="editorPasteVideo"
                       @keypress="editorKeyPress"
                       @addCustomColor="editorAddCustomColor"
                       @preventUpload="editorPreventUpload"
                       @editorReady="$emit('editorReady')"
                       :custom-colors="editorCustomColors"
                       :options="computedEditorOptions"
          />
          <quwi-editor-placeholder :options="computedEditorOptions" slot="placeholder" />
        </no-ssr>

        <context-menu direction="left" trigger="hover" v-if="!sending && checkAccess('disc_space')" :delay="1000"
                      class="b-send-button">
          <div slot="content" class="b-icon" style="height: 40px;" @click="addComment">
            <i class="bu-send-plane"></i>
          </div>
          <div slot="items">
            <a class="e-link" :class="{'selected': userSettings.submit_key === 'enter'}"
               @click="updateSubmitKey('enter')">{{ $t('Send by Enter') }}</a>
            <a class="e-link" :class="{'selected': userSettings.submit_key === 'ctrl+enter'}"
               @click="updateSubmitKey('ctrl+enter')">{{ $t('Send by CTRL+Enter') }}</a>
          </div>
        </context-menu>
        <i class="bu-circle-notch m-spin" v-if="sending"></i>
        <div class="b-send-button inactive" v-tooltip="noDiscHint" v-if="!checkAccess('disc_space')">
          <div class="b-icon">
            <i class="bu-send-plane"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import TextareaAutosize from '../TextareaAutosize.vue'
  import { setCaretPosition, getInputSelection, trimHTML, scrollTo } from '~/utils/dom'
  import { editorTransformHTML, editorHydrate } from '~/utils/editor'
  import UploadButton from '../UploadButton.vue'
  import Markdown from '~/utils/mixins/markdown'
  import Editor from '~/utils/mixins/editor'
  import ContextMenu from '../ContextMenu.vue'
  import { mapState, mapGetters } from 'vuex'
  import { debounce } from 'lodash'
  import { getNoDiscHint } from '~/utils/issues'
  import { showUpgradeDialog } from '~/utils/plan'
  import { clearString } from '~/utils/helpers'

  const defaultComment = () => ({
    'text': '',
    'imgs': [],
    'files': []
  })

  export default {
    name: 'reply-form',
    components: {
      UploadButton,
      TextareaAutosize,
      ContextMenu
    },
    mixins: [Markdown, Editor],
    props: ['parent'],
    data () {
      return {
        comment: defaultComment(),
        removeImgAttempts: 0,
        sending: false,
        uploadPromises: [],
        isBordered: false,
        editorOptions: {
          minHeight: 51,
          editMarginTop: 0,
          editMarginLeft: 0,
          editMarginRight: 0,
          width: 0,
          editorControlsLeftTop: -25,
          maxWidth: 758,
          fixedEditorPosition: 46,
          editorPaddingBottom: 15,
          placeholder: this.$t('comment.reply')
        }
      }
    },
    computed: {
      ...mapState({
        userSettings: state => state.userSettings || []
      }),
      ...mapState('Issues', ['issue']),
      ...mapGetters({
        checkAccess: 'webuser/checkAccess'
      }),
      noDiscHint () {
        return getNoDiscHint(this)
      },
      computedEditorOptions () {
        return {
          ...this.editorOptions,
          preventUpload: !this.checkAccess('disc_space'),
          isBordered: this.isBordered,
          texts: {
            'audiorecorder.release_outside': this.$t('audiorecorder.release_outside_editor'),
            'audiorecorder.release': this.$t('audiorecorder.release'),
            'audiorecorder.mic_disabled': this.$t('audiorecorder.mic_disabled')
          }
        }
      }
    },
    mounted () {
      if (!this.$route.hash || this.$route.hash.indexOf('#comment_') === -1) {
        if (this.$refs.input) {
          this.$refs.input.$el.focus()
        }
      }
      window.replyForm = this
    },
    watch: {
      'comment.text': function (val) {
        const trimmedVal = trimHTML(val)
        if (trimmedVal.length || this.comment.id) {
          window.onbeforeunload = e => {
            e.message = this.$t('There are unsaved comments on this page. Discard changes?')
            return this.$t('There are unsaved comments on this page. Discard changes?')
          }
        } else {
          window.onbeforeunload = null
        }
      }
    },
    methods: {
      updateSubmitKey (key) {
        this.$store.dispatch('updateUserSettings', {submit_key: key}).catch(() => {
          alert(this.$t('Operation cannot be done now'))
        })
      },
      clickEnter () {
        if (this.userSettings.submit_key === 'enter') {
          this.addComment()
        } else {
          const selection = getInputSelection(this.$refs.input.$el)
          this.comment.text = clearString(this.comment.text.substring(0, selection.start) + '\n' + this.comment.text.substring(selection.end))
          this.$nextTick(() => {
            setCaretPosition(this.$refs.input.$el, selection.start + 1)
          })
        }
      },
      clickCtrlEnter () {
        if (this.userSettings.submit_key === 'ctrl+enter') {
          this.addComment()
        } else {
          const selection = getInputSelection(this.$refs.input.$el)
          this.comment.text = clearString(this.comment.text.substring(0, selection.start) + '\n' + this.comment.text.substring(selection.end))
          this.$nextTick(() => {
            setCaretPosition(this.$refs.input.$el, selection.start + 1)
          })
        }
      },
      async addComment () {
        if (this.sending || this.$refs.editor.isEmpty() || !this.checkAccess('disc_space')) {
          return
        }
        let comment = this.comment
        await this.$refs.editor.getContent().then(res => {
          comment.text = editorTransformHTML(this.$refs.editor.getSettings(), res.html)
          comment.snippet = res.snippet
        })
        if (comment.text && comment.text.length) {
          this.sending = true
          let vm = this
          let apiCall
          // редактирование
          if (this.comment.id) {
            apiCall = this.$api.put('comments/' + this.comment.id, {
              text: comment.text
            })
          } else {
            if (!this.parent) {
              // создание нового
              apiCall = this.$api.post('comments/create?id_issue=' + this.issue.id, {
                text: comment.text
              })
            } else {
              let url = 'comments/reply?id_comment=' + this.parent.id
              if (this.parent.uid_section) {
                url += '&uid_section=' + this.parent.uid_section
              }
              apiCall = this.$api.post(url, {text: comment.text})
            }
          }
          this.createCommentPromise = apiCall.then((res) => {
            this.$refs.editor.clear()
            let commentId = vm.comment.id
            if (commentId && this.parent) {
              this.$refs.editor.blurEditor()
            }
            vm.comment = defaultComment()
            let updatePromise = vm.$store.dispatch('updateComments', {issue: this.$route.query.issue})
            if (commentId) {
              updatePromise.then(() => {
                let comment = document.querySelector(`.js-comment[data-id="${commentId}"]`)
                if (comment) {
                  scrollTo(comment, -100)
                }
              })
            }
          }).finally(() => {
            vm.sending = false
            window.onbeforeunload = null
            vm.createCommentPromise = null
            this.$emit('createComment')
          })
        }
      },
      emitTyping: debounce(vm => {
        const user = vm.$store.state.webuser.user
        vm.$socket.emit('typing', {
          user: {
            id: user.id,
            name: user.name,
            avatar_url: user.avatar_url
          },
          id_issue: vm.issue.id,
          type: 'comment'
        })
      }, 1000),
      setCommentText: debounce((vm, html) => {
        if (vm.$refs.editor) {
          vm.comment.text = editorTransformHTML(vm.$refs.editor.getSettings(), html)
        }
      }, 1000),
      /* eslint-disable */
      editorInput(html, e) {
        this.setCommentText(this, html)
        this.emitTyping(this)
      },
      editorKeyPress(e) {
        if(e.keyCode === 13 || e.keyCode === 10) {
          if (this.userSettings.submit_key === 'ctrl+enter') {
            if(e.ctrlKey) {
              this.addComment()
              e.preventDefault()
            }
          } else if (this.userSettings.submit_key === 'enter') {
            if(!e.ctrlKey) {
              this.addComment()
              e.preventDefault()
            } else {
              const ev = document.createEvent('Events');
              ev.initEvent('keypress', true, true);
              ev.keyCode = 13;
              ev.which = 13;
              ev.charCode = 13;
              ev.key = 'Enter';
              ev.code = 'Enter';
              ev.needToStopPropagate = true;
              const editorDiv = this.$refs.editor.getEditorDiv();
              editorDiv.dispatchEvent(ev);
            }
          }
        }
      },
      editorPreventUpload () {
        showUpgradeDialog(this)
      },
      /* eslint-enable */
      edit (comment) {
        let d = document.createElement('div')
        d.innerHTML = comment.text
        this.comment = {...comment}
        let editor = this.$refs.editor
        const hydratedHtml = editorHydrate(d, editor)
        editor.setContent(hydratedHtml)
        editor.subscribeAllLoaders()
        editor.files = this.comment.comment_files || []
        scrollTo(editor.$el, -100)
        editor.focus()
        editor.updateInitialStates()
        this.$nextTick(() => {
          window.onbeforeunload = null
        })
      },
      resetComment () {
        this.comment = defaultComment()
        this.$refs.editor.setContent()
      }
    },
    beforeDestroy () {
      this.$refs.editor.clear()
    }
  }
</script>


<style lang="less" type="text/less">
  @import "~assets/css/variables.less";
  @import "~assets/css/animation.less";
  @import "~assets/css/mixins.less";

  // .quwi-editor__editable-area-wrapper div:nth-child(2){
  //   min-height: 50px !important;
  // }
  .quwi-comment-editor .quwi-editor .quwi-editor-controls--bottom{
    height: 100% !important;
  }
  .quwi-editor-controls--left{
    top: 0px !important;
    left: 0px !important;
  }

  .b-reply-form {
    margin: auto;
    @height: 60px;
    @upload-width: 40px;
    width: @comments-width;
    min-height: @height;
    padding-bottom: 10px;
    display: flex;
    align-items: center;
    position: relative;
    .b-editing {
      position: absolute;
      top: -25px;
      font-size: 0.9em;
      text-align: center;
      width: 100%;
    }
    i {
      &.bu-circle-notch {
        display: inline-block;
      }
    }
    .b-middle {
      flex: 1;
      flex-direction: column;
      max-width: 100%;
      .b-image {
        align-self: center;
        margin-bottom: 15px;
        margin-left: @upload-width;
        img {
          .screenshot-mixin();
        }
        i.bu-minus-circle {
          right: 5px !important;
        }
      }
      .b-input {
        @send-width: 45px;
        position: relative;
        width: 100%;
        .c-issue-editor {
          .b-editable-area {
            display: block;
            padding-left: 50px;
            padding-right: 50px;
          }
          .b-controls {
            .b-left {
              position: relative;
              top: -46px;
              z-index: 1;
              left: 10px;
            }
            .b-center {
              .b-buttons-wrap {
                background: #e9e9e9;
                border: 1px solid #e0e0e0;
                border-bottom-left-radius: 20px;
                border-bottom-right-radius: 20px;
                position: relative;
                top: -6px;
                padding: 0 20px;
                .e-control {
                  &:hover, &.active {
                    background: @hover-dark;
                  }
                }
              }
            }
          }
        }
        > .e-upload {
          width: @upload-width;
          align-self: flex-end;
          margin-bottom: 4px;
          margin-right: 5px;
          .e-upload {
            padding: 10px 5px;
            .hover-mixin();
          }
        }
        textarea {
          width: 100%;
          padding: 14px;
          outline: none;
          padding-right: @send-width;
          border-radius: 6px;
          border: 1px solid #ccc;
          &:focus {
            border: 1px solid #777;
          }
        }
        .bu-circle-notch {
          position: absolute;
          right: 10px;
          bottom: 15px;
          font-size: 20px;
        }
        .b-send-button {
          position: absolute;
          &:not(.inactive) {
            .hover-mixin(true);
          }
          right: 10px;
          bottom: 0px;
          &.inactive {
            opacity: .5;
          }
          .b-icon {
            padding: 6px;
            i {
              font-size: 20px;
            }
          }
          .b-menu-items {
            > div {
              display: block;
              .e-link {
                display: block;
                //.link-button();
                .hover-mixin();
                color: #000;
                padding: 0 15px;
                height: @btn-height;
                line-height: @btn-height;
                &.selected {
                  color: @red-color;
                }
              }
            }
          }
        }
      }
      .b-files {
        align-self: flex-start;
        align-items: flex-start;
        flex-direction: column;
        padding: 10px 0;
        margin-left: @upload-width + 5px;
        .e-name {
          margin-right: 10px;
        }
        .e-remove {
          font-size: .8em;
          cursor: pointer;
          display: inline-block;
          padding: 2px 4px;
          margin-right: 5px;
          .hover-mixin(true);
        }
        .b-file {
          padding: 3px 0;
          font-size: .9em;
        }
      }

    }
  }
  .quwi-comment-editor {
    .quwi-editor__controls-placeholder {
      height: 100%;
    }
    .quwi-editor {
      .quwi-editor__editable-area {
        display: block;
        padding: 15px 50px;
      }
      .quwi-editor-controls {
        padding: 0;
        background: transparent;
        padding-left: 50px;
        padding-right: 50px;

        .quwi-editor-controls--left {
          left: -40px;
          position: relative;
        }
      }
      .quwi-editor-controls:not(.quwi-editor-controls--bottom) {
        display: flex;
        justify-content: center;
        height: 40px;
        padding: 0;
        border-radius: 6px 6px 0 0;
      }
      .quwi-editor-controls--bottom {
          height: 0;
      }
      .b-controls {
        .b-left {
          position: relative;
          top: -46px;
          z-index: 1;
          left: 10px;
        }
        .b-center {
          .b-buttons-wrap {
            background: #e9e9e9;
            border: 1px solid #e0e0e0;
            border-bottom-left-radius: 20px;
            border-bottom-right-radius: 20px;
            position: relative;
            top: -6px;
            padding: 0 20px;
            .e-control {
              &:hover, &.active {
                background: @hover-dark;
              }
            }
          }
        }
      }
    }
  }

</style>
