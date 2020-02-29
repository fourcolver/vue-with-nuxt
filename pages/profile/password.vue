<template>
  <div class="app-profile-password" v-cloak>
    <div class="app-top-container">
      <div class="b-center">
        <div class="b-left">
          {{ $t('profile.company.change_pass') }}
        </div>
      </div>
    </div>
    <div class="b-page-content">
      <edit-password></edit-password>
    </div>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import EditPassword from '~/components/profile/EditPassword'
  import LogoutLink from '~/components/LogoutLink.vue'

  export default {
    components: { EditPassword, LogoutLink },
    middleware: 'member',
    computed: {
      ...mapState('webuser', ['user'])
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .app-profile-password {
    .app-top-container {
      .top-row;
      .b-center {
        line-height: @app-top-container-height - 2;
        width: @center-width;
        margin: auto;
        font-size: 18px;
        font-weight: bold;
        &:after { .after-clearfix }
        @w-right: 100px;
        .b-left {
          margin-right: @w-right;
          .str-truncate;
        }
        .b-right {
          float: right;
          width: @w-right;
          text-align: right;
          .b-logout {
            display: inline-block;
            line-height: @app-top-container-height - 2;
            padding: 0 15px;
            cursor: pointer;
            .hover-mixin(false);
          }
        }
      }
    }
    .b-page-content {
      padding: 20px 0;
      width: @center-width;
      margin: auto;
    }
  }
</style>

