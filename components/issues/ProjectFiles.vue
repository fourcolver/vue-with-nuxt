<template>
  <div class="c-project-files">
    <div class="b-header">
      <div class="b-left">
        <div class="e-sort">{{ $t('sort_by') }}</div>
        <dropdown :options="sortOptions"
                  :selected="sortBy"
                  :onChange="v => sortBy = v"></dropdown>
      </div>
      <div class="b-right">
        <upload-button :locked="sending" :showIcon="false" :maxSize="300 * Math.pow(2, 20)" :onUpload="handleUpload">
          <btn :loading="sending" :text="$t('project_files.add_file')" :active="checkAccess('disc_space')"
               :inactiveTooltip="noDiscHint"></btn>
        </upload-button>
      </div>
    </div>
    <template v-if="files.length">
      <div class="b-files" v-if="files.length">
        <div class="b-file" v-for="file in files" @click="download(file)">
          <div class="b-inner">
            <div class="b-user">
              <avatar :userId="file.id_user" size="25"></avatar>
            </div>
            <div class="e-name">{{ file.base_name }}</div>
            <div class="e-remove" @click.stop="remove(file)"
                 v-if="file.id_user === $store.state.webuser.user.id || $store.getters['webuser/checkAccess']('owner')">
              <i class="bu-trash-empty"></i>
            </div>
            <div class="e-date">{{ $date(file.dta_create).format('DD MMMM YYYY') }}</div>
            <div class="e-size">{{ formatFileSize(file.size) }}</div>
          </div>
        </div>
      </div>
      <div class="b-load-more" @click="!loading && loadMore()" v-if="!isLastPage">
        <a href="#" @click.prevent="">{{ $t('load_more') }}</a>
      </div>
    </template>
    <div class="b-empty" v-else>{{ $t('project_files.no_files') }}</div>
  </div>
</template>

<script>
  import { mapState, mapGetters } from 'vuex'
  import Btn from '../Btn.vue'
  import UploadButton from '../UploadButton.vue'
  import { formatFileSize } from '~/utils/helpers'
  import Avatar from '../Avatar.vue'
  import Dropdown from '../Dropdown.vue'
  import { getNoDiscHint } from '~/utils/issues'

  export default {
    components: {
      Dropdown,
      Avatar,
      UploadButton,
      Btn
    },
    name: 'project-files',
    data () {
      return {
        sending: false,
        sortBy: 'base_name',
        page: 1,
        loading: false
      }
    },
    methods: {
      async handleUpload (e) {
        if (!e.target.files || !e.target.files[0]) {
          return false
        }
        this.sending = true
        let file = e.target.files[0]
        let formData = new FormData()
        formData.append('base_name', file)
        if (this.activeProject) {
          formData.append('id_project', this.activeProject.id)
        }
        this.$api.post('files', formData).then(() => this.refresh().then(() => {
          this.sending = false
        }))
      },
      download (file) {
        window.location.href = file.url + (file.url.indexOf('?') === -1 ? '?' : '&') + 'access_token=' + this.$store.state.webuser.tokens.access_token
      },
      async remove (file) {
        await this.$confirm(this.$t('project_files.delete_confirm'))
        this.$api.delete('files/delete?id=' + file.id).then(() => {
          this.files.splice(this.files.indexOf(file), 1)
        })
      },
      update () {
        this.loading = true
        return this.$store.dispatch('updateFiles', {sort: this.sortBy, page: this.page}).then(() => {
          this.loading = false
        })
      },
      refresh () {
        this.page = 1
        return this.update()
      },
      loadMore () {
        this.page++
        return this.update()
      },
      formatFileSize
    },
    computed: {
      ...mapState({
        files: state => state.files,
        headers: state => state.filesHeaders
      }),
      ...mapGetters({
        activeProject: 'activeProject',
        checkAccess: 'webuser/checkAccess'
      }),
      sortOptions () {
        return [
          {
            id: 'base_name',
            name: this.$t('project_files.sort_base_name')
          },
          {
            id: 'dta_create',
            name: this.$t('project_files.sort_dta_create')
          },
          {
            id: 'size',
            name: this.$t('project_files.sort_size')
          }

        ]
      },
      isLastPage () {
        return +this.headers['x-pagination-current-page'] === +this.headers['x-pagination-page-count']
      },
      noDiscHint () {
        return getNoDiscHint(this)
      }
    },
    watch: {
      sortBy () {
        this.refresh()
      }
    },
    mounted () {
      window.projectFiles = this
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-project-files {
    .white-box();
    margin: 20px auto;
    width: @issues-width;
    @table-border: 1px solid #ddd;
    .b-header {
      display: flex;
      padding: 10px 20px;
      align-items: center;
      margin: 0 10px;
      .b-left {
        flex: 1;
        display: flex;
        align-items: center;
        .e-sort {
          margin-right: 7px;
        }
      }
      .b-right {
        .e-upload {
          padding: 0;
        }
      }
      border-bottom: @table-border;
    }
    .b-files {
      .b-file {
        .hover-mixin();
        > .b-inner {
          display: flex;
          align-items: center;
          height: 45px;
          padding: 0 10px;
          margin: 0 10px;
          > div {
            padding: 0 7px;
          }
          .e-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .e-remove {
            border-radius: 50%;
            .hover-mixin(false);
            width: 25px;
            height: 25px;
            padding: 0;
            align-items: center;
            justify-content: center;
            visibility: hidden;
            display: flex;
          }
          &:hover {
            .e-remove {
              visibility: visible;
            }
          }

          .e-size, .e-date {
            color: #595959;
          }
          .e-size {
            width: 80px;
            text-align: right;
          }
          .e-date {
            width: 135px;
            white-space: nowrap;
            text-align: right;
          }
        }
        &:not(:last-child) > .b-inner {
          border-bottom: @table-border;
        }
      }
    }
    .b-load-more {
      height: 45px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-top: 1px solid #ddd;
      .hover-mixin();
      a {
        color: @basic-blue;
      }
    }
    .b-empty {
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
</style>