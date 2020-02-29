<template>
  <div class="b-edit-user">
    <form class="app-form b-user" @submit.prevent="submit('enter')">
      <div class="b-row" v-if="isStatusChangeAllowed()">
        <div class="b-label">
          <label>{{ $t('active') }}</label>
        </div>
        <div class="b-input">
          <toggle @change="userData.id ? submit('toggle') : null" v-model="isActive"></toggle>
        </div>
      </div>
      <div class="b-row m-name">
        <div class="b-label">
          <label for="user_name">{{ $t('Name') }}</label>
        </div>
        <div class="b-input">
          <input type="text" autofocus="autofocus" name="name" autocomplete="off" v-model="userData.name" id="user_name">
          <btn v-if="userData.id" :text="$t('OK')" @click="submit" :loading="this.sending === 'btnOK'"></btn>
        </div>
      </div>

      <div class="b-row">
        <div class="b-label">
          <label for="user_email">{{ $t('Email') }}</label>
        </div>
        <div class="b-input">
          <div v-if="userData.id" class="e-email">{{ userData.email }}</div>
          <input v-else type="text" name="email" v-model="userData.email" id="user_email" :disabled="userData.id">
        </div>
      </div>

      <div class="b-row m-projects" v-if="activeProjects.length">
        <div class="b-label">
          <label>{{ $t('Projects') }}</label>
        </div>
        <div class="b-input">
          <div v-for="project in activeProjects" class="b-project">
            <checkbox
              :disabled="sending === 'checkbox' || (userData.id && isLastSelectedProject(project))"
              v-tooltip="(userData.id && isLastSelectedProject(project)) ? $t('edit_user.last_project') : null"
              :value="project.id" v-model="userDataProjects"
              @change="userData.id ? submit('checkbox') : null">
              <slot>
                <avatar :name="project.name" :src="project.logo_url" size="25"></avatar>
                <div class="e-name">{{ project.name }}</div>
              </slot>
            </checkbox>
          </div>
        </div>
      </div>

      <div class="b-row m-message">
        <fadeout-message v-if="message" :class="{'error': isError, 'b-message': true}" :message="message"
                         @hide="message=null"></fadeout-message>
      </div>

      <div class="b-row m-controls">
        <div class="b-right">
          <btn :key=" 'delete' " class="e-delete" @click="deleteUser"
               v-if="this.userData.id && this.userData.status === 'new'"
               :text="$t('Delete invite')"></btn>
          <btn @click="submitActivationLink" :loading="sending === 'getlink'" ref="getLinkButton"
               :text="$t('Get activation link')"
               v-if="!isGettingLink && !activationLink && userData.id && userData.status === 'new'"
               :isSubmit="false"></btn>
          <btn :key=" 'create' " v-if="!userData.id" @click="submit('create')" :text="$t('Add')"
               :loading="this.sending === 'create'"></btn>
        </div>
      </div>
    </form>

    <div class="app-form b-activation-link" v-if="activationLink">
      <div class="b-text-row">
        <div>{{ $t('Give this link to your new worker') }}:</div>
      </div>
      <div class="b-input-row">
        <input type="text" @click="e => e.target.select()" class="js-link-input" v-model="activationLink" readonly/>
        <btn @click="copyActivationLink" :class="{['lang-' + $store.state.locale]: true}" :text="$t('Copy')"></btn>
      </div>
      <div class="b-button-row">
        <btn @click="sendActivationLink" :loading="sending === 'sendlink'" :text="$t('Send invitation email')"></btn>
        <fadeout-message :class="{'error': isErrorLink, 'b-message': true}" :message="messageLink" @hide="messageLink = null"></fadeout-message>
      </div>
    </div>
  </div>


</template>

