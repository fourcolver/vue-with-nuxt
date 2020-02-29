<template xmlns="http://www.w3.org/1999/html">
  <div>
    <form @submit.prevent="send" class="b-form">
      <div class="b-row">
        <input @keyup.ctrl.up="up" v-model="url">
      </div>
      <div class="b-row">
        <btn @click="send" :loading="loading" :text="$t('hello')"></btn>
      </div>
    </form>
    <pre v-if="json" v-html="pp(json)"></pre>
    <a @click="emitNew">emit chat new</a>
    <date-picker></date-picker>
    <audio-recorder :text="false" :file="true"></audio-recorder>
    <div id="m"></div>
  </div>
</template>
<script>
  import Btn from '../../components/Btn.vue'
  import PriorityLabel from '~/components/PriorityLabel.vue'
  import DocViewer from '../../components/DocViewer.vue'
  import DatePicker from '../../components/DatePicker.vue'
  import AudioRecorder from '../../components/AudioRecorder.vue'
  import Vue from 'vue'
  import AudioPlayer from '../../components/AudioPlayer.vue'
  import { trimHTML } from '~/utils/dom'

  export default {
    components: {
      AudioRecorder,
      DocViewer,
      PriorityLabel,
      Btn,
      DatePicker
    },
    data () {
      return {
        'json': null,
        url: '',
        result: '',
        loading: false,
        isTyping: false
      }
    },
    methods: {
      pp (json) {
        if (typeof json !== 'string') {
          json = JSON.stringify(json, undefined, 2)
        }
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
          var cls = 'number'
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'key'
            } else {
              cls = 'string'
            }
          } else if (/true|false/.test(match)) {
            cls = 'boolean'
          } else if (/null/.test(match)) {
            cls = 'null'
          }
          return '<span class="' + cls + '">' + match + '</span>'
        })
      },
      send () {
        this.loading = true
        this.$api.get(this.url).then((res) => {
          this.json = res.data
          // document.body.appendChild(document.createElement('pre')).innerHTML = this.pp(res.data.users)
        }).finally(() => {
          this.loading = false
        })
      },
      up () {
        alert('Up!')
      },
      type () {
        this.$socket.emit('typing')
      },
      dateConstructor (param = null) {
        let d = param ? new Date(param) : new Date()
        if (param) {
          return d
        } else {
          let oldTime = +d
          let shift = d.getTimezoneOffset() - this.$store.getters['webuser/company'].timezone_offset
          return new Date(oldTime + shift * 60 * 1000)
        }
      },
      emitNew () {
        this.$socket.emit('chat_new_message', {id_recipients: [15], data: {id_channel: 144, id_message: 902}})
      },
      trimHTML
    },
    watch: {
      url (val) {
        localStorage.setItem('last_test_url', val)
      }
    },
    mounted () {
      window.issueTest = this
      this.url = localStorage.getItem('last_test_url')
      const Ap = Vue.extend(AudioPlayer)
      const vm = new Ap({
        propsData: {
          file: {
            'base_name': 'voice_message_2019-01-15_21-09-11-6817.ogg',
            'size': 59679,
            'mime_type': 'audio/ogg',
            'info': {
              'file': {
                'url': 'https://api.quwi.com/v2/chat-messages/send-attachment?hash=hsHCX_LwKAAwwzTsyEucsvTWIa5NRQVO&profile=file&ext=ogg',
                'sizes': {
                  'w': 0,
                  'h': 0
                }
              }
            }
          }
        }
      })
      vm.$mount()
      document.querySelector('#m').appendChild(vm.$el)
    }
  }
</script>

<style>
  pre { outline: 1px solid #ccc; padding: 5px; background: #fff;margin: 15px; font-size: 1.3em; }

  .string { color: green; }

  .number { color: darkorange; }

  .boolean { color: blue; }

  .null { color: #219; }

  .key { color: #a11; }
</style>

<style type="text/less" lang="less">
  @import '~assets/css/mixins.less';

  .b-form {
    width: 500px;
    padding: 15px;
    .b-row {
      input {
        .text-input()
      }
      margin-bottom: 10px;
    }
  }
</style>
