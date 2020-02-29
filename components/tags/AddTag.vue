<template>
  <div class="c-add-tag b-modal-overlay" @click="$emit('cancel')" v-key-escape="() => $emit('cancel')">
    <div class="b-modal" @click.stop="">
      <form class="b-form" @submit.prevent="!adding && addTag">
        <active-input name="name"
                      :options="{placeholder: $t('add_tag.name_placeholder'), autofocus: true, maxlength: 24}"
                      :error="firstErrors.name"
                      v-model="name"></active-input>
        <active-input ref="cntUse" name="cnt_use"
                      :options="{placeholder: $t('edit_tag.cnt_use_placeholder'), maxlength: 6}"
                      :error="firstErrors.cnt_use"
                      v-model="cntUse" pattern="\d+"></active-input>
        <btn :loading="adding" :text="$t('Save')" @click="addTag"></btn>
      </form>
    </div>
  </div>
</template>

<script>
  import ActiveInput from '../ActiveInput.vue'
  import Btn from '../Btn.vue'

  export default {
    components: {
      Btn,
      ActiveInput
    },
    name: 'add-tag',
    props: ['project'],
    data () {
      return {
        name: '',
        cntUse: 0,
        firstErrors: {
          name: '',
          cnt_use: ''
        },
        adding: false
      }
    },
    methods: {
      addTag () {
        if (!this.name) {
          this.firstErrors.name = this.$t('add_tag.name_required')
          return
        }
        this.adding = true
        this.$store.dispatch('Issues/addTag', {
          name: this.name,
          idProject: this.project.id,
          cntUse: this.cntUse || 0,
          noMutation: true
        }).then(tag => this.$emit('add', tag))
          .catch(err => {
            if (err.response && err.response.data && err.response.data.first_errors) {
              this.firstErrors = {...err.response.data.first_errors}
            }
          })
          .finally(() => {
            this.adding = false
          })
      }
    },
    computed: {}
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-add-tag {
    .b-modal {
      width: 400px;
      padding: 25px 15px 20px 15px;
      .b-form {
        text-align: center;
        .c-active-input {
          margin-bottom: 20px;
          .b-input-group .b-input .m-top-text.e-placeholder {
            color: #777;
          }
          input {
            .text-input();
          }
        }
      }
    }
  }
</style>