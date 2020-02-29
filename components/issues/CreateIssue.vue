<template>
  <div class="b-issue-form" data-uid="_uid">
    <form @keydown.ctrl.enter="createIssue" @submit.prevent="">
      <div v-if="true" class="b-big-form">
        <div class="b-white-box">
          <div class="b-row subject-row">
            <div class="b-left">
              <div class="e-bug" @click="toggleIsBug" :class="{'active': issue.is_bug}">
                  <i class="bu-bug"></i>
              </div>
            </div>
            <div class="b-center" v-click-outside="() => $refs.suggest.hide()"
                 @click.self=" $refs.subject.focus(); $refs.subject.click() ">
              <div class="b-tags-col" ref="tagLabel">
                <tag-label :tag="selectedTag" v-if="selectedTag"
                           @click="tagClick" class="has-hover" :removable="true"></tag-label>
              </div>
              <div class="b-input-col">
                <input ref="subject" tabindex="1" class="e-subject" :class="{'has-placeholder': !selectedTag}"
                       @input="adjustSubject" type="text" maxlength="64"
                       :placeholder="selectedTag ? '' : $t('Subject (optional)')"
                       v-model="issue.name"
                       @blur="e => e.relatedTarget && $refs.suggest.hide()"
                       @keyup.up.down="$refs.suggest.change"
                       @keypress.enter="$refs.suggest.enter"
                       @click="!issue.name.trim() && !selectedTag && checkTagSuggest($event, false)"
                       @input.tag="!selectedTag && checkTagSuggest($event)">
                <div ref="fakeSubject" id="fake-subject"></div>
                <suggestions ref="suggest" @select="(s, k) => applySuggestion(s, k)"></suggestions>
              </div>
              <div class="b-add-tag">
                <div class="b-button" ref="addTag" :class="{'m-inactive': isFetchingTags}"
                     @click="!isFetchingTags && addTag()" v-if="canAddTag">
                  <i class="bu bu-add-file"></i>
                  {{ $t('create_issue.add_tag') }}
                </div>
                <fadeout-message class="b-add-tag-message" :message="$t('create_issue.tag_added')" :delay="1000"
                                 v-if="showAddTagMessage" @hide="showAddTagMessage = false"></fadeout-message>
              </div>
              <div class="e-bottom-line"></div>
            </div>
            <div class="b-right">
                <i @click="issue.is_starred = +!issue.is_starred"
                   :class="issue.is_starred ? 'bu-star' : 'bu-star-empty' "></i>
            </div>
          </div>

          <div class="b-row text-row">
              <div class="b-center">
                <no-ssr>
                  <quwi-editor class="quwi-issue-editor" ref="editor"
                              @input="editorInput"
                              @pasteImage="editorPasteImage"
                              @updateImage="editorUpdateImage"
                              @pasteFile="editorPasteFile"
                              @pasteVideo="editorPasteVideo"
                              @addCustomColor="editorAddCustomColor"
                              @preventUpload="editorPreventUpload"
                              :options="computedEditorOptions"
                              :custom-colors="editorCustomColors"
                              autofocus
                              :controls-style="{ rightControlTop: 'calc(100% - 42px)', rightControlRight: '0px' }"
                  >
                    <!--<div class="e-record" slot="right-control">
                      <audio-recorder @result="recorderResult"
                                      :text="true"></audio-recorder>
                    </div>-->
                  </quwi-editor>

                  <quwi-editor-placeholder :options="computedEditorOptions" :controls-style="{ rightControlTop: 'calc(100% - 42px)', rightControlRight: '0px' }" slot="placeholder" />
                </no-ssr>
                <simple-hint position="top" v-if="emptyError" @hide="emptyError = null">{{emptyError}}
                </simple-hint>
              </div>
          </div>
        </div>

          <div class="b-row controls-row">
            <div class="b-center">
              <priority-dropdown
                class="dark-hover"
                name="priority"
                :label="$t('Priority')"
                :selected="issue.priority_weight" :onChange="setPriority">
              </priority-dropdown>

              <dropdown
                class="dark-hover b-assignee-drop"
                v-if="assignUsers.length"
                name="assignee"
                :label="$t('Assign')"
                :empty="$t('assign.empty')"
                :selected="issue.id_assigned_user"
                :options="assignUsers"
                :onChange="setAssignee">
              </dropdown>
              <btn @click="createIssue" class="btn" :text="$t('Create')" :loading="this.sending"
                   :active="checkAccess('disc_space')"
                   :inactiveTooltip="noDiscHint"></btn>
              <dropdown
                      v-if="showDraftSaved && isDraftSaved && !isTyping"
                      class="dark-hover b-draft-saved-drop"
                      direction="right"
                      :options="[{id: 0, name: $t('New draft')}]"
                      :onChange="newDraft">
                <template slot="label" slot-scope="{option}">
                  <div class="e-draft-saved">
                    {{$t('Draft saved')}}
                    <i class="bu-down-dir"></i>
                  </div>
                </template>
              </dropdown>
              <div class="e-draft-saved saving" v-else-if="showDraftSaved">{{$t('Saving draft')}}</div>
            </div>
          </div>
          <div v-if="issue.files" class="b-row files-row">
            <div class="b-center">
              <div class="b-file" v-for="(file, k) in issue.files">
                <span @click="removeFile(k)" class="e-remove">?</span>
                <span class="e-name">{{ file.name }}</span>
                <i class="bu-circle-notch m-spin" v-if="!file.uploaded_name"></i>
              </div>
            </div>
          </div>
        </div>
      </form>
  </div>
