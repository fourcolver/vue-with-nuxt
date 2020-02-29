<template>
  <div class="app-unsubscribe app-form">
    <div class="b-title">
      {{ $t('Successfully unsubscribed') }}
    </div>

    <div v-if="action === 'watching'">
      {{ user.email }} {{ $t('successfully unsubscribed from watching ticket') }}
      <quwi-link v-if="$route.query.project" :to="{name: 'comments.project', params: {project: $route.query.project}, query: {'issue': issueNumber}}">#{{issueNumber}}</quwi-link>
      <span v-else>#{{issueNumber}}</span>
    </div>
    <div v-else>
      {{ user.email }} {{ $t('successfully unsubscribed from notifications') }}
      <span v-if="itemName">"{{ itemName }}"</span>
      <br><br><quwi-link :to="{path: '/profile'}">{{ $t('Manage my email notifications') }}</quwi-link>
    </div>
  </div>
</template>

<script>
  import { raiseError } from '~/utils/helpers'

  export default {
    components: {},
    data () {
      return {
        user: {},
        action: '',
        id: '',
        issueNumber: '',
        itemName: ''
      }
    },
    asyncData ({store, query, error, app, params}) {
      let slug = params.slug || null
      let action = params.action || null
      let id = params.id || null
      let promises = [
        app.$api.get('users/by-hash', {hash: slug}),
        app.$api.get('settings-notifications', {hash: slug})
      ]

      switch (action) {
        case 'email':
          promises.push(app.$api.put('settings-notifications/pick-notification?hash=' + slug, {id_del: [id]}))
          break
        case 'category':
          promises.push(app.$api.put('settings-notifications/pick-category?hash=' + slug, {id_del: [id]}))
          break
        case 'watching':
          promises.push(app.$api.put('issues/stop-watching?hash=' + slug + '&id_issue=' + id))
          break
        default:
          error({ statusCode: 404, message: 'Page not found' })
      }

      return Promise.all(promises).then((results) => {
        // request data
        let data = {}
        results.forEach((res) => {
          data = { ...data, ...res.data }
        })
        if (!data.user || !data.categories.length || !data.notifications.length) {
          error({ statusCode: 404, message: 'Page not found' })
        }
        // get itemName
        let itemName = null
        let issueNumber = null
        switch (action) {
          case 'watching':
            issueNumber = data.issue.number
            break
          case 'email':
            const cat = data.categories.find(el => el.notifications.some(n => +n.id === +id))
            if (cat) {
              const notification = cat.notifications.find(el => +el.id === +id)
              const baseNotification = data.notifications.find(el => el.slug === notification.slug)
              if (baseNotification) {
                itemName = baseNotification.name
              }
            }
            if (!itemName) {
              error({ statusCode: 404, message: 'Page not found' })
            }
            break
          case 'category':
            let category = data.categories.find((cat) => +cat.id === +id)
            itemName = category && category.name
            if (!itemName) {
              error({ statusCode: 404, message: 'Page not found' })
            }
            break
        }

        return {
          user: data.user,
          action: action,
          id: id,
          itemName: itemName,
          issueNumber: issueNumber
        }
      }).catch((e) => raiseError(error, e))
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';
  @import '~assets/css/menu.less';

  .app-unsubscribe {
    width: @comment-width;
    margin: 20px auto;

    .b-title {
      text-transform: capitalize;
    }
  }
</style>

