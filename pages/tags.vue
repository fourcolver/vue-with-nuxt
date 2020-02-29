<template>

  <div class="c-tags-page">
    <template v-if="project">
      <div class="b-header">
        <div class="b-left">
          <checkbox v-if="tags.length" class="m-round" ref="checkAll" v-model="selectedIds" :checkAll="true"
                    :value="allTagsIds"></checkbox>
          <template v-if="selectedIds.length">
            <div class="e-remove" v-tooltip="{content: $t('tags_page.delete'), delay: 500}" @click="remove">
              <i class="bu-trash-custom"></i>
            </div>
            <div class="e-add-default" v-if="showAuto" v-tooltip="{content: $t('tags_page.add_to_default'), delay: 500}"
                 @click="addToDefault">
              <i class="bu-add-file"></i>
            </div>
          </template>
        </div>
        <div class="b-center">
          <context-menu class="b-project-selector" trigger="click" :autoClose="true">
            <div slot="content" class="b-project">
              <avatar :name="project.name" :src="project.logo_url" size="25"></avatar>
              <div class="e-name">{{ project.name }}</DIV>
            </div>
            <div slot="items">
              <div class="b-project" v-for="p in $store.state.projects" @click="project = p">
                <avatar :name="p.name" :src="p.logo_url" size="25"></avatar>
                <div class="e-name">{{ p.name }}</div>
              </div>
            </div>
          </context-menu>
          <div class="b-show-auto">
            <checkbox v-model="showAuto" :value="true" :label="$t('tags_page.show_auto')"></checkbox>
          </div>
        </div>
        <div class="b-right">
          <btn v-if="!showAuto" @click="adding = true" :text="$t('tags_page.add')"></btn>
        </div>
      </div>
      <div class="b-box" :class="{'m-empty': !tags.length}">
        <template v-if="tags.length">
          <div class="b-tags" :style="{maxHeight: (34 * Math.ceil(tags.length / 2)) + 'px'}">
            <div class="b-tag" @click="editingTag = tag"
                 :class="{'m-auto': showAuto, 'm-new': addedTag && +addedTag.id === +tag.id}" v-for="tag in tags">
              <checkbox @click.stop.native="" class="m-round" v-model="selectedIds" :value="tag.id"></checkbox>
              <div class="b-name">
                <div class="e-name">{{ capitalize(tag.name) }}</div>
              </div>
              <div class="e-cnt">{{ tag.cnt_use }}</div>
            </div>
          </div>
        </template>
        <template v-else><span class="e-empty">{{ $t('tags_page.no_tags')}}</span></template>
      </div>
      <pagination :headers="headers" template="2_buttons"></pagination>
    </template>
    <template v-else>
      <div class="b-box m-empty">
        {{ $t('tags_page.no_projects') }}
      </div>
    </template>
    <add-tag ref="addTag" :project="project" v-if="adding" @cancel="adding = false" @add="t => afterAdd(t)"></add-tag>
    <edit-tag ref="editTag" v-if="editingTag" :tag="editingTag" @cancel="editingTag = null"
              @save="t => afterEdit(t)"></edit-tag>
  </div>
</template>

