<template>
  <div v-if="drafts.length" class="c-drafts-list">
    <div class="b-draft-container" v-for="draft in drafts" :data-id="draft.id">
      <div class="b-draft" @click="$emit('draftClick', draft.id)">
        <div class="b-top">
          <div class="e-draft">{{ $t('Draft') + (draft.name ? '.' : '') }}</div>
          <tag-label v-if="draft.tag1" :tag1="draft.tag1" :endArrow="draft.name"></tag-label>
          <div class="e-name" v-if="draft.name">{{ draft.name }}</div>
          <div class="e-date">{{ $dateAgo(draft.dta_update) + ' ' + $t('ago') }}</div>
        </div>
        <div class="b-main">
          <div v-if="draft.thumb && draft.thumb.url" class="b-left">
            <div class="b-image">
              <protected-image v-if="draft.computedThumb" :src="draft.thumb.url"
                               :height="draft.computedThumb.h"></protected-image>
            </div>
          </div>
          <div class="b-middle">
            <div class="e-snippet" v-html="prepareSnippet(draft.comment_snippet)"></div>
          </div>
        </div>
      </div>
      <div class="b-right">
        <i class="bu e-delete bu-trash-empty" @click="deleteDraft(draft)"></i>
      </div>
    </div>
  </div>
</template>

<script>
  import ProtectedImage from '../ProtectedImage.vue'
  import { calculateThumb } from '~/utils/issues'
  import TagLabel from '../TagLabel.vue'

  export default {
    components: {
      TagLabel,
      ProtectedImage
    },
    name: 'drafts-list',
    data () {
      return {}
    },
    methods: {
      prepareSnippet (text) {
        if (!text) {
          return ''
        }
        text = text.replace(/\n/g, '<br>')
        return text
      },
      deleteDraft (draft) {
        this.$store.dispatch('removeDraft', draft.id)
      }
    },
    computed: {
      drafts () {
        let drafts = Object.assign([], this.$store.state.drafts)
        drafts = drafts.sort((a, b) => {
          return b.id - a.id
        })
        return drafts
      }
    },
    created () {
      for (let k = 0; k < this.drafts.length; k++) {
        if (this.drafts[k].thumb && this.drafts[k].thumb.url) {
          this.drafts[k].computedThumb = calculateThumb(this.drafts[k].thumb, {maxWidth: 170, maxHeight: 78})
        }
      }
    },
    mounted () {
      window.draftsList = this
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-drafts-list {
    width: @issues-width;
    margin: auto;
    margin-top: 20px;
    .b-draft-container {
      position: relative;
      &:not(:last-child) {
        margin-bottom: 10px;
      }
      .b-draft {
        padding: 15px 20px;
        min-height: 50px;
        cursor: pointer;
        flex: 1;
        &:hover {
          background-color: @hover-color;
        }
        .white-box();
        .b-top {
          margin-bottom: 10px;
          display: flex;
          height: 17px;
          .e-draft {
            color: @red-color;
            margin-right: 5px;
          }
          .e-name {
            .str-truncate;
            font-weight: bold;
          }
          .e-date {
            display: flex;
            flex: 1;
            justify-content: flex-end;
            align-items: center;
            font-size: .9em;
            color: rgb(111, 111, 111);
            min-width: 100px;
          }
        }
        .b-main {
          line-height: 1.4em;
          display: flex;
          overflow: hidden;
          @max-height: @line-height * 4;
          .b-middle {
            max-width: 100%;
            flex: 1;
            .e-snippet {
              max-height: @max-height;
              word-wrap: break-word;
              overflow: hidden;
              text-overflow: ellipsis;
              text-align: justify;
            }
          }
          .b-left {
            .b-image {
              float: left;
              margin-right: 20px;
              width: 132px;
              height: 78px;
              border-radius: 4px;
              box-shadow: 0 0 3px #aaa;
              background-color: #000;
              overflow: hidden;
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
        }
      }
      .b-right {
        position: absolute;
        display: flex;
        align-items: center;
        right: -29px;
        top: 15px;
        color: rgb(111, 111, 111);
        .e-delete {
          .hover-mixin(true);
          padding: 2px 0;
          margin-left: 5px;
        }
      }
    }
  }
</style>
