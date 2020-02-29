<template>
  <div class="c-notifications-settings app-form">
    <div class="b-title">
      {{ $t('Notifications settings') }}
    </div>
    <div class="b-table" v-if="config.notifications.length">
      <div class="b-row m-head">
        <div class="b-cell"></div>
        <div class="b-cell" v-for="cat in config.categories">
          <checkbox :label="cat.name" v-model="selectedCategories" :value="cat.id" @change="submitCat(cat)"
                    v-tooltip="{ content: getCategoryTooltip(cat), placement: 'top' }"
                    :disabled="cat.slug === 'push' && !$store.state.pushEnabled"></checkbox>
        </div>
      </div>
      <div class="b-row" v-for="n in config.notifications">
        <div class="b-cell">{{ n.name }}</div>
        <div class="b-cell m-select-notification" v-for="cat in config.categories"
             v-if="findBySlug(cat.notifications, n.slug)">
          <checkbox @change="submit(findBySlug(cat.notifications, n.slug))" v-model="selected"
                    :value="findBySlug(cat.notifications, n.slug).id"
                    :disabled="cat.slug === 'push' && !$store.state.pushEnabled"></checkbox>
        </div>
        <div class="b-cell" v-else>-</div>
      </div>
    </div>
  </div>
</template>

<script>
  import Checkbox from '~/components/Checkbox'

  export default {
    name: 'notifications-settings',
    components: {
      Checkbox
    },
    data () {
      return {
        selectedCategories: [],
        selected: []
      }
    },
    mounted () {
      window.notSettings = this
    },
    props: [
      'config'
    ],
    methods: {
      submit (notification) {
        const id = notification.id
        let data = { id_del: [], id_add: [] }
        this.selected.includes(id) ? data.id_add.push(id) : data.id_del.push(id)
        this.$api.put('settings-notifications/pick-notification', data)
        const cat = this.config.categories.find(el => el.notifications.some(el => id === el.id))
        if (cat) {
          const allChecked = cat.notifications.every(el => this.selected.includes(el.id))
          if (allChecked) {
            !this.selectedCategories.includes(cat.id) && this.selectedCategories.push(cat.id)
          } else {
            this.selectedCategories.includes(cat.id) && this.selectedCategories.splice(this.selectedCategories.indexOf(cat.id), 1)
          }
        }
      },
      submitCat (cat) {
        let data = {id_del: [], id_add: []}
        if (this.selectedCategories.includes(cat.id)) {
          cat.notifications.forEach(el => !this.selected.includes(el.id) && this.selected.push(el.id))
          data.id_add.push(cat.id)
        } else {
          cat.notifications.forEach(el => this.selected.includes(el.id) && this.selected.splice(this.selected.indexOf(el.id), 1))
          data.id_del.push(cat.id)
        }
        this.$api.put('settings-notifications/pick-category', data)
      },
      findBySlug (arr, slug) {
        return arr.find(el => el.slug === slug)
      },
      getCategoryTooltip (cat) {
        return this.$t(`notifications.tooltip.${cat.slug}`)
      }
    },
    created () {
      this.config.categories.forEach(cat => {
        cat.notifications.forEach(el => {
          if (el.subscribed) {
            this.selected.push(el.id)
          }
        })
        if (!cat.notifications.some(el => !el.subscribed)) {
          this.selectedCategories.push(cat.id)
        }
      })
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .c-notifications-settings {
    .b-table {
      .b-row {
        display: flex;
        &:not(:last-child) {
          margin-bottom: 15px;
        }
        .b-cell {
          width: 22%;
          &:first-child {
            width: 34%;
          }
          &:not(:first-child) {
            text-align: center;
          }
        }
        &.m-head {
          .b-checkbox {
            .b-icon {
              margin-right: 5px;
            }
          }
        }
      }
    }
  }
</style>