<script>
  import Checkbox from '../components/Checkbox.vue'
  import Btn from '../components/Btn.vue'
  import ContextMenu from '../components/ContextMenu.vue'
  import Avatar from '../components/Avatar.vue'
  import { capitalize } from '~/utils/helpers'
  import AddTag from '../components/tags/AddTag.vue'
  import EditTag from '../components/tags/EditTag.vue'
  import Pagination from '../components/Pagination.vue'
  import { mapState } from 'vuex'

  export default {
    components: {
      Pagination,
      AddTag,
      EditTag,
      Avatar,
      ContextMenu,
      Btn,
      Checkbox
    },
    data () {
      return {
        checkAll: false,
        project: null,
        selectedIds: [],
        showAuto: false,
        adding: false,
        editingTag: null,
        addedTag: null
      }
    },
    middleware: 'member',
    methods: {
      async remove () {
        await this.$confirm(this.$tc('tags_page.delete_confirm', this.selectedIds.length, {n: this.selectedIds.length}))
        this.$api.put('categories/delete', {ids: this.selectedIds})
        this.tags = this.tags.filter(el => !this.selectedIds.includes(el.id))
        this.selectedIds = []
      },
      afterAdd (tag) {
        this.adding = false
        this.addedTag = tag
        this.refresh().then(() => {
          window.setTimeout(() => {
            this.addedTag = null
          }, 1000)
        })
      },
      afterEdit () {
        this.editingTag = null
        this.refresh()
      },
      addToDefault () {
        this.$api.put('categories/liven-up', {ids: this.selectedIds}).then(() => {
          this.showAuto = false
        })
      },
      refresh (page = null) {
        this.selectedIds = []
        if (!page) {
          this.$router.push({query: {page: undefined}})
        }
        return this.$store.dispatch('Issues/updateTags', {
          idProject: this.project.id,
          isAuto: this.showAuto,
          page: page || 1
        })
      },
      capitalize
    },
    computed: {
      ...mapState({
        headers: state => state.Issues.tagsHeaders
      }),
      allTagsIds () {
        let ret = []
        this.tags.forEach(el => {
          ret.push(el.id)
        })
        return ret
      },
      tags: {
        get () {
          return this.$store.state.Issues.tags
        },
        set (val) {
          this.$store.commit('Issues/SET_TAGS', val)
        }
      }
    },
    mounted () {
      window.tagsPage = this
    },
    fetch ({store}) {
      if (!store.state.projects.length) {
        return {}
      }
      let project = store.state.projects[0]
      return store.dispatch('Issues/updateTags', {idProject: project.id})
    },
    created () {
      if (this.$store.state.projects.length) {
        this.project = this.$store.state.projects[0]
      }
    },
    watch: {
      showAuto () {
        this.refresh()
      },
      project () {
        this.refresh()
      },
      '$route.query.page': function (val) {
        val && this.refresh(val)
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-tags-page {
    width: @issues-width;
    @checkbox-size: 30px;
    @checkbox-hover-color: #ddd;
    @checkbox-color: #767676;
    margin: 20px auto;
    .b-header {
      display: flex;
      align-items: center;
      height: 50px;
      .b-left, .b-right {
        width: 120px;
      }
      i {
        font-size: 1.2em;
      }
      .b-checkbox i:before {
        vertical-align: middle;
      }
      .b-left {
        display: flex;
        height: 100%;
        padding-left: 18px;
        align-items: center;
        .b-checkbox {
          i:before {
            vertical-align: bottom;
          }
        }
        .e-remove, .e-add-default {
          margin-right: 10px;
          .hover-mixin(false);
          height: @checkbox-size;
          width: @checkbox-size;
          color: @checkbox-color;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          &:hover {
            background: @checkbox-hover-color;
            color: #000;
          }
        }
        .e-remove {
          i {
            position: relative;
            left: 1px;
          }
        }
      }
      .b-center {
        display: flex;
        flex: 1;
        justify-content: center;
        .b-show-auto .b-checkbox {
          height: 100%;
          display: flex;
          align-items: center;
          margin-right: 10px;
          .hover-mixin();
          padding: 0 5px;
        }
        .b-project-selector {
          margin-right: 10px;
          .b-project {
            .hover-mixin();
            display: flex;
            align-items: center;
            overflow: hidden;
            max-width: 250px;
            padding: 5px 10px;
            .b-avatar {
              margin-right: 10px;
            }
            .e-name {
              white-space: nowrap;
              text-overflow: ellipsis;
              overflow: hidden;
              display: flex;
              align-items: center;
              height: 100%;
            }
          }
          .b-menu-content {
            .b-project {
              max-width: 150px;
            }
          }
          .b-menu-items {
            padding: 5px 0;
            max-height: 400px;
            overflow-y: auto;
          }
        }
      }
      .b-right {
        display: flex;
        justify-content: flex-end;
      }
    }
    .b-box {
      .white-box();
      padding: 15px 0;
      min-height: 42px;
      &.m-empty {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .b-tags {
        @tag-height: 34px;
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        .b-tag {
          height: @tag-height;
          display: flex;
          align-items: center;
          width: 50%;
          padding: 0 18px;
          .hover-mixin();
          font-size: 1.1rem;
          i {
            font-size: 1.2rem;
          }
          &.m-auto {
            color: #555;
          }
          .b-name, .e-cnt {
            display: flex;
            align-items: center;
            height: 100%;
          }
          .e-cnt {
            font-size: 1rem;
            color: @checkbox-color;
          }
          .b-name {
            flex: 1;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            margin-right: 5px;
            .e-name {
              position: relative;
              top: 1px;
            }
          }
          @keyframes appear {
            0% {
              background-color: rgb(57, 115, 194);
            }
            100% {
              background-color: transparent;
            }
          }
          &.m-new {
            animation: appear 1000ms linear;
          }
        }
      }
    }
    .b-pagination {
      margin-top: 10px;
    }
    .b-checkbox.m-round {
      display: flex;
      height: @checkbox-size;
      width: @checkbox-size;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      margin-right: 5px;
      color: @checkbox-color;
      &:hover {
        color: #000;
        background: @checkbox-hover-color;
      }
      .b-icon {
        margin-right: 0;
        i {
          display: block;
          text-align: center;
          &:before {
            width: auto;
            vertical-align: middle;
            margin: 0;
          }
        }
      }
    }
  }
</style>

