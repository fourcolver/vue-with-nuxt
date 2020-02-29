<template>
  <div class="c-audio-recorder" tabindex="0" @mousedown="start" @mouseup="mouseup" v-tooltip="disabledTooltip">
    <i :class="{'recording' : isMouseDown, disabled, 'disabled': disabledExternal}" class="bu-microphone"></i>
  </div>
</template>

<script>
  export default {
    name: 'audio-recorder',
    props: {
      file: {
        default: true
      },
      text: {
        default: false
      },
      disabledExternal: {
        type: Boolean,
        default: false
      },
      safeAreaRef: {
        type: String,
        default: null
      }
    },
    data () {
      return {
        recorder: null,
        recording: false,
        recognition: false,
        debug: false,
        disabled: false,
        insideSafeArea: true,
        safeArea: null,
        userMediaPromise: null,
        isStoped: false,
        currentStream: null,
        isMouseDown: false,
        recordTime: 0,
        recordInterval: null
      }
    },
    mounted () {
      if (this.safeAreaRef) {
        this.safeArea = this.$parent.$refs[this.safeAreaRef]
      }
    },
    methods: {
      stop () {
        if (this.disabledExternal) {
          return
        }
        this.recording = false

        if (this.file) {
          this.recorder && this.recorder.state === 'recording' && this.recorder.stop()
        }
        if (this.text) {
          this.recognition && this.recognition.stop()
        }
        this.recording = false
        this.$emit('recorderStateChanged', { recording: false, safeArea: true, recordTime: 0 })
        document.body.classList.remove('m-resizer-no-select')
        document.removeEventListener('mouseup', this.mouseup)
        document.removeEventListener('mousemove', this.mousemove)
      },
      mouseup () {
        this.isMouseDown = false
        this.stop()
      },
      mousemove (e) {
        const hovered = e.target
        if (this.safeArea !== hovered && this.safeArea.contains(hovered)) {
          this.insideSafeArea = true
        } else {
          this.insideSafeArea = false
        }
        this.$emit('recorderStateChanged', { safeArea: this.insideSafeArea })
      },
      async recorderResult (stream) {
        return new Promise((resolve, reject) => {
          this.$emit('recorderStateChanged', { recording: true })
          let recorder = this.recorder = new MediaRecorder(stream)
          recorder.start()
          let chunks = []
          let size = 0
          recorder.ondataavailable = e => {
            chunks.push(e.data)
            size += e.data.size
          }
          recorder.onstart = () => {
            this.recordInterval = setInterval(this.calculateTime, 1000)
          }
          recorder.onstop = () => {
            this.recordTime = 0
            clearInterval(this.recordInterval)
            this.clearStream(stream)
            this.userMediaPromise = null
            if (!size || !this.insideSafeArea) {
              return
            }
            let blob = new Blob(chunks, {'type': 'audio/ogg; codecs=opus'})
            resolve(blob)
          }
        })
      },
      async recordFile () {
        this.disabled = false
        try {
          if (this.currentStream) {
            this.clearStream(this.currentStream)
            this.currentStream = null
          }
          const stream = this.currentStream = await navigator.mediaDevices.getUserMedia({audio: true, video: false})

          if (this.recording) {
            const blob = await this.recorderResult(stream)
            return blob
          } else {
            this.clearStream(stream)
          }
        } catch (e) {
          this.recording = false
          this.disabled = true
          this.recordTime = 0
          this.isMouseDown = false
          this.$emit('recorderStateChanged', { recording: false })
        }
      },
      recognizeText () {
        return new Promise((resolve, reject) => {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
          if (!SpeechRecognition) {
            resolve()
          }
          let recognition = this.recognition = new SpeechRecognition()
          recognition.interimResults = false
          recognition.maxAlternatives = 1
          // подумать, где брать язык
          recognition.lang = 'ru-RU'
          recognition.start()
          recognition.onresult = event => {
            if (!this.insideSafeArea) {
              resolve()
            }
            const text = event.results[0][0].transcript
            this.$emit('text', text)
            resolve(text)
          }
          recognition.onend = () => {
            if (this.recording) {
              recognition.start()
            }
          }

          recognition.onerror = () => {
            resolve()
          }
        })
      },
      start () {
        if (this.disabledExternal) {
          return
        }
        this.isMouseDown = true
        this.recording = true
        document.body.classList.add('m-resizer-no-select')
        document.addEventListener('mouseup', this.mouseup)
        document.addEventListener('mousemove', this.mousemove)
        const promises = []
        if (this.file) {
          promises.push(this.recordFile())
        }
        if (this.text) {
          promises.push(this.recognizeText())
        }

        Promise.all(promises).then((result) => {
          this.$emit('result', { blob: result[0], text: result[1] })
        })
      },
      download (file, filename, type) {
        if (window.navigator.msSaveOrOpenBlob) {
          window.navigator.msSaveOrOpenBlob(file, filename)
        } else {
          let a = document.createElement('a')
          let url = URL.createObjectURL(file)
          a.href = url
          a.download = filename
          document.body.appendChild(a)
          a.click()
          setTimeout(function () {
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
          }, 0)
        }
      },
      clearStream (stream) {
        if (stream) {
          if (stream.getTracks) {
            stream.getTracks().forEach(t => t.stop())
          } else {
            stream.stop()
          }
        }
      },
      calculateTime () {
        this.recordTime += 1
        this.$emit('recorderStateChanged', { recordTime: this.recordTime })
      }
    },
    computed: {
      disabledTooltip () {
        if (this.disabled) {
          return {
            content: this.$t('audiorecorder.mic_disabled'),
            trigger: 'hover click'
          }
        } else {
          return null
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-audio-recorder {
    .hover-mixin();
    i {
      &.recording {
        color: @red-color;
      }

      &.disabled {
        opacity: 0.5;
      }
    }
    &:focus {
      outline:0;
    }
    &.m-disabled {
      opacity: 0.5;
    }
  }
</style>