<script>
  import Btn from '~/components/Btn'
  import Toggle from '~/components/Toggle.vue'
  import FadeoutMessage from '~/components/FadeoutMessage'
  import Checkbox from '~/components/Checkbox'
  import { getErrorFromResponse, capitalize } from '~/utils/helpers'
  import Avatar from '../Avatar.vue'

  export default {
    name: 'edit-user',
    components: {
      Avatar,
      Btn,
      FadeoutMessage,
      Checkbox,
      Toggle
    },
    props: [
      'user',
      'projects'
    ],
    data () {
      return {
        userData: {
          id: null,
          name: '',
          email: '',
          status: null
        },
        userDataProjects: [],
        activationLink: null,
        activationToken: null,
        sending: false,
        message: null,
        isError: null,
        messageLink: null,
        isErrorLink: null,
        isGettingLink: false
      }
    },
    watch: {
      userData: {
        handler: function () {
          window.onbeforeunload = e => {
            e.message = this.$t('User is not being saved')
            return this.$t('User is not being saved')
          }
        },
        deep: true
      }
    },
    computed: {
      isActive: {
        set: function (val) {
          this.userData.status = val ? 'active' : 'deleted'
        },
        get: function () {
          return this.userData.status === 'active'
        }
      },
      activeProjects () {
        let projects = this.projects.filter(val => val.is_active)
        projects.forEach(el => {
          el.name = capitalize(el.name)
        })
        return projects
      },
      userProjects () {
        return this.user.projects ? this.user.projects.map(el => el.id) : []
      },
      deletedProjects () {
        return this.userProjects.filter(val => !this.userDataProjects.includes(val))
      },
      addedProjects () {
        return this.userDataProjects.filter(val => !this.userProjects.includes(val))
      }
    },
    created () {
      if (this.user.id) {
        this.setUserData(this.user)
      } else {
        if (this.$route.query.name) {
          this.userData.name = this.$route.query.name
        }
        if (this.$route.query.email) {
          this.userData.email = this.$route.query.email
        }
      }
    },
    mounted () {
      window.editUserC = this
    },
    methods: {
      setUserData (user) {
        Object.keys(this.userData).forEach((k) => {
          this.userData[k] = user[k]
        })
        this.userDataProjects = user.projects ? user.projects.map(el => el.id) : []
        if (!process.server) {
          this.$nextTick(() => {
            window.onbeforeunload = null
          })
        }
      },
      setMessage (msg, isError) {
        this.message = msg
        this.isError = isError || false
      },
      setMessageLink (msg, isError) {
        this.messageLink = msg
        this.isErrorLink = isError || false
      },
      validateSubmit () {
        let error = null
        if (!this.userData.name.trim()) {
          error = this.$t('User name cannot be blank')
        } else if (!this.userData.email.trim()) {
          error = this.$t('User email cannot be blank')
        } else if (!this.userDataProjects.length && this.userData.status !== 'deleted') {
          error = this.$t('Select at least one project')
        }
        if (error) {
          this.setMessage(error, true)
          return false
        }
        return true
      },
      isStatusChangeAllowed () {
        return this.userData.id && ['active', 'deleted'].includes(this.userData.status)
      },
      submit (trigger = 'btnOK') {
        if (this.sending || !this.validateSubmit()) {
          return
        }
        this.sending = trigger
        if (this.userData.id) {
          this.update()
        } else {
          this.create()
        }
      },
      update () {
        const { id, status, ...params } = {
          ...this.userData,
          id_projects_add: this.addedProjects || null,
          id_projects_del: this.deletedProjects || null
        }
        if (this.isStatusChangeAllowed()) {
          params.status = status
        }
        this.$api.put('users-manage/' + id, params).then(res => {
          this.setMessage(this.$t('User settings has been updated'))
          this.setUserData(res.data.user)
          this.$emit('update', res.data.user)
        }).catch((err) => {
          this.setMessage(getErrorFromResponse(err), true)
        }).finally(() => {
          this.sending = false
        })
      },
      create () {
        const params = {
          ...this.userData,
          id_projects_add: this.addedProjects || null,
          id_projects_del: this.deletedProjects || null,
          status: 'new'
        }
        this.$api.post('users-manage', params).then(async res => {
          this.isGettingLink = true
          this.setUserData(res.data.user)
          await this.getActivationLink()
          this.setMessage(this.$t('User has been created'))
          this.$emit('update', res.data.user)
          this.$nextTick(() => {
            this.selectActivationLink()
            this.isGettingLink = true
          })
        }).catch((err) => {
          this.setMessage(getErrorFromResponse(err), true)
        }).finally(() => {
          this.sending = false
        })
      },
      deleteUser () {
        if (!window.confirm(this.$t('Are your sure?'))) {
          return
        }
        if (this.sending) {
          return
        }
        this.sending = 'delete'
        this.$api.delete('users-manage/' + this.userData.id).then(res => {
          this.$router.replace('/users')
        }).catch(err => {
          this.setMessage(getErrorFromResponse(err), true)
        }).finally(() => {
          this.sending = false
        })
      },
      getActivationLink () {
        return this.$api.post('invite/create?id_user=' + this.userData.id).then(res => {
          this.activationLink = res.data.link
          this.activationToken = res.data.token
        })
      },
      submitActivationLink () {
        if (this.sending) {
          return
        }
        this.sending = 'getlink'
        this.getActivationLink().then(() => {
          this.$nextTick(() => {
            this.selectActivationLink()
          })
        }).catch(err => {
          this.setMessage(getErrorFromResponse(err), true)
        }).finally(() => {
          this.sending = false
        })
      },
      selectActivationLink () {
        const input = document.querySelector('.js-link-input')
        input && input.select()
        window.scrollTo(0, document.body.scrollHeight)
      },
      copyActivationLink () {
        const input = document.querySelector('.js-link-input')
        input && input.select()
        if (input && document.execCommand('copy')) {
          this.setMessageLink(this.$t('Copied to clipboard'), false)
        } else {
          this.setMessageLink(this.$t('Unable to copy to clipboard'), true)
        }
      },
      sendActivationLink () {
        if (this.sending) {
          return
        }
        this.sending = 'sendlink'
        this.$api.post('invite/send?token=' + this.activationToken, {})
          .then(() => this.setMessageLink(this.$t('Invite has been successfully sent')))
          .catch((err) => {
            this.setMessageLink(getErrorFromResponse(err), true)
          })
          .finally(() => {
            this.sending = false
          })
      },
      isLastSelectedProject (project) {
        return this.userDataProjects.length === 1 && this.userDataProjects.includes(project.id)
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';


  .b-edit-user {
    margin-top: 45px;
    .b-user {
      .b-row {
        display: flex;
        align-items: center;
        @w-label: 100px;
        margin-bottom: 20px;
        min-height: 30px;
        &:last-child {
          margin-bottom: 0;
        }
        .b-label {
          width: @w-label;
          text-transform: capitalize;
        }
        &.m-projects {
          .b-label {
            align-self: flex-start;
          }
        }
        &.m-projects, &.m-message {
          margin-bottom: 10px;
          .b-message {
            color: @green-color;
            &.error {
              color: @red-color;
            }
          }
        }
        .b-input {
          flex: 1;
          display: flex;
          flex-wrap: wrap;
          .b-project {
            &:not(:last-child) {
              margin-right: 15px;
            }
            .b-checkbox {
              max-width: 200px;
              overflow: hidden;
              label {
                display: inline-flex;
                align-items: center;
                max-width: 100%;
                .b-avatar {
                  margin-right: 5px;
                  img {
                    display: block;
                  }
                }
                .e-name {
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
              }
            }
          }
          .e-email {
            margin-left: 10px;
          }
        }
        .e-delete {
          background: @red-color !important;
        }
        &.m-controls {
          display: flex;
          justify-content: flex-end;
          .btn {
            margin-left: 15px;
            min-width: 90px;
          }
          > .b-left {
            align-self: center;
            flex: 1;
          }
          > .b-right {
            justify-content: flex-end;
            display: flex;
          }
        }
        &.m-name {
          .b-input {
            align-items: center;
            input {
              width: auto;
              display: flex;
              flex: 1;
              margin-right: 5px;
            }
          }
        }
      }
    }

    .b-activation-link {
      margin-top: 20px;
      .b-text-row {
        margin-bottom: 10px;
      }
      .b-input-row {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        min-height: 30px;
        &:last-child {
          margin-bottom: 0;
        }
        .btn {
          margin-left: 5px;
        }
        input {
          flex: 1;
        }
      }
      .b-button-row {
        display: flex;
        flex-direction: row-reverse;
        align-items: center;
        .btn {
          margin-left: 5px;
        }
        .b-message {
          justify-content: flex-start;
          flex-grow: 1;
          color: @green-color;
          &.error {
            color: @red-color;
          }
        }
      }
    }
  }
</style>
