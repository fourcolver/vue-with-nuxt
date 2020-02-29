<template>
  <div class="b-edit-project">
    <form class="app-form b-project" @submit.prevent="submit">
      <div class="b-columns">
        <div class="b-right">
          <div class="b-avatar-container">
            <upload-button maxFiles="1" :maxSize="30 * Math.pow(2, 20)" :allowedExtensions="['.jpg', '.jpeg', '.png']"
                           :onUpload="handleUpload"
                           :showIcon="false" :title="$t('Click to upload a new logo')">
              <slot>
                <avatar :src="logoSrc || projectData.logo_url" :size="80" :name="projectData.name || ''"></avatar>
                <i @click.stop="removeLogo" v-if="projectData.logo_url || logoSrc" class="bu-trash-empty e-remove"
                   :title="$t('Remove logo')"></i>
              </slot>
            </upload-button>
          </div>
        </div>

        <div class="b-left">
          <div class="float">

            <div class="b-row">
              <div class="b-label">
                <label>{{ $t('active') }}</label>
              </div>
              <div class="b-input m-is-active">
                <toggle @change="projectData.id ? submit('toggle') : null" v-model="projectData.is_active"></toggle>
                <span v-if="projectData.id && !projectData.is_active" @click="deleteProject"
                      class="e-delete">{{ $t('edit_project.delete_link')}}</span>
              </div>
            </div>

            <div class="b-row m-name">
              <div class="b-label">
                <label for="project_name">{{ $t('project.name') }}</label>
              </div>
              <div class="b-input">
                <input autocomplete="false" maxlength="255" spellcheck="false" type="text" name="name" v-model="projectData.name"
                       id="project_name">
                <btn v-if="projectData.id" :is-submit="false" @click="submit('okButton')" text="OK"
                     :loading="this.loading === 'okButton' "></btn>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div class="b-row" v-if="users.length">
        <div class="b-label">
          <label>{{ $t('Users') }}</label>
        </div>
        <div class="b-input">
          <div v-for="user in activeUsers" class="b-item" v-if="user.name">
            <checkbox @change="projectData.id ? submit('checkbox') : null" :value="user.id"
                      v-model="projectData.users" :disabled="loading === 'checkbox' ">
              <slot>
                <avatar :userId="user.id" size="25"></avatar>
                <div class="e-name">{{ user.name }}</div>
              </slot>
            </checkbox>
          </div>
        </div>
      </div>

      <div class="b-row m-skip-watch">
        <toggle @change="projectData.id ? submit('toggle') : null" v-model="projectData.is_owner_watcher"></toggle>
        <div class="e-label">
          {{ $t('Add me as watcher to tickets created by others') }}
        </div>
      </div>

      <div class="b-row m-messages">
        <fadeout-message class="b-success-msg" :message="successMessage"
                         @hide="successMessage = null"></fadeout-message>
        <fadeout-message class="b-error-msg" :message="errorMessage" @hide="errorMessage = null"></fadeout-message>

        <btn class="e-save" v-if="!projectData.id" :is-submit="false" @click="submit" :text="$t('Save')"
             :loading="this.loading"></btn>
      </div>
    </form>
  </div>
</template>

