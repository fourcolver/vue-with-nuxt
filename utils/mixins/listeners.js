export default {
  data () {
    return {
      listeners: []
    }
  },
  methods: {
    addListener (target, type, handler) {
      target.addEventListener(type, handler)
      this.listeners.push({
        target,
        type,
        handler
      })
      return this.listeners.length - 1
    },
    removeAllListeners () {
      for (let i = 0; i < this.listeners.length; i++) {
        let listener = this.listeners[i]
        if (listener && listener.target) {
          listener.target.removeEventListener(listener.type, listener.handler)
        }
      }
    },
    removeListener (index) {
      let listener = this.listeners[index]
      if (listener) {
        listener.target.removeEventListener(listener.type, listener.handler)
      }
      this.listeners.splice(index, 1)
    }
  },
  beforeDestroy () {
    this.removeAllListeners()
  }
}
