<template>
  <div class="c-edit-tag b-modal-overlay" @click="$emit('cancel')" v-key-escape="() => $emit('cancel')">
    <div class="b-modal" @click.stop="">
      <form class="b-form" @submit.prevent="!saving && save">
        <active-input name="name"
                      :options="{placeholder: $t('edit_tag.name_placeholder'), autofocus: true, maxlength: 24}"
                      :error="firstErrors.name"
                      v-model="name"></active-input>
        <active-input ref="cntUse" name="cnt_use"
                      :options="{placeholder: $t('edit_tag.cnt_use_placeholder'), maxlength: 6}"
                      :error="firstErrors.cnt_use"
                      v-model="cntUse" pattern="\d+"></active-input>
        <btn :loading="saving" :text="$t('Save')" @click="save"></btn>
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
    name: 'edit-tag',
    props: ['tag'],
    data () {
      return {
        name: '',
        cntUse: 0,
        firstErrors: {
          name: '',
          cnt_use: ''
        },
        saving: false
      }
    },
    methods: {
      save () {
        if (!this.name) {
          this.firstErrors.name = this.$t('add_tag.name_required')
          return
        }
        this.saving = true
        this.$api.put('categories/' + this.tag.id, {
          name: this.name,
          cnt_use: this.cntUse || 0
        }).then(res => this.$emit('save', res.data.category))
          .catch(err => {
            if (err.response && err.response.data && err.response.data.first_errors) {
              this.firstErrors = {...err.response.data.first_errors}
            }
          })
          .finally(() => {
            this.saving = false
          })
      }
    },
    computed: {},
    created () {
      this.name = this.tag.name
      this.cntUse = this.tag.cnt_use || 0
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-edit-tag {
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