<script>
  import Avatar from '../../components/Avatar.vue'
  import Toggle from '../../components/Toggle.vue'
  import UploadButton from '../../components/UploadButton.vue'
  import Btn from '../../components/Btn.vue'
  import FadeoutMessage from '../../components/FadeoutMessage.vue'
  import Checkbox from '../../components/Checkbox.vue'
  import { getErrorFromResponse, capitalize, objectToFormData } from '~/utils/helpers'

  export default {
    name: 'edit-project',
    components: {
      Checkbox,
      FadeoutMessage,
      Btn,
      UploadButton,
      Avatar,
      Toggle
    },
    props: [
      'project',
      'users'
    ],
    data () {
      return {
        projectData: {
          id: null,
          name: '',
          is_active: true,
          users: [],
          is_owner_watcher: true
        },
        uploadedSrc: null,
        loading: false,
        file: {},
        logoRemoved: false,
        successMessage: '',
        errorMessage: '',
        uploadPromise: null
      }
    },
    watch: {
      editableFields: {
        handler: function () {
          window.onbeforeunload = e => {
            e.message = this.$t('Project is not being saved')
            return this.$t('Project is not being saved')
          }
        },
        deep: true
      }
    },
    mounted () {
      window.editProject = this
    },
    computed: {
      logoSrc () {
        if (!this.project) {
          return ''
        }
        return this.uploadedSrc || this.projectData.logo_url
      },
      activeUsers () {
        let users = this.users.filter(val => val.status === 'active')
        users.forEach(el => {
          el.name = capitalize(el.name)
        })
        return users
      },
      projectUsers () {
        return this.project.users ? this.project.users.map(el => el.id) : []
      },
      deletedUsers () {
        return this.projectUsers.filter(val => !this.projectData.users.includes(val))
      },
      addedUsers () {
        return this.projectData.users.filter(val => !this.projectUsers.includes(val))
      },
      editableFields () {
        return [this.projectData.name, this.projectData.is_active, this.projectData.users, this.projectData.is_owner_watcher]
      }
    },
    created () {
      this.project.id && this.setProjectData(this.project)
    },
    methods: {
      setProjectData (project) {
        this.projectData = {
          ...project,
          users: project.users ? project.users.map(el => el.id) : []
        }
        if (!process.server) {
          this.$nextTick(() => {
            window.onbeforeunload = null
          })
        }
      },
      removeLogo () {
        this.uploadedSrc = ''
        this.file = {}
        if (this.projectData.logo_url) {
          this.logoRemoved = true
          this.projectData.logo_url = ''
          this.$api.delete('projects-manage/remove-logo?id=' + this.projectData.id)
        }
      },
      handleUpload (e) {
        this.file = e.target.files[0]
        let reader = new FileReader()
        reader.onload = e => {
          this.uploadedSrc = e.target.result
          if (this.projectData.id) {
            let fd = new FormData()
            fd.append('file', this.file)
            this.$api.post('projects-manage/update?id=' + this.projectData.id, fd)
          }
        }
        reader.readAsDataURL(this.file)
      },
      async submit (trigger = 'saveBtn') {
        if (!this.projectData.name) {
          this.errorMessage = this.$t('edit_project.empty_name')
          return
        }
        this.loading = trigger
        let data = {
          name: this.projectData.name,
          is_active: +this.projectData.is_active,
          is_owner_watcher: +this.projectData.is_owner_watcher
        }
        if (this.addedUsers.length) {
          data.id_users_add = this.addedUsers
        }
        if (this.deletedUsers.length) {
          data.id_users_del = this.deletedUsers
        }
        if (this.file) {
          data.file = this.file
        }
        let apiCall
        if (this.projectData.id) {
          apiCall = this.$api.post(`projects-manage/update?id=${this.projectData.id}`, objectToFormData(data))
        } else {
          apiCall = this.$api.post('projects-manage', objectToFormData(data))
        }
        apiCall.then(res => {
          this.file = {}
          this.$emit('update', res.data.project)
          this.setProjectData(res.data.project)
          this.successMessage = this.$t('Project successfully saved')
        }).catch((err) => {
          this.errorMessage = getErrorFromResponse(err)
        }).finally(() => {
          this.loading = false
        })
      },
      async deleteProject () {
        await this.$confirm({
          text: this.$t('edit_project.delete_confirm'),
          yesLabel: this.$t('edit_project.delete_yes'),
          noLabel: this.$t('edit_project.delete_no')
        })
        this.$api.delete('projects-manage/remove?id=' + this.projectData.id).then(() => {
          this.$router.push('/projects')
        })
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .b-edit-project {
    .b-project {
      .b-avatar-container {
        margin-right: 10px;
        cursor: pointer;
        float: right;
        position: relative;
        @w-avatar: 80px;
        .e-upload {
          border-radius: 50%;
          img {
            max-width: @w-avatar;
            max-height: @w-avatar;
            display: block;
            object-fit: cover;
          }
          .e-empty-avatar {
            top: 0;
          }
          .e-remove {
            .remove-trash();
            position: absolute;
            display: none;
            top: 3px;
            right: 3px;
            width: 22px;
            height: 22px;
          }
          &:hover {
            .e-remove {
              display: flex;
            }
          }
        }
      }

      .b-columns {
        margin-bottom: 20px;
        &:after {
          .after-clearfix;
        }
        @w-right: 120px;
        .b-right {
          float: right;
          width: @w-right;
          text-align: right;
        }
        .b-left {
          margin-right: @w-right;
          &:after {
            .after-clearfix;
          }
        }
      }

      .b-row {
        @w-label: 100px;
        margin-bottom: 20px;
        &:last-child {
          margin-bottom: 0;
        }
        &:after {
          .after-clearfix;
        }
        .b-label {
          width: @w-label;
          float: left;
          text-transform: capitalize;
        }
        .b-input {
          margin-left: @w-label;
          display: flex;
          flex-wrap: wrap;
          &:after {
            .after-clearfix;
          }
          .b-toggle {
            position: relative;
            top: 5px;
          }
          .b-item {
            &:not(:last-child) {
              margin-right: 15px;
            }
            .b-checkbox {
              label {
                display: inline-flex;
                align-items: center;
                .b-avatar {
                  margin-right: 5px;
                  img {
                    display: block;
                  }
                }
              }
            }
          }
          &.m-is-active {
            height: 35px;
            align-items: center;
            .b-toggle {
              top: 0;
            }
            .e-delete {
              margin-left: 15px;
              color: @red-color;
              &:hover {
                cursor: pointer;
                text-decoration: underline;
              }
            }
          }
        }
        &.m-name {
          .b-input {
            flex-wrap: nowrap;
            .btn {
              margin-left: 5px;
            }
          }
        }
        .btn.e-save {
          float: right;
          margin-left: 15px;
          min-width: 90px;
        }
        .b-success-msg, .b-error-msg {
          float: left;
          padding-top: 8px;
          color: @green-color;
        }
        .b-error-msg {
          color: @red-color;
        }
        &.m-skip-watch {
          display: flex;
          .e-label {
            height: 22px;
            align-items: center;
            margin-left: 15px;
            display: inline-flex;
          }
        }
        &.m-messages {
          height: 24px;
        }
      }
    }
  }
</style>
