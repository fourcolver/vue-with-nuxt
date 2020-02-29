<template>
  <div class="b-edit-profile">
    <form class="app-form" @submit.prevent="submit">
      <div class="b-row m-avatar">
        <div class="b-avatar-container">
          <upload-button maxFiles="1" :allowedExtensions="['.jpg', '.jpeg', '.png']" :onUpload="handleUpload"
                         :showIcon="false" :maxSize="30 * Math.pow(2, 20)">
            <slot>
              <avatar :userId="user.id" :src="userData.avatar_url" :isEmpty="!userData.avatar_url"
                      size="120"></avatar>
              <i class="e-remove bu-trash-empty" v-if="userData.avatar_url && !userData.avatarLoading"
                 @click.stop.prevent="removeAvatar"></i>
            </slot>
          </upload-button>
        </div>
        <div class="b-buttons">
          <language-selector :lang="$i18n.locale" @change="l => setLocale(l)" :showTitle="true"></language-selector>
          <nuxt-link class="e-change-pass" to="/profile/password">{{ $t('profile.company.change_pass')}}</nuxt-link>
        </div>
      </div>

      <div class="b-row">
        <div class="b-label">
          <label for="user_name">{{ $t('Name') }}</label>
        </div>
        <div class="b-input">
          <active-input :error="firstErrors.name" name="name" v-model="userData.name"
                        :options="{autofocus: true, id: 'user_nam'}"></active-input>
        </div>
      </div>

      <div class="b-row">
        <div class="b-label">
          <label for="user_email">{{ $t('Email') }}</label>
        </div>
        <div class="b-input">
          <active-input name="email" :error="firstErrors.email" v-model="userData.email"
                        :options="{id: 'user_email'}"></active-input>
        </div>
      </div>

      <div class="b-row">
        <div class="b-label">
          <label for="user_email_signature">{{ $t('Email signature') }}</label>
        </div>
        <div class="b-input">
          <active-input name="email_signature" :error="firstErrors.email_signature" v-model="userData.email_signature"
                        :options="{id: 'user_email_signature'}"></active-input>
        </div>
      </div>

      <div class="b-row m-buttons">
        <div class="b-left">
          <logout-link :allDevices="true">{{ $t('footer.logout_all') }}</logout-link>
          <fadeout-message :class="{'error': isError, 'b-message': true}" :message="message"
                           @hide="message=null"></fadeout-message>
        </div>
        <div class="b-right">
          <btn @click="submit" :text="$t('Save')" :loading="this.sending"></btn>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
  import Btn from '~/components/Btn'
  import FadeoutMessage from '~/components/FadeoutMessage'
  import Avatar from '~/components/Avatar'
  import UploadButton from '~/components/UploadButton'
  import Dropdown from '~/components/Dropdown.vue'
  import LanguageSelector from '../LanguageSelector.vue'
  import ActiveInput from '../ActiveInput.vue'
  import LogoutLink from '~/components/LogoutLink.vue'

  export default {
    name: 'edit-profile',
    components: {
      ActiveInput,
      LanguageSelector,
      Dropdown,
      Btn,
      FadeoutMessage,
      Avatar,
      UploadButton,
      LogoutLink
    },
    data () {
      return {
        userData: {
          name: '',
          email: null,
          avatar_url: null,
          email_signature: null
        },
        firstErrors: {
          name: '',
          email: '',
          avatar_url: '',
          email_signature: ''
        },
        message: null,
        isError: null,
        sending: false,
        avatarLoading: false,
        languages: [
          {
            id: 'ru-RU',
            name: 'Русский'
          },
          {
            id: 'en-US',
            name: 'English'
          }
        ]
      }
    },
    props: [
      'user'
    ],
    created () {
      this.user.id && this.setProfileData(this.user)
    },
    methods: {
      setProfileData (user) {
        Object.keys(this.userData).forEach((k) => {
          this.userData[k] = user[k]
        })
      },
      back () {
        this.$router.go(-1)
      },
      setMessage (msg, isError) {
        this.message = msg
        this.isError = isError || false
      },
      submit () {
        if (this.sending) {
          return
        }
        this.sending = true

        let params = {...this.userData}
        delete params.avatar_url
        this.$api.put('users/update-profile', params)
          .then((response) => {
            this.setProfileData(response.data.user)
            this.setMessage(this.$t('Profile has been updated'))
            this.$emit('update', response.data.user)
          })
          .catch((err) => {
            if (err.response && err.response.data && err.response.data.first_errors) {
              this.firstErrors = {...err.response.data.first_errors}
            }
          })
          .finally(() => {
            this.sending = false
          })
      },
      removeAvatar () {
        this.userData.avatar_url = null
        this.$api.delete('users/remove-avatar').then(res => {
          this.$emit('update', res.data.user)
        })
      },
      handleUpload (e) {
        let reader = new FileReader()
        let file = e.target.files[0]
        reader.onload = e => {
          this.userData.avatar_url = e.target.result
          let formData = new FormData()
          this.avatarLoading = true
          formData.append('file', file)
          this.$api.post('/users/update-profile', formData).then(res => {
            this.setMessage(this.$t('Profile has been updated'))
            this.$emit('update', res.data.user)
          }).catch(() => {
            alert(this.$t('Operation cannot be done now'))
          }).finally(() => {
            this.avatarLoading = false
          })
        }
        reader.readAsDataURL(file)
      },
      setLocale (val) {
        this.$store.dispatch('updateUserSettings', { lang: val })
          .then(() => {
            window.location.reload(true)
            this.$i18n.locale = val
            this.$store.commit('SET_LOCALE', val)
          })
          .catch(() => {
            alert(this.$t('Operation cannot be done now'))
          })
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .b-edit-profile {
    margin-bottom: 20px;
    form {
      .b-text {
        padding: 9px 0;
      }
      .b-avatar-container {
        cursor: pointer;
        position: relative;
        @w-avatar: 120px;
        .e-upload {
          border-radius: 50%;
          img {
            max-width: @w-avatar;
            max-height: @w-avatar;
            object-fit: cover;
            display: block;
          }
          .e-empty-avatar {
            top: 0;
          }
          .e-remove {
            width: 28px;
            height: 28px;
            font-size: 1.1em;
            position: absolute;
            top: 5px;
            right: 5px;
            display: none;
            .remove-trash();
          }
          &:hover {
            .e-remove {
              display: flex;
            }
          }
        }
      }

      .b-row {
        @w-label: 140px;
        margin-bottom: 20px;
        min-height: 30px;
        display: flex;
        .b-label {
          width: @w-label;
        }
        .b-input {
          flex: 1;
          .c-active-input {
            input, textarea {
              .text-input();
            }
          }
          .e-errors {
            font-size: 12px;
            color: @red-color;
            margin-top: 5px;
          }
        }
        &:last-child {
          margin-bottom: 0;
        }
        &.m-avatar {
          justify-content: center;
          margin-bottom: 30px;
          position: relative;
          .b-buttons {
            position: absolute;
            top: 0;
            right: 0;
            display: flex;
            align-items: center;
            .c-language-selector {
              margin-right: 10px;
              .e-title {
                color: @basic-blue;
              }
            }
          }
        }
        &.m-buttons {
          .b-left {
            flex: 1;
            display: flex;
            align-items: center;
            .b-message {
              padding-top: 8px;
              color: @green-color;
              &.error {
                color: @red-color;
              }
            }
          }
          .b-right {
            .btn {
              min-width: 90px;
            }
          }
        }
      }
      .e-change-pass, .e-link {
        color: @basic-blue;
      }
      .e-link:hover {
        text-decoration: underline;
      }
    }
  }
</style>
