import { capitalize } from '~/utils/helpers'

export default {
  data () {
    return {
      typingUsers: [],
      typingTimeouts: {}
    }
  },
  methods: {
    socketTyping (data) {
      if (!data.user || !data.user.id || +data.user.id === +this.$store.state.webuser.user.id) {
        return
      }
      const user = data.user
      if (!this.typingUsers.find(el => +el.id === user.id)) {
        this.typingUsers.push(user)
      }
      if (this.typingTimeouts[user.id]) {
        window.clearTimeout(this.typingTimeouts[user.id])
      }
      this.typingTimeouts[user.id] = window.setTimeout(() => {
        let foundUser = this.typingUsers.find(el => +el.id === user.id)
        if (foundUser) {
          this.typingUsers.splice(this.typingUsers.indexOf(foundUser), 1)
        }
      }, 2000)
    }
  },
  computed: {
    typingMessage () {
      if (!this.typingUsers.length) {
        return ''
      }
      let str = this.typingUsers.reduce(
        (ret, el, i) => ret ? ret + (i === this.typingUsers.length - 1 ? ' ' + this.$t('and') + ' ' : ', ') +
          capitalize(el.name) : capitalize(el.name), ''
      )
      str += ' ' + this.$tc('comments.is_typing', this.typingUsers.length) + '...'
      return str
    }
  }
}
