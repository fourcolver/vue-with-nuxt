<template>
  <div class="c-issue-top">
    <div class="b-inner">
      <div class="b-left">
        <priority-dropdown
          name="priority"
          :label="$t('Priority')"
          :selected="issue.priority_weight" :onChange="setPriority"
          v-if="canEdit">
        </priority-dropdown>
        <priority-label v-else :weight="issue.priority_weight"></priority-label>
        <span class="e-status">{{ issue.status }}</span>
      </div>
      <div class="b-center">
        <tag-label v-if="issue.tag1 && editing !== 'tag' " :tag1="issue.tag1" :class="{'m-editable': canEdit}"
                   :endArrow="issue.name" @click="canEdit ? editTag() : null"></tag-label>
        <span class="e-subject" @click="canEdit ? editSubject() : null"
              v-if="!editing" :class="{'m-editable': canEdit}">{{ issue.name }}</span>
        <div class="b-edit-subject" v-if="editing === 'subject' " v-click-outside="() => editing = null"
             v-key-escape="() => editing = null">
          <div class="b-input">
            <input class="e-subject-input" maxlength="64" ref="newSubject" v-model="newSubject"
                   @keydown.enter="subjectEnter"
                   type="text">
          </div>
          <btn text="ok" @click="saveSubject"></btn>
        </div>

        <div class="b-edit-tag" v-if="editing === 'tag' " v-click-outside="() => editing = null"
             v-key-escape="() => editing = null">
          <div class="b-input">
            <simple-hint position="bottom" v-if="tagError">{{ tagError }}</simple-hint>
            <input class="e-tag-input" ref="newTag" type="text"
                   v-allowed="{value: tagForbiddenSymbols, reverse: true}"
                   maxlength="24"
                   v-model="newTag"
                   :placeholder="$t('issue_header.tag_input_placeholder')"
                   @blur="e => e.relatedTarget && $refs.suggest.hide()"
                   @keyup.up.down="$refs.suggest.change"
                   @keypress.enter="tagEnter"
                   @keydown="tagError = ''"
                   @focus="tagError = ''"
                   @click="tagError = ''"
                   @input.tag="checkTagSuggest">
            <suggestions :selectOnMove="false" ref="suggest"
                         @select="(s) => s && s.data && saveTag(s.data.id)"></suggestions>
          </div>
          <btn text="ok" @click="saveTag" v-if="$store.getters['webuser/checkAccess']('owner')"></btn>
        </div>
      </div>
      <div class="b-right">
        <div class="e-bug" @click="toggleBug" :class="{'m-active': issue.is_bug, 'm-editable': canEdit}">
          <i class="bu-bug"></i>
        </div>
        <issue-star :issue="issue" @change="(val) => issue.is_starred = val"></issue-star>
        <context-menu v-if="canEdit" trigger="click" class="b-dots-menu" direction="left" :autoClose="true">
          <div slot="content">
            <i class="bu-ellipsis-vert"></i>
          </div>
          <div slot="items">
            <div @click="editSubject" class="b-item">{{ $t('issue.' + (issue.name ? 'change' : 'add') + '_subject')
              }}
            </div>
            <div class="b-item" @click="removeSubject" v-if="issue.name">{{ $t('issue_header.remove_subject') }}</div>
            <div @click="editTag" class="b-item">{{ $t('issue.' + (issue.id_category ? 'change' : 'add') + '_tag') }}
            </div>
            <div class="b-item" @click="removeTag" v-if="issue.id_category">{{ $t('issue_header.remove_tag') }}</div>
          </div>
        </context-menu>
      </div>
    </div>
  </div>
</template>

