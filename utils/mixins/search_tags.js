import { debounce } from 'lodash'

export default {
  data () {
    return {
      isFetchingTags: false,
      currentSuggestions: []
    }
  },
  methods: {
    checkTagSuggest (e, byKeyword = true) {
      this.fetchTags(this, byKeyword ? e.target.value.trim() : null)
    },
    fetchTags: debounce((vm, text) => {
      if (text === '') {
        vm.$refs.suggest.hide()
      } else {
        text = text || ''
        const project = vm.$store.getters['company/getProject'](vm.$route.params.project)
        if (!project) {
          return
        }
        vm.isFetchingTags = true
        vm.$api.get('categories', {
          filters: {
            keyword: text,
            is_auto: 0,
            id_project: project.id
          },
          'per-page': 100
        }).then(res => {
          let tags = res.data.categories
          if (tags.length) {
            vm.$refs.suggest && vm.$refs.suggest.show(tags.map(el => ({text: el.name, data: el})), text)
          } else {
            vm.$refs.suggest && vm.$refs.suggest.hide()
          }
          vm.currentSuggestions = tags
        }).finally(() => {
          vm.isFetchingTags = false
        })
      }
    }, 300, {leading: true})
  }
}