</template>

<script>
  import dropdown from '~/components/Dropdown'
  import Btn from '~/components/Btn'
  import tagLabel from '~/components/TagLabel'
  import TextareaAutosize from '~/components/TextareaAutosize'
  import { objectToFormData, readDataUrl, getErrorFromResponse } from '~/utils/helpers'
  import { trimHTML } from '~/utils/dom'
  import { editorHydrate, editorTransformHTML } from '~/utils/editor'
  import UploadButton from '~/components/UploadButton.vue'
  import SimpleHint from '~/components/SimpleHint'
  import markdown from '~/utils/mixins/markdown'
  import listeners from '~/utils/mixins/listeners'
  import editor from '~/utils/mixins/editor'
  import IssueStar from '../IssueStar.vue'
  import PriorityDropdown from '~/components/PriorityDropdown.vue'
  import Suggestions from '../Suggestions.vue'
  import { mapGetters } from 'vuex'
  import { getNoDiscHint } from '~/utils/issues'
  import AudioRecorder from '../AudioRecorder.vue'
  import { showUpgradeDialog } from '~/utils/plan'
  import { debounce } from 'lodash'
  import searchTags from '~/utils/mixins/search_tags'
  import FadeoutMessage from '../FadeoutMessage.vue'

  export default {
    name: 'create-issue',
    components: {
      FadeoutMessage,
      AudioRecorder,
      Suggestions,
      IssueStar,
      UploadButton,
      dropdown,
      tagLabel,
      TextareaAutosize,
      Btn,
      SimpleHint,
      PriorityDropdown
    },
    mixins: [markdown, listeners, editor, searchTags],
    methods: {
      pasteImage (e) {
        this.forceExpanded = true
        readDataUrl(e).then(res => this.$refs.editor.insertImage(res))
      },
      toggleIsBug () {
        this.issue.is_bug = +!this.issue.is_bug
      },
      async createIssue () {
        let data = {...this.issue}
        if (this.sending || !this.checkAccess('disc_space')) {
          return
        }
        this.sending = true
        await this.$refs.editor.getContent().then(res => {
          data.comment = editorTransformHTML(this.$refs.editor.getSettings(), res.html)
          data.snippet = res.snippet
        })
        if (this.$refs.editor.isEmpty()) {
          this.emptyError = this.$t('Task cannot be empty')
          this.sending = false
          return
        }
        data.comment = {text: data.comment, snippet: data.snippet}
        if (this.selectedTag) {
          data.id_category = +this.selectedTag
        }
        if (this.$route.params.project) {
          data.id_project = +this.$store.getters['company/getProject'](this.$route.params.project).id
        }
        let fd = objectToFormData(data)
        let vm = this
        this.$api.post('issues', fd)
          .then(res => {
            // vm.$store.commit('ADD_ISSUES_FILTER', {status: 'open'})
            vm.$store.dispatch('Issues/fetch', {newIssue: res.data.issue})
            vm.$store.commit('Issues/SET_DEFAULT')
            vm.issue = Object.assign({}, vm.$store.state.Issues.issue)
            if (this.selectedTag) {
              this.$store.commit('Issues/SET_ACTIVE_TAG', 0)
            }
            if (res.data.issue.is_starred) {
              vm.$store.dispatch('getProjects')
            }
            this.$refs.editor.clear()
            this.removeDraft()
            window.scrollTo(0, 0)
          })
          .finally(() => {
            vm.sending = false
            return true
          })
      },
      removeFile (i) {
        this.issue.files.splice(i, 1)
      },
      setPriority (val) {
        this.issue.priority_weight = +val
      },
      setAssignee (val) {
        this.issue.id_assigned_user = +val
      },
      focusPart (k) {
        this.$nextTick(function () {
          const el = document.querySelector(`.b-part[data-k="${k}"] textarea`)
          return el ? el.focus() : null
        })
      },
      addPart (after) {
        if (this.issue.parts[after] && this.issue.parts[after].text) {
          this.issue.parts.splice(after + 1, 0, {img: '', text: ''})
          this.focusPart(after + 1)
        }
      },
      removePart (k) {
        if (this.issue.parts[k].text === '' && this.issue.parts.length > 1) {
          if (this.removePartAttemptsCnt === 1) {
            this.issue.parts.splice(k, 1)
            this.removePartAttemptsCnt = 0
            this.focusPart(k === 0 ? 0 : k - 1)
          } else {
            this.removePartAttemptsCnt = 1
          }
        }
      },
      forceExpand () {
        this.forceExpanded = true
        this.focusPart(0)
      },
      isEmptyHTML (html) {
        if (process.server) {
          return
        }
        if (html.match(/bu-(image|file)/)) {
          return false
        }
        let node = document.createElement('div')
        node.innerHTML = html
        return !node.innerText.replace(/\s+?\s+/, '\n').trim()
      },
      fillFromDraft (id) {
        let draft = this.$store.state.drafts.find(el => +el.id === +id)
        if (!draft) {
          return
        }
        let keys = Object.keys(this.issue)
        for (let k = 0; k < keys.length; k++) {
          if (typeof draft[keys[k]] !== 'undefined') {
            this.issue[keys[k]] = draft[keys[k]]
          }
        }
        if (draft.id_category) {
          this.$store.commit('Issues/SET_ACTIVE_TAG', draft.id_category)
        } else {
          this.$store.commit('Issues/SET_ACTIVE_TAG', 0)
        }
        // this.$store.commit('SET_ACTIVE_TAG', draft.id_category || null)

        let d = document.createElement('div')
        d.innerHTML = draft.comment_text

        const hydratedHtml = editorHydrate(d, this.$refs.editor)
        this.issue.comment.html = hydratedHtml
        this.issue.comment.text = d.innerText
        this.$refs.editor.setContent(hydratedHtml)
        this.$refs.editor.subscribeAllLoaders()
        this.$refs.editor.files = draft.comment_files || []
        this.draftId = id
        this.$nextTick(() => {
          this.$refs.editor.focus(true)
          this.adjustSubject()
          window.scroll(0, 0)
        })
      },
      removeDraft () {
        if (!this.draftId) {
          return
        }
        let id = this.draftId
        this.draftId = null
        Promise.all(this.draftPromises).then(() => {
          this.addDraftQuery(this.$store.dispatch('removeDraft', id))
        })
      },
      addDraftQuery (promise) {
        this.draftPromises.push(promise)
        this.checkUnloadAlert()
        promise.then(() => {
          let ind = this.draftPromises.indexOf(promise)
          if (ind !== -1) {
            this.draftPromises.splice(ind, 1)
          }
          this.checkUnloadAlert()
          this.timer = setTimeout(() => {
            this.isDraftSaved = this.draftPromises.length === 0
          }, 1000)
        })
      },
      checkUnloadAlert () {
        if (this.draftPromises.length) {
          if (!window.onbeforeunload) {
            window.onbeforeunload = async (e) => {
              await Promise.all(this.draftPromises)
              e.message = this.$t('Draft is not saved')
              return this.$t('Draft is not saved')
            }
          }
        } else {
          window.onbeforeunload = null
        }
      },
      getDraftParams (issue) {
        if (!issue) {
          issue = this.issue
        }
        let params = {
          comment_text: issue.comment ? issue.comment.html : '',
          comment_snippet: issue.comment ? issue.comment.text : '',
          type: 'web',
          priority_weight: issue.priority_weight,
          id_assigned_user: issue.id_assigned_user,
          is_bug: issue.is_bug,
          is_starred: issue.is_starred,
          name: issue.name
        }
        if (this.selectedTag) {
          params.id_category = this.selectedTag
        }
        return params
      },
      trimHTML,
      adjustSubject () {
        let subj = this.$refs.subject
        if (!subj) {
          return
        }
        let width = 20
        if (subj.value === '') {
          if (!this.selectedTag) {
            width = 175
          }
        } else {
          this.$refs.fakeSubject.textContent = subj.value
          width = this.$refs.fakeSubject.offsetWidth + 20
          if (!this.selectedTag && width < 175) {
            width = 175
          }
        }
        subj.style.width = width + 'px'
      },
      updateDrafts (val) {
        if (this.isDraftCreating) {
          return
        }
        let comment = val.comment ? val.comment.html.trim() : ''
        const isEmptyHTML = (html) => {
          let div = document.createElement('div')
          div.innerHTML = html
          return !div.innerText.trim()
        }
        let isEmpty = comment.indexOf(`href=""`) !== -1 || (comment.indexOf('bu-image-wrapper') === -1 && comment.indexOf('bu-file') === -1 && comment.indexOf('bu-video-wrapper') === -1 && isEmptyHTML(comment))
        if (!isEmpty) {
          let params = this.getDraftParams(val)
          this.showDraftSaved = true
          this.isDraftSaved = false
          if (!this.draftId) {
            this.isDraftCreating = true
            this.addDraftQuery(this.$api.post('issues-draft/save', params).then(res => {
              this.draftId = res.data.draft.id
              let params = this.getDraftParams()
              if (trimHTML(params.comment_text)) {
                this.addDraftQuery(this.$api.post('issues-draft/save?id=' + this.draftId, params))
              } else {
                this.removeDraft()
              }
              this.isDraftCreating = false
            }))
          } else {
            this.addDraftQuery(this.$api.post('issues-draft/save?id=' + this.draftId, params).then(res => {
              if (+res.data.draft.id !== +this.draftId) {
                this.draftId = +res.data.draft.id
              }
            }))
          }
        } else if (this.draftId) {
          this.removeDraft()
        }
      },
      /* eslint-disable */
      editorInput(html, e) {
        this.$refs.editor.getContent().then((res) => {
          this.issue.comment.html = editorTransformHTML(this.$refs.editor.getSettings(), res.html)
          this.issue.comment.text = res.snippet
        })
      },
      tagClick (data) {
        const tag = this.$store.getters['Issues/getActiveTag']
        this.$store.commit('Issues/SET_ACTIVE_TAG', 0)
      },
      debouncedUpdateDrafts: debounce((vm, val) => {
        vm.updateDrafts(val)
      }, 500),
      /* eslint-enable */
      async insertVoiceFile (f) {
        let fd = new FormData()
        const name = 'voice_message.ogg'
        fd.append('files[]', f, name)
        const result = await this.$api.post('comments/create-attachments', fd)
        const file = result.data.comment_files[0]
        const fileUrl = file.info.file.url
        this.$refs.editor.insertFileExternal(name, file.id, fileUrl)
      },
      insertVoiceText (t) {
        this.$refs.editor.insertText(t)
      },
      async recorderResult ({ blob, text }) {
        if (blob) {
          await this.insertVoiceFile(blob)
        }
        if (text) {
          this.insertVoiceText(text)
        }
      },
      editorPreventUpload () {
        showUpgradeDialog(this)
      },
      applySuggestion (s) {
        if (!s || !s.data) {
          return
        }
        this.$store.commit('Issues/ADD_TAG', s.data)
        this.$store.commit('Issues/SET_ACTIVE_TAG', s.data.id)
        this.issue.name = ''
        this.$nextTick(() => {
          this.adjustSubject()
          this.$refs.subject.focus()
        })
      },
      addTag () {
        if (!this.issue.name || this.cntSuggestions) {
          return
        }
        let vm = this
        this.$store.dispatch('Issues/addTag', {
          name: this.issue.name,
          idProject: +this.$store.getters['company/getProject'](this.$route.params.project).id
        }).then(tag => {
          this.showAddTagMessage = true
          this.currentSuggestions.push(tag)
        }).catch(err => vm.$alert(getErrorFromResponse(err) || 'Unknown error'))
      },
      newDraft () {
        this.updateDrafts(this.issue)
        Promise.all(this.draftPromises).then(() => {
          this.draftId = null
          this.showDraftSaved = false
          this.$refs.editor.clear()
          this.$store.dispatch('updateDrafts')
        })
      }
    },
    data: () => ({
      forceExpanded: false,
      timer: null,
      removePartAttemptsCnt: 0,
      sending: false,
      uploadPromises: [],
      emptyError: null,
      issue: {
        comment: {
          text: '',
          html: ''
        },
        priority_weight: 25,
        id_assigned_user: 0,
        is_bug: 0,
        is_starred: 0,
        name: '',
        id_category: null
      },
      lastFocusClass: 'js-editable-area',
      isDraftCreating: false,
      draftId: null,
      draftPromises: [],
      showDraftSaved: false,
      isDraftSaved: false,
      isTyping: false,
      typingTimer: null,
      editorOptions: {
        minHeight: 49,
        editMarginTop: 0,
        editMarginLeft: 0,
        editMarginRight: 0,
        editorControlsLeftTop: 0,
        width: 0,
        isBordered: false,
        maxWidth: 663,
        fixedEditorPosition: 46
      },
      editorControlsStyle: {
        rightControlBottom: '20px'
      },
      showAddTagMessage: false
    }),
    computed: {
      ...mapGetters({
        checkAccess: 'webuser/checkAccess'
      }),
      selectedTag () {
        let project = this.$store.getters['company/getProject'](this.$route.params.project)
        const tag = this.$store.getters['Issues/getActiveTag']
        return tag && project && +tag.id_project === +project.id ? tag.id : null
      },
      isFormExpanded () {
        // ???? ????? ??????????
        if (this.forceExpanded) {
          return true
        }
        // ???? ??????????? ?????, ????????? ???????? ??? ?????? ???
        let state = (this.issue.comment && !this.isEmptyHTML(this.issue.comment)) || this.selectedTag || this.issue.name
        if (state) {
          this.forceExpanded = true
        }
        this.$nextTick(() => {
          if (!process.server) {
            this.focusPart(0)
          }
        })
        return state
      },
      assignUsers () {
        let project = this.$store.getters['company/getProject'](this.$route.params.project)
        if (project) {
          return this.$store.state.assignUsers.filter(el => (el.id_projects.indexOf(+project.id) > -1) && el.is_active)
        }
        return []
      },
      noDiscHint () {
        return getNoDiscHint(this)
      },
      computedEditorOptions () {
        return {
          ...this.editorOptions,
          preventUpload: !this.checkAccess('disc_space'),
          texts: {
            'audiorecorder.release_outside': this.$t('audiorecorder.release_outside_editor'),
            'audiorecorder.release': this.$t('audiorecorder.release'),
            'audiorecorder.mic_disabled': this.$t('audiorecorder.mic_disabled')
          }}
      },
      canAddTag () {
        return this.checkAccess('owner') &&
          !this.showAddTagMessage &&
          this.issue.name.length > 1 &&
          !this.selectedTag &&
          !this.currentSuggestions.find(el => el.name.toLowerCase() === this.issue.name.trim().toLowerCase())
      }
    },
    watch: {
      issue: {
        handler: function (val) {
          this.$store.commit('Issues/SET_NEW_ISSUE', val)
          this.debouncedUpdateDrafts(this, val)
          let isEmpty = !val.name && (!val.comment.html || val.comment.html === '<div></div>') && !val.comment.text
          this.$emit('changeEmpty', isEmpty)
        },
        deep: true
      },
      selectedTag () {
        this.adjustSubject()
      }
    },
    created () {
      this.$store.subscribe((mutation, state) => {
        if (mutation.type === 'Issues/ADD_FILTER' && Object.keys(mutation.payload)[0] === 'id_category') {
          // this.issue.id_category = state.getters.getIssuesFilter('tag')
          this.issue.id_category = Object.values(mutation.payload)[0]
          if (!process.server) {
            this.adjustSubject()
          }
        } else if (mutation.type === 'SET_DRAFTS') {
          if (this.draftId && !state.drafts.find(el => +el.id === +this.draftId)) {
            this.draftId = null
          }
        }
      })
    },
    mounted () {
      window.createIssue = this
      this.$nextTick(() => {
        const uid = this.$el.getAttribute('data-uid')
        const textarea = document.querySelector(`[data-uid=${uid}] textarea`)
        if (textarea) {
          textarea.focus()
        }
        this.adjustSubject()
      })
      this.addListener(
        document,
        'keydown',
        (e) => {
          this.emptyError = null
          const isCtrlH = (e.key.toLowerCase() === 'h' || e.keyCode === 72) && e.ctrlKey
          if (isCtrlH) {
            this.issue.is_bug = +!this.issue.is_bug
            e.preventDefault()
          }
        }
      )
    },
    beforeDestroy () {
      this.timer && clearTimeout(this.timer)
    },
    destroyed () {
      this.$store.commit('Issues/SET_ACTIVE_TAG', 0)
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  /*@import '~assets/css/common.less';*/
  .b-issue-form {
    .top-row();
    background-color: #c1c8d2;
    min-height: 231px;
    min-width: 820px;
    form {
      @small-input-height: 42px;
      @form-top-padding: 5px;
      width: @issues-width;
      margin: auto;
      padding: @form-top-padding 0;

      > .b-part {
        margin-bottom: 0;
      }

      .b-row {
        @left-col-width: 42px;
        @right-col-width: 42px;
        display: flex;
        .b-left, .b-right {
          display: flex;
          align-items: center;
          justify-content: center;
          .bu-star {
            color: @red-color;
          }
          .bu-star-empty {
            color: #777;
          }
          .bu-star, .bu-star-empty {
            cursor: pointer;
            &:hover {
              color: @red-color;
            }
          }
        }
        .b-left {
          width: @left-col-width;
          .e-bug {
            font-size: 20px;
            line-height: @btn-height;
            height: @btn-height;
            margin-top: (@small-input-height - @btn-height) / 2;
            padding: 0 2px;
            cursor: pointer;
            text-align: center;
            margin-right: 5px;
            .hover-mixin(false);
            .bu-bug {
              color: #929fb1;
            }
            &.active {
              .bu-bug {
                color: @red-color;
              }
              .bu-shit {
                color: #8d582f;
              }
            }
          }
        }
        .b-center {
          flex: 1;
          position: relative;
          .b-input {
            position: relative;
            textarea {
              .top-row-input();
              padding-right: 15px;
              padding-left: 15px;
            }
          }
        }
        .b-right {
          width: @right-col-width;
          .b-button {
            line-height: @btn-height;
            height: @btn-height;
            padding: 0 2px;
            cursor: pointer;
            text-align: center;
            .hover-mixin(false);
            margin-left: 5px;
            color: @dark-blue;
          }
        }
      }

      .b-small-form {
        .b-row {
          .b-left {
            .e-bug {
              margin-top: 0;
              display: flex;
              align-items: center;
              line-height: initial;
              padding: 5px;
            }
          }
          .b-center {
            display: flex;
            align-items: center;
            .b-input {
              flex: 1;
            }
            .btn {
              align-self: center;
              margin-left: 6px;
            }
          }
          .b-right {
            .b-button {
              margin-top: (@small-input-height - @btn-height) / 2;
            }
          }
        }
      }
      .b-big-form {
        .b-white-box {
          background: #fff;
          padding: 0;
          border-radius: 3px;
          box-shadow: @box-shadow;
          .b-row.subject-row {
            .b-left {
              position: static;
              .e-bug {
                display: flex;
                align-items: center;
                margin: 0;
                &:hover {
                  background-color: transparent;
                  i.bu-bug {
                    color: @red-color;
                  }
                }
              }
            }
          }

        }
        @inputs-border-radius: 3px;
        @inputs-border: 1px solid #ddd;

        input[type=text], textarea {
          padding: 10px 15px;
          outline: none;
          width: 100%;
          resize: none;
          border-radius: @inputs-border-radius;
          border: none;
        }

        .b-row {
          margin-bottom: 5px;
          &.subject-row {
            position: relative;
            .b-left {
              position: absolute;
              left: -35px;
              .e-bug {
                margin-top: 2px;
                .hover-mixin(true);
                .bu-bug {
                  font-size: .65em;
                }
              }
            }
            .b-center {
              /* border-radius: @inputs-border-radius; */
              position: relative;
              /*border-bottom: 1px solid #e5e5e5;*/
              display: flex;
              justify-content: center;
              cursor: text;
              .b-tags-col {
                float: left;
                height: @small-input-height;
                background: #fff;
                border-top-left-radius: @inputs-border-radius;
                border-bottom-left-radius: @inputs-border-radius;
                .b-tag-label {
                  font-size: .9em;
                  display: flex;
                  float: right;
                  height: 100%;
                  align-items: center;
                  margin-right: 0;
                  padding-left: 3px;
                  max-width: 200px !important;
                  .e-separator {
                    margin: 0 6px;
                  }
                }
              }
              .b-input-col {
                //overflow-x: hidden;
                flex: 0;
                .e-subject {
                  border: none !important;
                  height: @small-input-height;
                  padding-left: 0;
                  border-top-left-radius: 0;
                  border-bottom-left-radius: 0;
                  font-weight: bold;
                  text-align: center;
                  width: 20px;
                  &.has-placeholder {
                    width: 175px;
                  }
                  &::-webkit-input-placeholder {
                    font-weight: normal;
                  }
                  &::-moz-placeholder {
                    font-weight: normal;
                  }
                  &:-ms-input-placeholder {
                    font-weight: normal;
                  }
                  &:-moz-placeholder {
                    font-weight: normal;
                  }
                }
                #fake-subject {
                  position: absolute;
                  height: 0;
                  overflow: hidden;
                  white-space: pre;
                  visibility: hidden;
                  font-size: 14px;
                  font-weight: bold;
                }
              }
              .b-add-tag {
                position: absolute;
                right: 0;
                height: 42px;
                display: flex;
                align-items: center;
                background: #fff;
                .b-button {
                  height: 100%;
                  display: flex;
                  align-items: center;
                  .hover-mixin();
                  padding: 0 5px;
                  color: @basic-blue;
                  i {
                    margin-right: 5px;
                  }
                }
                .b-add-tag-message {
                  color: @green-color;
                }
              }
              .e-bottom-line {
                position: absolute;
                bottom: 0;
                width: 100%;
                border-top: 1px solid #e5e5e5;
              }
            }
          }

          &.image-row {
            position: relative;
            .b-center {
              text-align: center;
              img {
                .screenshot-mixin();
                border-radius: 6px;
              }
            }
            .b-right {
              position: absolute;
              top: 0;
              right: -45px;
              .b-button {
                visibility: hidden;
              }
            }
            &:hover {
              .b-right {
                .b-button {
                  visibility: visible;
                }
              }
            }
          }
          &.text-row {
            .b-center {
              @padding: 40px;
              padding: 0 @padding;
              .c-issue-editor {
                margin: 0;
                .b-editable-area {
                  min-height: 50px;
                  width: @issues-width - 2 * @padding;
                  border: none;
                  padding: 0;
                  margin: 15px 0;
                }
                .b-controls {
                  margin: 0 -40px;
                  border-bottom-left-radius: 3px;
                  border-bottom-right-radius: 3px;
                  padding: 0 7px;
                }
              }
            }
          }
          &.controls-row {
            margin-top: 10px;
            @row-height: @btn-height;
            .b-center {
              height: @row-height;
              line-height: @row-height;
              .e-upload {
                float: left;
                margin-right: 10px;
                padding: 0 8px;
                .hover-mixin(false);
              }
              .b-dropdown {
                &.b-assignee-drop {
                  min-width: 80px;
                }
                float: left;
                margin-right: 10px;
                .dropdown-toggle {
                  font-size: .8em;
                }
                &.b-priority-dropdown {
                  .c-priority-label {
                    position: relative;
                    top: -1px;
                  }
                  .dropdown-toggle {
                    width: 52px;
                  }
                }
              }
              .btn {
                float: right;
              }
            }
            .b-draft-saved-drop {
              float: right !important;
              margin-right: 5px !important;

              .dropdown-menu {
                left: auto;
                right: 0;
                top: 70%;
              }
            }

            .e-draft-saved {
              font-size: .95em;
              color: @dark-blue;
              font-style: italic;
              display: inline-flex;
              text-transform: none;
              font-weight: normal;
              padding-left: 10px;

              &.saving {
                font-size: .75em;
                float: right;
                margin-right: 28px;
              }
            }
          }

          &.files-row {
            margin-bottom: 10px;
            .b-file {
              padding-left: 10px;
              margin-bottom: 3px;
              .e-remove {
                margin-right: 10px;
                font-size: .7em;
                font-weight: bold;
                cursor: pointer;
                display: inline-block;
                padding: 3px 5px;
                .hover-mixin(false);
              }
              .e-name {
                font-size: .8em;
              }
              i {
                display: inline-block;
                margin-left: 5px;
              }
            }
          }
        }
      }
    }
  }
  .quwi-issue-editor {
    .quwi-editor {
      overflow: initial;
      .quwi-editor__editable-area {
        display: block;
        max-width: calc(745px - 80px);
      }
      .quwi-editor-controls {
        padding: 0;
        background: transparent;

        .quwi-editor-controls--left {
          left: -30px;
          // position: relative;
        }
      }
    }
    .c-audio-recorder {
      padding: 5px;
      color: rgb(102, 102, 119);
    }
  }


  .lang-ru-RU .b-issue-form form .b-input textarea {
    width: @issues-width - 125px;
  }
</style>