<script>
  import TagLabel from '../TagLabel.vue'
  import { capitalize } from '~/utils/helpers'
  import ContextMenu from '../ContextMenu.vue'
  import SimpleHint from '../SimpleHint.vue'
  import Suggestions from '../Suggestions.vue'
  import IssueStar from '../IssueStar.vue'
  import Btn from '../Btn.vue'
  import searchTags from '~/utils/mixins/search_tags'
  import PriorityLabel from '../PriorityLabel.vue'
  import PriorityDropdown from '../PriorityDropdown.vue'

  export default {
    components: {
      PriorityDropdown,
      PriorityLabel,
      Btn,
      IssueStar,
      Suggestions,
      SimpleHint,
      ContextMenu,
      TagLabel
    },
    name: 'issue-top',
    mixins: [searchTags],
    data () {
      return {
        editing: null,
        newSubject: '',
        tagError: '',
        newTag: '',
        tagForbiddenSymbols: ['~', '`', '!', '@', '"', '№', '#', '$', ';', '%', '^', ':', '?', '&', '*', '(', ')', '+', '=', '{', '[', ']', '}', '|', '\\', '|', '/', '\'', '<', '>', ',', '.', ' ']
      }
    },
    props: ['issue'],
    methods: {
      toggleBug () {
        if (!this.canEdit) {
          return
        }

        this.issue.is_bug = +!this.issue.is_bug
        this.$store.dispatch('Issues/updateIssue', {id: this.issue.id, is_bug: this.issue.is_bug})
      },
      editSubject () {
        this.editing = 'subject'
        this.newSubject = this.issue.name || ''
        this.$nextTick(() => this.$refs.newSubject.select())
      },
      editTag () {
        this.editing = 'tag'
        this.newTag = ''
        this.$nextTick(() => this.$refs.newTag.select())
      },
      tagEnter () {
        if (this.$refs.suggest.getSelected()) {
          this.$refs.suggest.enter()
        } else if (this.newTag) {
          this.saveTag()
        } else if (!this.newTag) {
          this.editing = null
        }
      },
      subjectEnter () {
        if (this.newSubject.trim()) {
          this.saveSubject()
        } else {
          this.editing = null
        }
      },
      saveSubject () {
        this.issue.name = capitalize(this.newSubject)
        this.$store.dispatch('Issues/updateIssue', {id: this.issue.id, name: this.issue.name})
        this.editing = null
      },
      removeSubject () {
        this.issue.name = ''
        this.$store.dispatch('Issues/updateIssue', {id: this.issue.id, name: ''})
      },
      setPriority (val) {
        this.issue.priority_weight = +val
        this.$api.put('issues/priority?id=' + this.issue.id, {priority_weight: val})
      },
      async saveTag (tag = null) {
        if (!this.$store.getters['webuser/checkAccess']('owner')) {
          return
        }
        const minLength = 3
        if (!tag && this.newTag) {
          if (this.newTag.length < minLength) {
            this.tagError = this.$tc('issue_header.tag_too_short', null, {n: minLength})
            return
          } else {
            let project = this.$store.getters['company/getProject'](this.$route.params.project)
            if (!project) {
              return
            }
            let createdTag = await this.$api.post('categories', {
              name: this.newTag,
              id_project: project.id
            }).then(res => res.data.category)
            if (!createdTag) {
              this.tagError = this.$t('issue_header.tag_not_created')
            }
            tag = createdTag.id
          }
        }
        this.issue.id_category = tag
        this.$store.dispatch('Issues/updateIssue', {id: this.issue.id, id_category: this.issue.id_category})
        this.editing = null
      },
      removeTag () {
        this.issue.id_category = null
        this.$store.dispatch('Issues/updateIssue', {id: this.issue.id, id_category: null})
      }
    },
    computed: {
      canEdit () {
        return this.$store.state.webuser.authItems.owner || +this.issue.id_user === +this.$store.state.webuser.user.id
      }
    },
    mounted () {
      window.issueTop = this
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-issue-top {
    height: 56px;
    .b-inner {
      width: @comments-width;
      height: 100%;
      margin: auto;
      display: flex;
      align-items: center;
      @col-width: 152px;
      > .b-left, .b-right {
        width: @col-width;
      }
      > .b-left {
        display: flex;
        align-items: center;
        .e-status {
          text-transform: uppercase;
          font-size: .8em;
          font-weight: bold;
        }
        > .b-priority-dropdown {
          margin: 0 15px;
        }
        > .c-priority-label {
          margin: 0 20px;
        }
        .b-priority-dropdown {
          .hover-mixin();
          a.dropdown-toggle {
            justify-content: center;
          }
        }
      }
      > .b-center {
        flex: 1;
        font-size: 1.1em;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 38px;
        margin: 0 10px;
        max-width: calc(100%~'-'2 * @col-width);
        > .b-tag-label {
          font-weight: normal;
          .e-separator {
            margin: 0 5px;
          }
          &.m-editable {
            .e-tag {
              &:hover {
                cursor: pointer;
                text-decoration: underline;
              }
            }
          }
        }
        .e-subject {
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          max-width: 100%;
          &.m-editable:hover {
            text-decoration: underline;
            cursor: pointer;
          }
        }
        .b-edit-subject, .b-edit-tag {
          flex: 1;
          display: flex;
          align-items: center;
          .b-input {
            flex: 1;
            margin-right: 5px;
            position: relative;
            .b-simple-hint {
              font-weight: normal;
            }
          }
          input {
            .text-input();
          }
        }
      }
      > .b-right {
        display: flex;
        justify-content: flex-end;
        .e-bug {
          color: #c7c7c7;

          &.m-editable {
            .hover-mixin();
          }

          display: inline-flex;
          justify-content: center;
          align-items: center;
          &.m-active {
            color: @red-color;
          }
          i {
            display: inline-block;
            transform: rotate(45deg);
          }
        }
      }
      @btn-width: 24px;
      .e-bug, .c-issue-star {
        margin-right: 15px;
        width: @btn-width;
        height: @btn-width;
      }
      .c-issue-star {
        position: static;
        display: flex;
        align-items: center;
        .hover-mixin();
        justify-content: center;
        .e-star {
          font-size: 1.1em;
        }
      }
        .b-dots-menu {
          margin-right: 10px;
          i {
            display: inline-flex;
            width: @btn-width;
            height: @btn-width;
            justify-content: center;
            align-items: center;
            .hover-mixin();
          }
          .b-menu-items {
            padding: 10px 0;
            .b-item {
              height: 32px;
              display: flex;
              align-items: center;
              padding: 0 25px;
              .hover-mixin();
              font-size: 14px;
              color: #000;
            }
          }
        }
    }
  }
</style>
