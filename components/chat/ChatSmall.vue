<template>

  <div class="c-chat-small"
       :class="{active: $store.state.isChatActive, 'm-small': !$store.state.isChatBig, 'm-left': settings.chat_win_position === 'left'}" :style="computedStyle">
    <template v-if="!$store.state.isChatBig">
      <div class="b-menu-row" :class="{'m-chat-header': !channelId && !pmUserInfo}">
        <template v-if="!channelId && !pmUserInfo">
          <div class="b-left">
            <chat-position></chat-position>
          </div>
          <div class="b-center">
            <div class="e-show-search" v-if="!showSearch" @click="toggleSearch">
              <i class="bu-magnifier"></i>
            </div>
            <div class="b-search" v-else>
              <input v-model="searchKeyword" type="text" class="e-search" ref="searchInput"
                     :placeholder="$t('chat.search_placeholder')"
                     @keyup.esc.stop="searchKeyword ? (searchKeyword = '') : (showSearch = false)">
              <div class="e-close" @click="searchKeyword ? (searchKeyword = '') : (showSearch = false)">
                <i class="bu-cross"></i>
              </div>
            </div>
          </div>
          <div class="b-right">
            <no-ssr>
              <chat-bell-menu v-if="!channelId" class="b-notifications-menu" ref="bellMenu"></chat-bell-menu>
            </no-ssr>
          </div>
        </template>

        <template v-else>
          <div class="b-left" :class="{'m-channel' : channelInfo || pmUserInfo}">
            <div v-if="!channelId && !pmUserInfo" @click="$store.commit('SET_CHAT_ACTIVE', 0)">

              <i class="bu-cross"></i>
            </div>
            <div v-if="channelInfo || pmUserInfo" @click="clearChannel()">
              <i class="bu-left-open-big"></i>
            </div>
          </div>
          <div class="b-center" :class="{'m-user-info': pmUserInfo}">
            <template v-if="channelInfo && !pmUserInfo">
              <context-menu class="c-channel-info" trigger="hover" delay="500">
                <div slot="content" class="b-channel-info">
                  <avatar :src="channelInfo.avatar_url" :showOnline="channelInfo.type !== 'main' "
                          :userId="channelInfo.userId" :name="channelInfo.name"
                          size="25"></avatar>
                  <div class="b-info">
                    <div class="b-name">
                      <div class="e-name">{{ capitalize(channelInfo.name) }}</div>
                      <div class="e-mute" v-if="channelInfo.mute_until_period">
                        <i class="bu-volume-mute"></i>
                      </div>
                    </div>
                    <div class="e-seen">
                      {{ channelUsers.length ? $tc('user.channels', channelUsers.length, {count: channelUsers.length}) : ''
                      }}
                    </div>
                  </div>
                </div>
                <div slot="items" class="b-items">
                  <div class="b-user m-user-item" v-for="user in channelUsers" @click="openPMChannel(user)">
                    <div class="b-left">
                      <avatar :userId="user.id" size="25"></avatar>
                    </div>
                    <div class="b-right">
                      <div class="e-name">
                        {{ user.name }}
                      </div>
                      <div class="e-seen">
                        <span>{{ getSeen(user) }} </span>
                      </div>

                    </div>
                  </div>
                </div>
              </context-menu>
            </template>

            <template v-if="pmUserInfo">
              <div class="b-user m-user-item b-pm-user">
                <div class="b-left">
                  <avatar :userId="pmUserInfo.id" size="25"></avatar>
                </div>
                <div class="b-right">
                  <div class="b-name">
                    <div class="e-name">
                      {{ pmUserInfo.id == $store.state.webuser.user.id ? $t('chat.saved_messages') : pmUserInfo.name }}
                    </div>
                    <div class="e-mute" v-if="channelInfo && channelInfo.mute_until_period">
                      <i class="bu-volume-mute"></i>
                    </div>
                  </div>
                  <div class="e-seen" v-if="pmUserInfo.id != $store.state.webuser.user.id">
                    <span>{{ getSeen(pmUserInfo) }} </span>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <div class="b-right">
            <no-ssr>
              <channel-menu v-if="channelId" @change="data => updateChannel(channelInfo, data)"
                            @openMutePeriods="mutingChannel = channelInfo"
                            @openDeleteHistory="deleteHistoryChannel = channelInfo"
                            @deleteChannel="clearChannel"
                            :ref=" 'channelMenu_' + channelId "
                            :channel="channelInfo"></channel-menu>
            </no-ssr>
          </div>
        </template>

      </div>
      <template v-if="channelInfo || pmUserInfo">
        <loading-bar v-if="!messagesVisible"></loading-bar>
        <div class="b-messages-container js-messages-container vb" ref="messagesContainer"
             :class="{'m-hidden': !messagesVisible}">
          <div class="b-messages" ref="messagesContent" @wheel="wheel" @scroll="scroll" :class="{'m-group': !isPM}">
            <div v-if="!loading">
              <div class="b-message-row js-message-row"
                  :class="{'m-mine': +message.id_user === +$store.state.webuser.user.id,
                    'm-new': message.is_show_unread && +message.id_user !== +$store.state.webuser.user.id && unreadPosition !== null && i >= unreadPosition }"
                  v-for="(message, i) in messages" :key="message.id" :data-id="message.id"
                  >
                <div class="b-unread-cnt js-unread" v-if="showUnreadBar && unreadBarPosition === i && unreadBarCnt">
                  <div class="e-before"></div>
                  <div class="e-text">
                    {{ $tc('chat.cnt_unread', unreadBarCnt, {n: unreadBarCnt})}}
                  </div>
                  <div class="e-after"></div>
                </div>
                <div class="b-date"
                    v-if="!messages[i - 1] || isDifferentDates(message.dta_create, messages[i - 1].dta_create)">
                  <div class="e-date">{{ formatTime(message.dta_create, 'D MMMM YYYY') }}
                  </div>
                </div>
                <div class="b-message m-text" v-if="!message.file">
                  <div class="b-left">
                    <div class="b-avatar-wrap">
                      <avatar
                        v-if="isShowAvatar(message)" @click.native="isPM ? null : openPMChannel(message.id_user)"
                        size="30" :userId="message.id_user"></avatar>
                    </div>
                  </div>
                  <div class="b-right">
                    <div class="b-bubble">
                      <div class="e-text" v-html="formatText(message)"></div>
                      <div class="e-info">
                        <div class="e-read" v-if="+message.id_user === +$store.state.webuser.user.id && !isMyChannel()">
                          <i :class="+message.is_read ? 'bu-check-double' : 'bu-check-single' "></i>
                        </div>
                        <div class="e-time">{{ formatTime(message.dta_create)}}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="b-message m-img" v-else-if="message.file && isImage(message)"
                     :class="{'has-caption': !!message.text}">
                  <div class="b-left">
                    <div class="b-avatar-wrap">
                      <avatar v-if="isShowAvatar(message)" size="30" :userId="message.id_user"
                              @click.native="isPM ? null : openPMChannel(message.id_user)"></avatar>
                    </div>
                  </div>
                  <div class="b-right m-img-col">
                    <div class="b-img-wrap">
                      <div class="b-name" v-if="isShowAvatar(message)">
                        <span class="e-author js-author" :data-user="message.id_user">{{ getAuthorName(message)
                          }}</span>
                      </div>
                      <div class="b-overlay">
                        <protected-image @keyup.esc.native.stop="" :src="message.file.info.medium.url" preview="1"
                                         :previewSrc="message.file.info.file.url" :skipToken="true"></protected-image>
                      </div>
                      <div class="b-caption" v-if="!!message.text">
                        <div class="b-text">
                          <div class="e-text" v-if="!!message.text" v-html="formatText(message, false)"></div>
                        </div>
                        <div class="b-time">
                          <div class="e-read"
                               v-if="+message.id_user === +$store.state.webuser.user.id && !isMyChannel()">
                            <i :class="+message.is_read ? 'bu-check-double' : 'bu-check-single' "></i>
                          </div>
                          <div class="e-time">{{ formatTime(message.dta_create)}}</div>
                        </div>
                      </div>
                      <div class="b-info" v-else>
                        <div class="e-read" v-if="+message.id_user === +$store.state.webuser.user.id && !isMyChannel()">
                          <i :class="+message.is_read ? 'bu-check-double' : 'bu-check-single' "></i>
                        </div>
                        <div class="e-time">{{ formatTime(message.dta_create)}}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="b-message m-file m-audio" :data-id="message.id"
                     v-else-if="message.file && isAudio(message)">
                  <div class="b-left">
                    <div class="b-avatar-wrap">
                      <avatar v-if="isShowAvatar(message)" size="30" :userId="message.id_user"
                              @click.native="isPM ? null : openPMChannel(message.id_user)"></avatar>
                    </div>
                  </div>
                  <audio-player @play="pauseAllAudioBut(message.id)" :ref=" 'audio_player_' + message.id "
                                :file="message.file" :name="$t('chat.voice_message')"
                                class="b-bubble">
                    <div slot="info" class="b-info">
                      <div class="e-read" v-if="message.id_user == $store.state.webuser.user.id"><i
                        :class=" 'bu-check-' + (message.is_read ? 'double' : 'single') "></i></div>
                      <div class="e-time">{{ formatTime(message.dta_create) }}</div>
                    </div>
                  </audio-player>
                </div>
                <div class="b-message m-file m-video" :data-id="message.id"
                     v-else-if="message.file && isVideo(message)">
                  <div class="b-left">
                    <avatar v-if="isShowAvatar(message)" size="30" :userId="message.id_user"
                            @click.native="isPM ? null : openPMChannel(message.id_user)"></avatar>
                  </div>
                  <div class="b-right m-video-col">
                    <chat-video-player :message="message">
                      <div slot="info" class="b-info">
                        <div class="e-read" v-if="+message.id_user === +$store.state.webuser.user.id && !isMyChannel()">
                          <i :class="+message.is_read ? 'bu-check-double' : 'bu-check-single' "></i>
                        </div>
                        <div class="e-time">{{ formatTime(message.dta_create)}}</div>
                      </div>
                    </chat-video-player>
                  </div>
                </div>
                <div class="b-message m-file"
                     v-else-if="message.file && !isImage(message) && !isAudio(message) && !isVideo(message)">
                  <div class="b-left">
                    <avatar v-if="isShowAvatar(message)" size="30" :userId="message.id_user"
                            @click.native="isPM ? null : openPMChannel(message.id_user)"></avatar>
                  </div>
                  <div class="b-bubble" @click="downloadFile(message.file.info.file.url)">
                    <div class="b-icon">
                      <i class="bu-file-circle"></i>
                    </div>
                    <div class="b-center">
                      <div class="e-name">{{ message.file.base_name }}</div>
                      <div class="e-size">{{ formatFileSize(message.file.size) }}</div>
                    </div>
                    <div class="b-info">
                      <div class="e-read" v-if="+message.id_user === +$store.state.webuser.user.id && !isMyChannel()">
                        <i :class="+message.is_read ? 'bu-check-double' : 'bu-check-single' "></i>
                      </div>
                      <div class="e-time">{{ formatTime(message.dta_create)}}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <message-placeholder v-if="placeholderMessage" :message="placeholderMessage"
                                 @load="() => scrollBottom()"></message-placeholder>
            <div class="b-message-spacer"></div>
          </div>
          <div class="b-down-btn js-down-btn hidden" ref="downBtn" @click="scrollBottom()">
            <i class="bu-angle-down"></i>
          </div>
        </div>
        <div class="b-message-form" ref="messageForm">
          <div class="b-left">
            <div class="e-upload" :class="{'m-inactive': sending}" v-if="!isRecording"
                 v-tooltip="checkAccess('disc_space') ? null : noDiscHint">
              <upload-button :locked="!checkAccess('disc_space') || sending" :maxSize="295 * Math.pow(2, 20)"
                             maxFiles="1" :onUpload="handleUpload"></upload-button>
            </div>
            <div class="e-recording-info" v-else>
              <div class="e-recording-dot">
              </div>
              <div class="e-recording-time">
                 {{ recordTimeFortatted }}
              </div>
            </div>
          </div>
          <div class="b-center">
            <textarea-autosize name="chat_message" id="chat_message" autocomplete="off" autocorrect="off"
                               @keydown.enter.native="pressEnter"
                               ref="textArea" :rows="1" @input="messageInput"
                               :max-length="maxLength" :placeholder="$t('Write here...')"
                               :max-height="maxTextareaHeight"
                               @paste.native="paste"
                               @resize="messageFormResize"
                               v-if="!isRecording"></textarea-autosize>
            <div class="e-recording-text" :class="{'m-is-outside': !recorderInsideSafeArea}" v-else>
              {{ recorderInsideSafeArea ? $t('audiorecorder.release_outside') : $t('audiorecorder.release') }}
            </div>
          </div>
          <div class="b-right" v-tooltip="!checkAccess('disc_space') ? noDiscHint : null">
            <div class="e-send" @click="addMessage()" :class="{'m-inactive': sending || !checkAccess('disc_space')}"
                 v-if="showSend">
              <i class="bu-send-plane"></i>
            </div>
            <div class="e-record" v-else>
              <audio-recorder @result="(r) => handleRecorded(r)" @recorderStateChanged="recorderStateChanged"
                              :disabledExternal="sending || !checkAccess('disc_space')"
                              safeAreaRef="messageForm"></audio-recorder>
            </div>
          </div>
          <div class="b-typing" v-show="typingMessage">{{ typingMessage }}</div>
        </div>
      </template>
      <div class="b-channels-wrap" v-if="!channelInfo && !pmUserInfo" ref="channelsWrap">
        <div class="b-channels" v-if="sortedChannels.length" ref="channelsContainer"
             :class="{padded: !newUsers.length}">
          <template v-for="(channel, i) in sortedChannels">
            <div class="b-channel" :data-id="channel.id" @click="selectChannel(channel)"
                 v-if="!channel.is_hide_in_chats_list || isShowHiddenChannels"
                 :class="{hidden: channel.is_hide_in_chats_list}">
              <div class="b-info">
                <div class="b-left">
                  <avatar :src="channel.avatar_url" :showOnline="channel.type !== 'main'" :userId="channel.userId"
                          :name="channel.name" size="40"></avatar>
                </div>
                <div class="b-right">
                  <div class="b-name-row">
                    <div class="b-left">
                      <div class="e-name">{{ capitalize(channel.name) }}</div>
                      <div class="e-mute" v-if="channel.mute_until_period">
                        <i class="bu-volume-mute"></i>
                      </div>
                    </div>
                    <div class="b-right" v-if="channel.message_last">
                      <span class="e-read">
                        <i
                          v-if="+channel.message_last.id_user === +$store.state.webuser.user.id && !isMyChannel(channel)"
                          :class=" 'bu-check-' + (+channel.message_last.is_read ? 'double' : 'single')  "></i>
                      </span>
                      <span
                        class="e-date">{{ formatTime(channel.message_last.dta_create, isToday(channel.message_last.dta_create) ? 'H:mm' : 'D MMM')}}</span>
                    </div>
                  </div>
                  <div class="b-message-row">
                    <div class="b-message" :class="{'m-hidden': !channel.message_last}">
                      <template v-if="channel.message_last">
                        <span
                          class="e-author">{{ +channel.message_last.id_user === +$store.state.webuser.user.id ? $t('You') : getAuthorName(channel.message_last)
                          }}:</span>
                        <span class="e-text">{{ channel.message_last.snippet }}</span>
                      </template>
                    </div>
                    <div class="b-unread" v-if="getCntNew(channel)">
                      <div class="e-cnt-new" v-if="getCntNew(channel) && +channel.id !== +channelId">
                        {{ getCntNew(channel) }}
                      </div>
                    </div>
                    <div class="b-pin" v-if="channel.pin_to_top">
                      <i class="bu-pin"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <div class="e-show-hidden" v-if="cntHiddenChannels && !isShowHiddenChannels" @click="showHiddenChannels()">
            {{ $t('chat.show_hidden') }} ({{ cntHiddenChannels }})
          </div>
        </div>
        <div class="b-new-users" v-if="searchKeyword && newUsers.length">
          <div class="b-header">
            {{ $t('chat.company_search_results') }}
          </div>
          <div class="b-users">
            <div class="b-user" v-for="user in newUsers" @click="openPMChannel(user)">
              <div class="b-left">
                <avatar :userId="user.id" size="35"></avatar>
              </div>
              <div class="b-right">
                <div class="e-name">
                  {{ capitalize(user.name)}}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="searchKeyword && !searching && !newUsers.length && !sortedChannels.length" class="b-empty">
          <div class="b-header">
            {{ $t('chat.not_found') }}
          </div>
        </div>
      </div>
      <resizer :position="settings.chat_win_position === 'left' ? 'right' : 'left'" @update="updateWidth"></resizer>
    </template>
    <mute-periods ref="mutePeriods" :channel="mutingChannel" @cancel="mutingChannel = null"
                  v-key-escape="() => mutingChannel = null"
                  @change="p => {updateChannel(mutingChannel, {mute_until_period: p}); mutingChannel = null}">
    </mute-periods>
    <remove-history ref="removeHistory" :channel="deleteHistoryChannel" @cancel="deleteHistoryChannel = null"
                    @done="handleRemoveHistory(deleteHistoryChannel.id); deleteHistoryChannel = null"
                    v-key-escape="() => deleteHistoryChannel = null">
    </remove-history>
    <insert-image ref="insertImage" v-if="pastingImage && pastingImage.dataUrl" :image="pastingImage.dataUrl"
                  @submit="c => addImageMessage(c)"
                  @cancel="$nextTick(() => pastingImage = null)"></insert-image>
  </div>
</template>

<script>
  import TextareaAutosize from '../TextareaAutosize.vue'
  import Avatar from '../Avatar.vue'
  import moment from 'moment'
  import listeners from '~/utils/mixins/listeners'
  import { linkify, encodeHTML, capitalize, getErrorFromResponse, formatFileSize, clearString } from '~/utils/helpers'
  import { secondsToHIS } from '~/utils/time'
  import ContextMenu from '../ContextMenu.vue'
  import Toggle from '../Toggle.vue'
  import Resizer from '~/components/Resizer.vue'
  import Checkbox from '../Checkbox.vue'
  import { mapState, mapGetters } from 'vuex'
  import NoSsr from '../../.nuxt/components/no-ssr'
  import RadioBtn from '../RadioBtn.vue'
  import { debounce } from 'lodash'
  import typing from '~/utils/mixins/typing'
  import ChannelMenu from './ChannelMenu.vue'
  import UploadButton from '../UploadButton.vue'
  import ProtectedImage from '../ProtectedImage.vue'
  import MutePeriods from './MutePeriods.vue'
  import RemoveHistory from './RemoveHistory.vue'
  import AudioPlayer from '~/components/AudioPlayer.vue'
  import ChatVideoPlayer from './VideoPlayer.vue'
  import QuwiSpinner from '../Spinner.vue'
  import MessagePlaceholder from './MessagePlaceholder.vue'
  import InsertImage from './InsertImage.vue'
  import { showUpgradeDialog } from '~/utils/plan'
  import AudioRecorder from '../AudioRecorder.vue'
  import LoadingBar from './LoadingBar.vue'
  import ChatBellMenu from './ChatBellMenu.vue'
  import ChatPosition from './ChatPosition.vue'
  import { getNoDiscHint } from '~/utils/issues'

  export default {
    components: {
      ChatPosition,
      ChatBellMenu,
      LoadingBar,
      InsertImage,
      MessagePlaceholder,
      QuwiSpinner,
      ChatVideoPlayer,
      AudioPlayer,
      RemoveHistory,
      MutePeriods,
      ProtectedImage,
      UploadButton,
      ChannelMenu,
      RadioBtn,
      NoSsr,
      Checkbox,
      Toggle,
      ContextMenu,
      Avatar,
      TextareaAutosize,
      Resizer,
      AudioRecorder
    },
    name: 'chat-small',
    sockets: {
      typing (data) {
        if (data.type === 'chat' && +data.id_channel === +this.channelId) {
          this.socketTyping(data)
        }
      },
      async chat_new_message (data) {
        if (!data || !data.id_message) {
          return
        }
        let message = await this.$api.get('chat-messages/' + data.id_message).then(res => res.data.message)
        const isAuthor = +message.id_user === +this.$store.state.webuser.user.id
        const isVisible = this.$store.state.isChatActive && window.isTabActive && document.visibilityState === 'visible'
        let updateMenuDigit = !isAuthor
        if (message.id && +data.id_channel === +this.channelId) {
          if (!this.messages.find(el => +el.id === +message.id)) {
            if (isVisible && !isAuthor) {
              message.is_read = 1
              updateMenuDigit = false
            }
            if (!isVisible && !this.showUnreadBar) {
              message.is_show_unread = 1
            }
            if (!(isAuthor && this.sending)) {
              this.messages.push(message)
            }
            this.$nextTick(() => {
              if (isVisible) {
                this.scrollBottom()
                if (!isAuthor) {
                  this.markRead()
                }
              }
            })
          } else {
            updateMenuDigit = false
          }
        }
        if (updateMenuDigit) {
          this.$store.dispatch('updateUnreadChatMessagesCount')
        }
        if (this.channels.length) {
          let channel = this.channels.find(el => +el.id === +data.id_channel)
          if (!channel) {
            await this.loadChannels()
          }
          if (channel) {
            this.$set(channel, 'message_last', message)
          }
        }
      },
      chat_message_read (data) {
        if (data.id_message && +data.id_channel === +this.channelId) {
          let message = this.messages.find(el => +el.id === +data.id_message)
          if (message) {
            message.is_read = 1
          }
        }
        if (this.channels.length && +data.id_channel !== +this.channelId) {
          let channel = this.channels.find(el => el.message_last && el.message_last.id === +data.id_message)
          if (channel) {
            channel.message_last.is_read = 1
          }
        }
      },
      chat_channel_changed () {
        this.$api.get('/settings').then(res => {
          this.$store.commit('SET_USER_SETTINGS', res.data.settings)
        })
        this.loadChannels()
      },
      chat_browser_sound (data) {
        const isVisible = this.$store.state.isChatActive && window.isTabActive && document.visibilityState === 'visible'
        if (!isVisible || (this.channelId && +this.channelId !== +data.id_channel) || !this.channelId) {
          this.playSound(data.id_channel)
        }
      },
      chat_own_channel_read (data) {
        if (data.id_channel) {
          const ch = this.channels.find(el => +el.id === data.id_channel)
          if (ch) {
            ch.dta_last_read = this.$date().format('YYYY-MM-DD HH:mm:ss')
          }
        }
      },
      chat_channel_removed_all_messages (data) {
        if (data.id_channel) {
          this.handleRemoveHistory(data.id_channel)
        }
      },
      async chat_message_removed (data) {
        if (!data || !data.id_message) {
          return
        }

        const channel = this.channels.find(el => +el.id === +data.id_channel)
        const message = this.messages.findIndex(el => +el.id === +data.id_message)

        if (message > -1) {
          this.messages.splice(message, 1)
        }

        const el = this.cntsNewByChannel.find(el => +el.id_channel === +data.id_channel)
        let unreadCounts = this.$store.state.cntUnreadChatMessages

        if (el && +el.count) {
          el.count = +el.count - 1
          this.$store.state.cntUnreadChatMessages = +unreadCounts - 1
        }

        if (+data.id_message === +channel.message_last.id) {
          channel.message_last = this.messages[this.messages.length - 1]
        }
      }
    },
    data () {
      return {
        messages: [],
        pmUserId: null,
        channelId: null,
        sending: false,
        loading: false,
        page: 1,
        cntPages: null,
        notificationInterval: null,
        channels: [],
        maxLength: 4000,
        maxTextareaHeight: 500,
        showUnreadBar: false,
        unreadBarCnt: 0,
        unreadBarPosition: null,
        openOnChannelId: null,
        searchKeyword: '',
        newUsers: [],
        searching: false,
        channelsScrollbar: false,
        messagesScrollbar: false,
        perPage: 100,
        lastMessageDate: null,
        deleteAllHistory: false,
        mutingChannel: null,
        deleteHistoryChannel: null,
        showSearch: false,
        messagesVisible: true,
        placeholderMessage: null,
        pastingImage: null,
        isRecording: false,
        recorderInsideSafeArea: true,
        recordTime: 0,
        showSend: false,
        audio: null,
        isShowHiddenChannels: false
      }
    },
    mixins: [listeners, typing],
    methods: {
      loadMessages (page = 1) {
        if (!this.channelId) return
        if (page === 1) {
          this.loading = true
        }
        const payload = {
          id_channel: this.channelId,
          'per-page': this.perPage,
          page,
          ms: 1
        }
        if (page > 1 && this.lastMessageDate) {
          payload.filters = {
            dta_to: this.lastMessageDate.iso(true)
          }
        }
        return this.$api.get('/chat-messages', payload).then(res => {
          if (page === 1) {
            this.messages = res.data.messages.reverse()
            if (this.messages.length) {
              this.lastMessageDate = this.$date(this.messages[this.messages.length - 1].dta_create, 'YYYY-MM-DD HH:mm:ss.SSS', true)
            }
          } else {
            if (res.data.messages && res.data.messages.length) {
              this.messages.unshift(...res.data.messages.reverse())
            }
          }
          this.cntPages = +res.headers['x-pagination-page-count']
          this.page = +res.headers['x-pagination-current-page']
          if (this.showUnreadBar) {
            this.unreadBarPosition += res.data.messages.length
          }
        }).finally(() => {
          this.loading = false
          this.$nextTick(() => {
            if (this.needToScrollToLastMessage) {
              if (this.messages.length > this.perPage) {
                const scrollToIndex = this.messages.length - this.perPage * (this.page - 1)
                if (scrollToIndex > 0) {
                  this.scrollToMessage(this.messages[scrollToIndex])
                }
              }
            }
            this.needToScrollToLastMessage = false
          })
        })
      },
      scrollBottom () {
        if (this.$refs.messagesContent) {
          this.$refs.messagesContent.scrollTop = this.$refs.messagesContent.scrollHeight
        }
      },
      scrollToMessage (message) {
        const el = this.$el.querySelector(`.js-message-row[data-id="${message.id}"]`)
        if (el) {
          el.scrollIntoView()
          this.$vuebar.refreshScrollbar(this.$refs.messagesContainer, {})
        }
      },
      async addMessage (formData = null) {
        if (this.sending || this.loading) {
          return
        }
        if (!this.channelId) {
          if (this.pmUserId) {
            // create a channel for new PM
            let channel = await this.$api.post('/chat-channels/create-pm', {id_user_partner: this.pmUserId})
              .then(res => {
                return res.data.channel
              })
            if (!this.channels.some(el => +el.id === +channel.id)) {
              this.applyChannelInfo(channel)
              this.channels.push(channel)
            }
            this.channelId = channel.id
            this.pmUserId = null
          } else {
            // set default channel
            this.channelId = this.$store.state.idMainChat
          }
        }
        if (!formData) {
          let messageToSend = this.$store.state.chatMessage.trim()
          if (messageToSend && messageToSend.length > this.maxLength) {
            messageToSend = clearString(messageToSend.substring(0, this.maxLength))
          }
          if (!messageToSend.length) {
            return
          }
          this.showPlaceholder({
            text: this.formatText({
              text: messageToSend,
              id_user: this.$store.state.webuser.user.id
            })
          })
          this.$store.commit('SET_CHAT_MESSAGE', '')
          this.$refs.textArea.clear()
          this.sendMessage({text: messageToSend})
        } else {
          this.sendMessage(formData)
        }
        this.$refs.textArea.focus()
      },
      sendMessage (params) {
        this.sending = true
        this.$api.post('/chat-messages?id_channel=' + this.channelId, params).then(async res => {
          if (res.data.message) {
            let message = res.data.message
            let addedMessage = this.messages.find(el => +el.id === +message.id)
            if (!addedMessage) {
              if (message.file && message.file.mime_type.indexOf('image') === 0 && message.file.info.medium) {
                message.file.info.medium.url = this.placeholderMessage.image
              }
              this.messages.push(res.data.message)
              this.placeholderMessage = null
              if (!this.messagesScrollbar) {
                this.$nextTick(() => {
                  this.showMessagesScrollbar()
                })
              }
            }
          }
          this.showUnreadBar = false
          this.$nextTick(async () => {
            await this.getLoadingMediaPromise()
            this.processImages()
            this.$nextTick(() => {
              this.scrollBottom()
            })
          })
        }).catch((err) => {
          alert(getErrorFromResponse(err))
        }).finally(() => {
          this.sending = false
        })
      },
      formatTime (date, fmt = 'H:mm') {
        let d = this.$date(date)
        return d.format(fmt)
      },
      isToday (date) {
        return this.$date(date).isBetween(this.$date().startOf('day'), this.$date().endOf('day'))
      },
      markRead () {
        if (process.server || document.visibilityState !== 'visible' || !this.channelId || !this.$store.state.isChatActive) {
          return
        }
        this.$api.put('chat-channels/read', {id_channel: this.channelId}).then(res => {
          let channel = this.channels.find(el => +el.id === +this.channelId)
          if (channel && res.data.channel) {
            channel.dta_last_read = res.data.channel.dta_last_read
          }
        })
      },
      formatText (message, addAuthor = true) {
        if (message.text === null) {
          return ''
        }
        let text = encodeHTML(message.text)
        text = text.replace(/\n/g, '<br>')
        if (addAuthor && this.isShowAvatar(message)) {
          text = `<span class="e-author js-author" data-user="${message.id_user}">` + this.getAuthorName(message) + ':</span>' + text
        }
        return linkify(text)
      },
      isShowAvatar (message, showMine = false) {
        if (!showMine && +message.id_user === +this.$store.state.webuser.user.id) {
          return false
        }
        let i = this.messages.indexOf(message)
        if (i !== -1) {
          return !this.messages[i - 1] || +this.messages[i - 1].id_user !== +message.id_user
        }
        return false
      },
      isDifferentDates (date1, date2) {
        return this.formatTime(date1, 'D MMM YY') !== this.formatTime(date2, 'D MMM YY')
      },
      applyChannelInfo (ch) {
        switch (ch.type) {
          case 'pm':
            const user = this.$store.state.companyUsers.find(el => +el.id === +ch.id_partner)
            if (user) {
              ch.avatar_url = null
              ch.userId = user.id
              ch.name = +user.id === +this.$store.state.webuser.user.id ? this.$t('chat.saved_messages') : user.name
            }
            break
          case 'main':
            ch.avatar_url = null
            ch.userId = this.$store.getters['webuser/company'].id_user
            ch.name = this.$t('chat.main_name')
            break
          case 'project':
            const project = this.$store.getters['company/getProject'](ch.id_project)
            if (project) {
              ch.avatar_url = project.logo_url
              ch.userId = null
              ch.name = project.name
            }
            break
        }
        return ch
      },
      loadChannels () {
        return this.$api.get('chat-channels').then(res => {
          let channels = res.data.channels
          channels.forEach(ch => this.applyChannelInfo(ch))
          this.channels = channels
        })
      },
      htmlOverflow () {
        let html = document.querySelector('html')
        if (this.$store.state.isChatActive && this.$store.state.isChatBig) {
          html.style.overflow = 'hidden'
        } else {
          html.style.overflow = ''
        }
      },
      getSeen (user) {
        let str
        if (user.is_online) {
          str = this.$t('Online')
        } else {
          str = this.$t('Seen') + ' ' + this.$dateAgo(user.dta_activity) + ' ' + this.$t('ago')
        }
        if (user.timezone_offset != null) {
          str += '. ' + this.$t('Time') + ': ' + moment().utcOffset(user.timezone_offset).format('H:mm')
        }
        return str
      },
      scroll () {
        let el = this.$refs.messagesContent
        if (el.scrollHeight - el.scrollTop > 2 * el.getBoundingClientRect().height) {
          this.$refs.downBtn.classList.remove('hidden')
        } else {
          this.$refs.downBtn.classList.add('hidden')
        }
        this.scrollVideos(this)
      },
      scrollVideos: debounce((vm) => {
        vm.videosAutoPlay()
      }, 500),
      videosAutoPlay () {
        let videos = this.$el.querySelectorAll('video')
        videos.forEach(video => {
          let rect = video.getBoundingClientRect()
          if (rect.bottom >= 0 && rect.top < window.scrollY + window.innerHeight) {
            video.play()
          } else {
            video.pause()
          }
        })
      },
      wheel (e) {
        if (this.loading) {
          e.preventDefault()
          e.stopPropagation()
          return false
        }

        if (this.page >= this.cntPages) {
          return
        }

        let el = this.$refs.messagesContent
        let leftPercent = (el.scrollTop / el.scrollHeight) * 100
        if (leftPercent < 10) {
          this.needToScrollToLastMessage = true
          this.loadMessages(this.page + 1)
        }
      },
      vbDrag (e) {
        const vbState = this.$vuebar.getState(this.$refs.messagesContainer)
        if (this.page >= this.cntPages || vbState.barLocked) {
          return
        }

        let el = this.$refs.messagesContent
        let leftPercent = (el.scrollTop / el.scrollHeight) * 100
        if (leftPercent < 5) {
          this.loadMessages(this.page + 1)
        }
      },
      pressEnter (e) {
        if (e.ctrlKey) {
          document.execCommand('insertParagraph')
          this.$refs.textArea.resize()
        }
        if (!e.shiftKey && !e.ctrlKey) {
          this.addMessage()
          e.preventDefault()
        }
      },
      selectChannel (channel) {
        this.channelId = channel.id
        this.pmUserId = null
        localStorage && localStorage.setItem('lastChannelId', this.channelId)
        this.messages = []
        this.searchKeyword = ''
        this.messagesVisible = false
        this.clearChannelsScrollStyles()
        this.clearMessagesScrollStyles()
        this.handleWindowResize()
        this.loadMessages(1).then(async () => {
          await this.getLoadingMediaPromise()
          this.showMessagesScrollbar()
          this.scrollBottom()
          this.processImages()
          this.$refs.textArea.focus()
          this.$nextTick(() => {
            if (this.cntUnread) {
              if (!this.isFirstUnreadVisible()) {
                this.showUnreadBar = true
                this.unreadBarCnt = this.cntUnread
                this.unreadBarPosition = this.unreadPosition
                this.$nextTick(() => this.scrollToUnread())
              } else {
                this.messages.forEach(el => this.$set(el, 'is_show_unread', true))
              }
            }
            this.$nextTick(() => {
              this.messagesVisible = true
              this.$nextTick(() => this.markRead())
            })
          })
        })
      },
      clearChannel () {
        this.channelId = null
        localStorage && localStorage.removeItem('lastChannelId')
        this.pmUserId = null
        this.showUnreadBar = false
        this.clearMessagesScrollStyles()
        this.$nextTick(() => {
          this.showChannelsScrollbar()
          this.$refs.channelsContainer.scrollTop = 0
        })
      },
      setChannelFromUrl () {
        let uidProject = this.$route.params.project
        let idChannel
        if (uidProject) {
          let project = this.$store.state.projects.find(el => el.uid === uidProject)
          if (project) {
            idChannel = project.id_channel
          }
        }
        this.channelId = idChannel || this.$store.state.idMainChat
      },
      setLastChannel () {
        const unreadChatChannels = this.$store.state.cntUnreadChatChannels || []
        let channelId

        if (unreadChatChannels.length === 1) {
          channelId = unreadChatChannels[0].id_channel
        } else if (!unreadChatChannels.length && localStorage && localStorage.getItem('lastChannelId')) {
          channelId = localStorage.getItem('lastChannelId')
        }

        if (channelId) {
          const channel = this.channels.find(el => +el.id === +channelId)
          if (channel) {
            this.channelId = channelId
          }
        }
        this.$nextTick(() => {
          if (this.$refs.channelsContainer) {
            this.$refs.channelsContainer.scrollTop = 0
          }
        })
      },
      async openPMChannel (user) {
        if (typeof user !== 'object') {
          user = this.$store.state.companyUsers.find(el => +el.id === +user)
        }
        let channel = this.channels.find(el => el.type === 'pm' && +el.id_partner === +user.id)
        if (channel) {
          this.selectChannel(channel)
        } else {
          this.channelId = null
          this.pmUserId = user.id
          this.messages = []
          this.$refs.textArea && this.$refs.textArea.focus()
        }
        this.searchKeyword = ''
      },
      getFirstUnreadEl () {
        if (this.unreadPosition === null) {
          return
        }
        const firstUnread = this.messages[this.unreadPosition]
        if (!firstUnread) {
          return
        }
        return this.$el.querySelector(`.js-message-row[data-id="${firstUnread.id}"]`)
      },
      isFirstUnreadVisible () {
        const el = this.getFirstUnreadEl()
        if (!el) {
          return false
        } else return el.getBoundingClientRect().top >= this.$refs.messagesContent.getBoundingClientRect().top
      },
      scrollToUnread () {
        const el = this.$el.querySelector('.js-unread')
        if (el) {
          this.scrollBottom()
          let rect = this.$refs.messagesContent.getBoundingClientRect()
          this.$refs.messagesContent.scrollTop = this.$refs.messagesContent.scrollHeight - (rect.top - el.getBoundingClientRect().top + rect.height)
        }
      },
      isMyChannel (channel = null) {
        if (!channel) {
          channel = this.channelInfo
        }
        if (!channel) {
          return false
        }
        return +channel.id_partner === +this.$store.state.webuser.user.id
      },
      debouncedUpdateUserSettings: debounce((vm, val) => {
        vm.$store.dispatch('updateUserSettings', { chat_win_width: val })
      }, 1000),
      updateWidth (newWidth) {
        if (newWidth > this.$store.state.chatMaxWidth) {
          newWidth = this.$store.state.chatMaxWidth
        }
        this.$store.commit('SET_CHAT_ZOOM_WIDTH', 0)
        this.$store.commit('SET_CHAT_WIDTH', newWidth)
        this.debouncedUpdateUserSettings(this, newWidth)
      },
      handleResize () {
        if (this.chatWidth > this.$store.state.chatMaxWidth) {
          this.$store.commit('SET_CHAT_ZOOM_WIDTH', this.$store.state.chatMaxWidth)
        } else {
          this.$store.commit('SET_CHAT_ZOOM_WIDTH', 0)
        }
      },
      closeChat () {
        this.clearMessagesScrollStyles()
        this.clearChannelsScrollStyles()
        this.$store.commit('SET_CHAT_ACTIVE', 0)
        this.$store.commit('SET_CHAT_PINNED', false)
      },
      openOnUser (user) {
        this.clearChannelsScrollStyles()
        this.openPMChannel(user)
        if (this.channelId) {
          this.openOnChannelId = this.channelId
        }
        this.$store.commit('SET_CHAT_ACTIVE', true)
      },
      updateChannel (channel, data) {
        return this.$api.put('chat-channels/' + channel.id, data).then(res => {
          let storedChannel = this.channels.find(el => +el.id === +channel.id)
          this.channels.splice(this.channels.indexOf(storedChannel), 1, this.applyChannelInfo(res.data.channel))
        })
      },
      search: debounce((vm, val) => {
        vm.searching = true
        vm.$api.get('chat-channels/search-users', {keyword: val}).then(res => {
          vm.newUsers = res.data.users
        }).finally(() => {
          vm.searching = false
        })
      }, 500, {leading: true}),
      async playSound (channelId) {
        if (!this.$store.state.userSettings.is_sound_on_notification) {
          return
        }
        if (!this.channels.length) {
          await this.loadChannels()
        }
        let channel = this.channels.find(el => +el.id === +channelId)
        if (!channel.is_mute) {
          this.audio.play()
        }
      },
      messageInput (val) {
        if (val.length) {
          this.showSend = true
        } else {
          this.showSend = false
        }
        this.$store.commit('SET_CHAT_MESSAGE', val)
        this.emitTyping(this)
      },
      emitTyping: debounce(vm => {
        const user = vm.$store.state.webuser.user
        vm.$socket.emit('typing', {
          user: {
            id: user.id,
            name: user.name,
            avatar_url: user.avatar_url
          },
          id_channel: vm.channelId,
          type: 'chat'
        })
      }, 1000),
      getCntNew (channel) {
        const el = this.cntsNewByChannel.find(el => +el.id_channel === +channel.id)
        return el ? +el.count : 0
      },
      async handleUpload (e) {
        if (!e.target.files || !e.target.files[0]) {
          return false
        }
        let file = e.target.files[0]
        let formData = new FormData()
        formData.append('file', file)
        if (file.type.indexOf('image') === 0) {
          let dataUrl = await new Promise(resolve => {
            let r = new FileReader()
            r.onload = evt => resolve(evt.target.result)
            r.readAsDataURL(file)
          })
          this.showPlaceholder({image: dataUrl})
        } else {
          this.showPlaceholder({
            file: {
              name: file.name,
              size: file.size
            }
          })
        }
        this.addMessage(formData)
      },
      async paste (e) {
        const clipboardData = e.clipboardData || e.originalEvent.clipboardData
        if (!this.sending && clipboardData && clipboardData.files && clipboardData.files.length) {
          if (!this.checkAccess('disc_space')) {
            this.showUpgradeDialog()
          } else {
            let file = clipboardData.files[0]
            this.pastingImage = {
              file: file,
              dataUrl: await new Promise(resolve => {
                let fr = new FileReader()
                fr.onload = evt => resolve(evt.target.result)
                fr.readAsDataURL(file)
              })
            }
          }
          e.preventDefault()
        }
      },
      addImageMessage (caption = '') {
        if (!this.pastingImage) {
          return
        }
        this.showPlaceholder({image: this.pastingImage.dataUrl, caption})
        let formData = new FormData()
        let ext = 'png'
        if (this.pastingImage.file.type && this.pastingImage.file.type.indexOf('image/') === 0) {
          ext = this.pastingImage.file.type.replace('image/', '')
        }
        formData.append('file', this.pastingImage.file, 'image_' + this.$date().format('YYYY-MM-DD_HH-mm-ss') + '.' + ext)
        if (caption) {
          formData.append('text', caption)
        }
        this.pastingImage = null
        this.addMessage(formData)
      },
      isImage (message) {
        return !!message.file.info.thumb && (message.file.mime_type && message.file.mime_type.indexOf('image/') === 0)
      },
      isAudio (message) {
        return message.file.base_name.match(/\.(mp3|wav|ogg)$/)
      },
      isVideo (message) {
        return message.file.base_name.match(/\.(webm|mp4)$/)
      },
      downloadFile (url) {
        window.location.href = url
      },
      clearMessagesScrollStyles () {
        if (this.$refs.messagesContainer) {
          this.$refs.messagesContainer.style.height = ''
          this.$refs.messagesContainer.style.display = ''
          this.$refs.messagesContainer.style.position = ''
          this.$refs.messagesContainer.style.overflow = ''
        }

        if (!this.messagesScrollbar) {
          return
        }
        this.$vuebar.destroyScrollbar(this.$refs.messagesContainer, { clearStyles: false })
        this.messagesScrollbar = false
      },
      clearChannelsScrollStyles () {
        if (this.$refs.channelsWrap) {
          this.$refs.channelsWrap.style.height = ''
          this.$refs.channelsWrap.style.position = ''
          this.$refs.channelsWrap.style.overflow = ''
          this.$refs.channelsWrap.style.display = ''
        }
        if (this.$refs.channelsContainer) {
          this.$refs.channelsContainer.style.display = ''
          this.$refs.channelsContainer.style.overflow = ''
          this.$refs.channelsContainer.style.width = ''
          this.$refs.channelsContainer.style.height = ''
        }
        if (!this.channelsScrollbar) {
          return
        }
        if (this.$refs.channelsWrap) {
          this.$vuebar.destroyScrollbar(this.$refs.channelsWrap, { clearStyles: true })
        }
        this.channelsScrollbar = false
      },
      messageFormResize (height) {
        const topRowHeight = 46
        const offset = 24
        if (height > this.maxTextareaHeight) {
          height = this.maxTextareaHeight
        }
        if (this.$refs.messagesContainer) {
          this.$refs.messagesContainer.style.height = `calc(100% - ${height + topRowHeight + offset}px)`
          this.$vuebar.refreshScrollbar(this.$refs.messagesContainer, {})
        }
      },
      handleWindowResize () {
        const bb = this.$el.getBoundingClientRect()
        this.maxTextareaHeight = Number.parseInt(bb.height / 3, 10)
        if (this.$refs.textArea) {
          this.$refs.textArea.resize()
        }
      },
      showChannelsScrollbar () {
        if (!this.$store.state.isChatActive || this.channelsScrollbar || !this.$refs.channelsWrap || !this.$refs.channelsContainer) {
          return
        }
        this.$vuebar.initScrollbar(this.$refs.channelsWrap, { observerThrottle: 1000 })
        this.channelsScrollbar = true
      },
      showMessagesScrollbar () {
        if (!this.$store.state.isChatActive || this.messagesScrollbar || !this.$refs.messagesContainer || !this.$refs.messagesContent) {
          return
        }

        this.$vuebar.initScrollbar(this.$refs.messagesContainer, {drag: this.vbDrag, scrollLock: this.loading, useFlex: true, observerThrottle: 1000})
        this.messagesScrollbar = true
      },
      getLoadingMediaPromise () {
        let promises = []
        this.$el.querySelectorAll('.b-message.m-img img').forEach(el => {
          if (!el.complete) {
            promises.push(new Promise(resolve => {
              el.onload = el.onerror = () => resolve()
            }))
          }
        })
        this.$el.querySelectorAll('.b-message.m-video video').forEach(el => {
          if (el.readyState < 2) {
            promises.push(new Promise(resolve => {
              el.addEventListener('loadeddata', () => {
                resolve()
              })
            }))
          }
        })
        return Promise.all(promises)
      },
      handleRemoveHistory (channelId) {
        if (+this.channelId === +channelId) {
          this.messages = []
        }
        let ch = this.channels.find(el => +el.id === +channelId)
        if (ch) {
          this.$set(ch, 'message_last', null)
        }
        this.$store.dispatch('updateUnreadChatMessagesCount')
      },
      hasOpenModals () {
        return !!document.querySelector('.fullscreen-v-img') || this.mutingChannel || this.deleteHistoryChannel || !!this.pastingImage
      },
      getAuthorName (message) {
        const user = this.$store.state.companyUsers.find(el => +el.id === +message.id_user)
        if (user) {
          return user.name
        }
      },
      toggleSearch () {
        this.showSearch = true
        this.$nextTick(() => {
          if (this.$refs.searchInput) {
            this.$refs.searchInput.focus()
          }
        })
      },
      pauseAllAudioBut (id) {
        for (let name in this.$refs) {
          if (name.indexOf('audio_player') === 0 && name.indexOf('audio_player_' + id) === -1) {
            let player = this.$refs[name][0]
            if (player) {
              player.pause()
            }
          }
        }
      },
      showPlaceholder (message) {
        this.placeholderMessage = {...message}
      },
      showUpgradeDialog () {
        let dialogPromise = showUpgradeDialog(this)
        if (dialogPromise) {
          dialogPromise.then(() => this.$store.commit('SET_CHAT_ACTIVE', false))
        }
        return dialogPromise
      },
      handleRecorded (f) {
        if (!f.blob) {
          return
        }
        let formData = new FormData()
        formData.append('file', f.blob, 'voice_message_' + this.getUploadDate() + '.ogg')
        this.addMessage(formData)
        this.recordTime = 0
      },
      getUploadDate () {
        return this.$date().format('YYYY-MM-DD_HH-mm-ss')
      },
      recorderStateChanged (state) {
        if ('safeArea' in state) {
          this.recorderInsideSafeArea = state.safeArea
        }

        if ('recording' in state) {
          this.isRecording = state.recording
        }

        if ('recordTime' in state) {
          this.recordTime = state.recordTime
        }
      },
      showHiddenChannels () {
        this.isShowHiddenChannels = true
        this.$nextTick(() => {
          this.$refs.channelsContainer.scrollTop = 0
        })
      },
      async activate () {
        await this.loadChannels()
        if (!this.$store.state.isChatBig) {
          this.channelId = null
          if (this.openOnChannelId) {
            this.channelId = this.openOnChannelId
            this.openOnChannelId = null
          } else {
            this.setLastChannel()
          }
        } else {
          this.setLastChannel()
        }
        if (this.channelId) {
          this.messagesVisible = false
          this.loadMessages().then(async () => {
            await this.getLoadingMediaPromise()
            this.showMessagesScrollbar()
            this.scrollBottom()
            this.processImages()
            this.$nextTick(() => {
              if (this.cntUnread) {
                if (!this.isFirstUnreadVisible()) {
                  this.showUnreadBar = true
                  this.unreadBarCnt = this.cntUnread
                  this.unreadBarPosition = this.unreadPosition
                  this.$nextTick(() => this.scrollToUnread())
                } else {
                  this.messages.forEach(el => this.$set(el, 'is_show_unread', true))
                }
              }
              this.$nextTick(() => {
                this.messagesVisible = true
                this.$nextTick(() => this.markRead())
              })
            })
          })
        }
        this.$nextTick(() => {
          this.handleWindowResize()
          this.scrollBottom()
          if (this.$refs.textArea) {
            this.$refs.textArea.resize()
            this.$refs.textArea.focus()
          }
          this.showChannelsScrollbar()
          this.htmlOverflow()
        })
      },
      processImages () {
        this.$el.querySelectorAll('.b-message.m-img').forEach(el => {
          let img = el.querySelector('img')
          if (img) {
            let size = el.classList.contains('has-caption') ? 150 : 100
            let rect = img.getBoundingClientRect()
            if (rect.width < size || rect.height < size) {
              el.classList.add('has-overlay')
            }
          }
        })
      },
      capitalize,
      formatFileSize
    },
    computed: {
      ...mapState({
        settings: state => state.userSettings,
        cntsNewByChannel: state => state.cntUnreadChatChannels
      }),
      ...mapGetters({checkAccess: 'webuser/checkAccess'}),
      unreadPosition () {
        // unread position
        if (this.messages.length) {
          let pos = null
          for (let k = 0; k < this.messages.length; k++) {
            let message = this.messages[k]
            let isRead = this.channelInfo && (+moment(this.channelInfo.dta_last_read) > +moment(message.dta_create))
            if (+message.id_user !== +this.$store.state.webuser.user.id && !isRead) {
              if (pos === null) {
                pos = k
              }
            } else {
              pos = null
            }
          }
          return pos
        } else {
          return null
        }
      },
      pmUserInfo () {
        let idUser = null
        if (this.channelInfo) {
          if (this.channelInfo.type === 'pm') {
            idUser = this.channelInfo.userId
          }
        } else if (this.pmUserId) {
          idUser = this.pmUserId
        }
        return idUser && this.$store.state.companyUsers.find(el => +el.id === +idUser)
      },
      channelInfo () {
        let channel = this.channels.find(el => +el.id === +this.channelId)
        if (!channel) {
          return
        }
        return channel
      },
      channelUsers () {
        if (!this.channelInfo) {
          return []
        }
        return this.$store.state.companyUsers.filter(el => this.channelInfo.id_users.includes(+el.id))
      },
      cntOnlineMembers () {
        return this.channelUsers.filter(el => +el.is_online).length
      },
      sortedChannels () {
        let channels = this.channels || []
        let activeProject = this.$store.getters.activeProject
        let sorted = channels.sort((a, b) => {
          let isProjectChannel = channel => {
            return activeProject && channel.type === 'project' && +channel.id_project === activeProject.id
          }
          if (isProjectChannel(a) || isProjectChannel(b)) {
            return +isProjectChannel(b) - +isProjectChannel(a)
          } else if (+a.pin_to_top !== +b.pin_to_top) {
            return b.pin_to_top - a.pin_to_top
          }
          let bDate = b.message_last ? +moment(b.message_last.dta_create) : 0
          let aDate = a.message_last ? +moment(a.message_last.dta_create) : 0
          return bDate - aDate
        })
        if (this.searchKeyword) {
          return sorted.filter(el => el.name.toLowerCase().indexOf(this.searchKeyword.toLowerCase()) === 0)
        } else {
          return sorted
        }
      },
      chatWidth () {
        return this.$store.state.chatWidth
      },
      chatZoomWidth () {
        return this.$store.state.chatZoomWidth
      },
      computedStyle () {
        if (this.$store.state.isChatBig) {
          return {}
        }
        let width = this.chatZoomWidth ? this.chatZoomWidth : this.chatWidth
        return {
          width: `${width}px`
        }
      },
      cntUnread () {
        if (!this.channelInfo || !this.messages.length) {
          return 0
        }
        return this.messages.filter(el => +el.id_user !== this.$store.state.webuser.user.id && +moment(el.dta_create) > +moment(this.channelInfo.dta_last_read)).length
      },
      isPM () {
        if (!this.pmUserInfo && !this.channelInfo) {
          return false
        }
        return (this.pmUserInfo && !this.channelInfo) || this.channelInfo.type === 'pm'
      },
      recordTimeFortatted () {
        return secondsToHIS(this.recordTime, 'i:s', false)
      },
      chatSound () {
        let soundUrl = '/chat_sound.mp3'
        const soundUid = this.settings.chat_sound_uid
        if (soundUid) {
          const soundOption = this.settings.chat_sound_options.find(el => el.uid === soundUid)
          if (soundOption) {
            soundUrl = soundOption.url
          }
        }
        return new Audio(soundUrl)
      },
      cntHiddenChannels () {
        return this.channels.filter(el => el.is_hide_in_chats_list).length
      },
      noDiscHint () {
        return getNoDiscHint(this)
      }
    },
    watch: {
      '$store.state.isChatActive': function (val) {
        if (val) {
          this.activate()
        } else {
          this.isShowHiddenChannels = false
        }
      },
      '$store.state.isChatBig': function (val) {
        if (val && !this.channelId) {
          this.setLastChannel()
        }
        this.$nextTick(() => {
          this.htmlOverflow()
          this.scrollBottom()
        })
      },
      'searchKeyword': function (val) {
        if (val.length) {
          this.clearChannelsScrollStyles()
        } else {
          this.$nextTick(() => {
            this.showChannelsScrollbar()
          })
        }
        this.search(this, val)
      },
      'loading': function (val) {
        if (this.messagesScrollbar) {
          if (val) {
            this.$vuebar.lockScrollbar(this.$refs.messagesContainer)
          } else {
            this.$vuebar.unlockScrollbar(this.$refs.messagesContainer)
          }
        }
      }
    },
    mounted () {
      let vm = this
      vm.audio = vm.chatSound
      if (this.$route.hash && this.$route.hash === '#chat') {
        this.setChannelFromUrl()
        this.$store.commit('SET_CHAT_ACTIVE', true)
      } else if (this.$store.state.isChatBig && this.$store.state.isChatActive) {
        if (localStorage && localStorage.getItem('lastChannelId')) {
          this.channelId = +localStorage.getItem('lastChannelId')
        } else {
          this.setChannelFromUrl()
        }
      }
      const read = () => {
        if (this.cntUnread) {
          vm.scrollBottom()
          vm.markRead()
        }
      }
      this.addListener(document, 'visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          read()
        }
      })
      this.addListener(window, 'focus', read)
      window.addEventListener('resize', this.handleWindowResize)
      if (this.channelId) {
        this.loadMessages().then(() => {
          this.$nextTick(() => {
            if (this.$store.state.isChatActive) {
              read()
            }
          })
        })
      }
      this.loadChannels().then(() => {
        if (this.$route.hash && this.$route.hash.includes('#id_channel_push')) {
          let splittedHash = this.$route.hash.split('=')
          let channelId = splittedHash[splittedHash.length - 1]
          if (channelId) {
            let channel = this.channels.find(el => +el.id === +channelId)
            if (channel) {
              this.$nextTick(() => {
                this.openOnChannelId = channel.id
                this.$store.commit('SET_CHAT_ACTIVE', true)
              })
            }
          }
          this.$router.push({query: {}})
        }
        if (this.$store.state.isChatActive) {
          this.showChannelsScrollbar()
        }
        this.$nextTick(() => {
          this.handleWindowResize()
        })
      })
      this.$store.dispatch('updateUnreadChatMessagesCount')
      window.addEventListener('resize', this.handleResize)
      this.handleResize()
      window.chatComponent = this
      window.onbeforeunload = e => {
        if ((this.$store.state.chatMessage.length || this.isRecording) && this.$store.state.isChatActive) {
          e.message = this.$t('There are unsaved comments on this page. Discard changes?')
          return this.$t('There are unsaved comments on this page. Discard changes?')
        }
      }
      this.addListener(this.$el, 'click', e => {
        if (!this.isPM && e.target.classList && e.target.classList.contains('js-author')) {
          this.openPMChannel(e.target.getAttribute('data-user'))
        }
      })
    },
    beforeDestroy () {
      window.chatComponent = null
      window.removeEventListener('resize', this.handleWindowResize)
    }
  }
</script>
<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';
  .c-chat-small {
    display: none;
    &.active {
      display: block;
    }
    background: #fff;
    z-index: 100;
    &.m-small {
      height: calc(~'100%-'@navbar-height);
      width: 400px;
      position: fixed;
      top: @navbar-height;
      right: 0;
      border-left: 1px solid #dedede;
      border-bottom: 1px solid #dedede;
      @unread-height: 40px;
      &.m-left {
        left: @projects-bar-width;
        border-left: none;
        border-right: 1px solid #dedede;
      }
      .b-menu-row {
        height: @navbar-height;
        line-height: inherit;
        width: 100%;
        background: #fafafa;
        border-bottom: 1px solid #dcdcdc;
        display: flex;
        .b-avatar {
          height: auto;
          width: auto;
        }
        > div {
          align-items: center;
          display: flex;
        }
        > .b-left {
          > div {
            width: @navbar-height;
            height: @navbar-height;
            display: flex;
            align-items: center;
            justify-content: center;
            .hover-mixin();
            i {
              padding: 5px;
              font-size: 15px;
              line-height: 15px;
              color: #666;
              &.bu-cross {
                font-size: 11px;
              }
            }
          }
          &.m-channel {
            width: @navbar-height
          }
        }
        > .b-center {
          flex: 1;

          &.m-user-info {
            overflow: hidden;

            .b-user {
              width: 100%;

              .b-right {
                width: 100%;
                padding-right: 20px;

                .b-name {
                  width: 100%;
                }
              }
            }
          }

          .b-context-menu.c-channel-info {
            .b-channel-info {
              padding: 0 15px;
              > .b-avatar {
                margin-left: 0;
              }
              > .b-info {
                display: flex;
                height: 100%;
                flex-direction: column;
                justify-content: center;
                overflow: hidden;
                .b-name {
                  display: inline-flex;
                  align-items: center;
                  .e-name {
                    font-weight: normal;
                    font-size: 1em;
                    margin-bottom: 1px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  }
                  .e-mute {
                    font-size: .7em;
                    color: #777;
                    margin-left: 5px;
                  }
                }
                .e-seen {
                  color: #999;
                }
              }
            }
          }
          .b-pm-user.m-user-item {
            background: transparent;
            cursor: default;
            height: @navbar-height;
            padding: 0 15px;
            img {
              display: block;
            }
            > .b-right {
              .b-name {
                display: inline-flex;
                align-items: center;
                margin-bottom: 1px;
                .e-name {
                  font-weight: normal;
                  font-size: 1em;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
                .e-mute {
                  font-size: .7em;
                  color: #777;
                  margin-left: 5px;
                }
              }
              .e-seen {
                margin-top: 1px;
                color: #999;
              }
            }
          }
        }
        > .b-right {
          justify-content: center;
          .b-notifications-menu, .c-channel-menu {
            .b-toggle, .b-settings {
              width: @navbar-height;
              height: @navbar-height;
              display: flex;
              align-items: center;
              justify-content: center;
              background: transparent;
              .hover-mixin();
            }
          }
          .b-notifications-menu {
            .b-toggle {
              i {
                font-size: 15px;
                color: #666;
              }
            }
            .b-menu-items {
              width: 350px;
              padding: 5px 0;
              .m-row {
                height: 38px;
                display: flex;
                align-items: center;
              }
              .b-checkbox {
                display: block;
                label {
                  height: 100%;
                  .hover-mixin();
                  padding: 0 10px;
                  display: flex;
                  align-items: center;
                }
              }
              .b-headline {
                color: #777;
                padding: 0 15px;
                height: 30px;
              }
              .b-pause {
                padding: 0 25px;
                height: 32px;
              }
              .b-dnd {
                background: rgb(36, 102, 187);
                color: #fff;
                .e-on {
                  margin-bottom: 5px;
                  font-weight: bold;
                }
              }
              .b-pause, .b-resume, .b-prefs {
                .hover-mixin();
              }
              .b-dnd, .b-resume, .b-prefs {
                padding: 10px 15px;
              }
              .b-prefs {
                border-top: 1px solid #dcdcdc;
              }
            }
          }
        }
        &.m-chat-header {
          > .b-center {
            justify-content: flex-end;
            .b-search {
              width: 100%;
              margin: 0 5px;
              height: 30px;
              position: relative;
              .e-search {
                .search-input();
              }
              .e-close {
                .search-input-close();
              }
            }
            .e-show-search {
              width: @navbar-height;
              .hover-mixin();
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
            }
          }
        }
      }
      .b-messages-container {
        height: calc(100%~'-'@navbar-height * 2~'-'3px);
        overflow-y: auto;
        overflow-x: hidden;
        &.m-hidden {
          visibility: hidden;
        }
        .b-messages {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          flex-direction: column;
          /* padding: 10px 0 25px 0; */
          .b-message-spacer {
            height: 25px;
          }
          .b-message-row {
            transition: background linear 1s;
            &:first-child {
              margin-top: 10px;
            }
            .b-unread-cnt {
              height: @unread-height;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #fafafa;
              color: rgb(83, 139, 180);
            }
            &.m-new {
              transition: none;
              background: #69a2ef;
            }
            .b-message {
              display: flex;
              padding: 5px;
              padding-right: 10px;
              .b-left {
                width: 30px;
                .b-avatar {
                  img {
                    display: block;
                  }
                }
              }
              .b-right {
                margin-left: 10px;
                max-width: calc(100% ~'-' 40px);
                flex: 1;
                display: flex;
                .b-bubble {
                  padding: 5px 10px;
                  border: 1px solid #f3f3f3;
                  border-radius: 4px;
                  align-self: flex-start;
                  position: relative;
                  min-width: 70px;
                  max-width: 90%;
                  color: #172148;
                  background: #fafcff;
                  min-height: 45px;
                  .e-text {
                    .e-author {
                      color: #2567c0;
                      margin-right: 5px;
                    }
                    word-wrap: break-word;
                    line-height: 1.4em;
                    a {
                      padding: 3px 0;
                    }
                  }
                  .e-info {
                    color: #999;
                    font-style: italic;
                    font-size: .8em;
                    text-align: right;
                    margin-left: 5px;
                    min-width: 46px;
                    .e-read {
                      margin-right: 3px;
                      font-size: 10px;
                    }
                    .e-time, .e-read {
                      display: inline;
                    }
                  }
                }
              }
              &.m-img, &.m-video {
                .b-right {
                  img, video {
                    max-width: 100%;
                    cursor: pointer;
                    border-radius: 4px;
                    max-height: calc(100vh~'-'3 * @navbar-height~'-'20px);
                  }
                }
                video {
                  box-shadow: @image-shadow;
                }
              }
              &.m-img {
                margin: 4px 0;
                position: relative;
                > .b-right {
                  align-items: flex-start;
                  max-width: 90%;
                  .b-img-wrap {
                    box-shadow: @image-shadow;
                    background: #000;
                    border-radius: 4px;
                    .b-name {
                      background: #fff;
                      padding: 7px 10px;
                      color: #2567c0;
                      border-top-left-radius: 4px;
                      border-top-right-radius: 4px;
                      .e-author:hover {
                        text-decoration: underline;
                        cursor: pointer;
                      }
                    }
                    .b-overlay {
                      min-width: 100px;
                      min-height: 100px;
                      background: #000;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      flex-direction: column;
                      border-radius: 4px;
                    }
                    img {
                      display: block;
                      background: url(/img/transparent_grid.png);
                    }
                    .b-info {
                      font-size: .8em;
                      position: absolute;
                      bottom: 9px;
                      right: 14px;
                      background: rgba(0, 0, 0, .3);
                      color: #fff;
                      padding: 3px 3px 2px 7px;
                      border-radius: 3px;
                      display: none;
                      .e-read {
                        margin-right: 3px;
                      }
                    }
                    &:hover .b-info {
                      display: flex;
                    }
                    .b-caption {
                      background: #f8f8f8;
                      padding: 7px 10px;
                      border-bottom-left-radius: 4px;
                      border-bottom-right-radius: 4px;
                      width: 100%;
                      display: flex;
                      > .b-text {
                        line-height: normal;
                        flex: 1;
                        .e-text {
                          word-break: break-word;
                          line-height: 1.4em;
                        }
                      }
                      > .b-time {
                        margin-left: 10px;
                        font-size: 11.2px;
                        color: #999;
                        min-width: 48px;
                        text-align: right;
                        display: inline-flex;
                        justify-content: flex-end;
                        align-items: center;
                        > div {
                          display: inline;
                        }
                        > .e-read {
                          margin-left: 3px;
                        }
                      }
                    }
                  }
                }
                &.has-caption > .b-right {
                  .b-img-wrap {
                    display: flex;
                    flex-direction: column;
                    border-radius: 4px;
                    .b-overlay, .b-img, img {
                      border-bottom-left-radius: 0;
                      border-bottom-right-radius: 0;
                      align-self: center;
                    }
                    .b-overlay {
                      min-width: 150px;
                      min-height: 150px;
                    }
                  }
                }
                &.has-overlay > .b-right {
                  .b-img-wrap {
                    .b-overlay {
                      img {
                        border-radius: 0;
                      }
                    }
                  }
                }
              }
              &.m-file {
                .b-left {
                  width: 30px;
                  .b-avatar {
                    cursor: pointer;
                  }
                }
                .b-bubble {
                  margin-left: 10px;
                  background: #fafcff;
                  border-radius: 6px;
                  display: flex;
                  color: #172148;
                  position: relative;
                  border: 1px solid #f3f3f3;
                  min-width: 170px;
                  max-width: 90%;
                  padding: 5px;
                  cursor: pointer;
                  .b-icon {
                    display: flex;
                    align-items: center;
                    width: 46px;
                    height: 38px;
                    i {
                      // color: @basic-blue;
                      font-size: 2.3em;
                    }
                  }
                  .b-center {
                    overflow-x: hidden;
                    .e-name {
                      overflow-x: hidden;
                      text-overflow: ellipsis;
                      font-weight: bold;
                      margin-bottom: 4px;
                      color: #000;
                      white-space: nowrap;
                    }
                    .e-size {
                      color: #999;
                    }
                  }
                  .b-info {
                    position: absolute;
                    bottom: 4px;
                    right: 4px;
                    display: flex;
                    color: #999;
                    font-size: .8em;
                    .e-time {
                      margin-right: 3px;
                    }
                  }
                }
                &.m-audio {
                  cursor: default;
                }
                &.m-placeholder {
                  .b-icon {
                    justify-content: center;
                    align-items: center;
                    .c-spinner {
                      color: #000;
                    }
                  }
                }
              }
            }
            .b-date {
              margin: 5px 0;
              text-align: center;
              font-size: .8em;
              .e-date {
                color: #555;
                font-style: italic;
                display: inline-block;
                padding: 2px 4px;
                border-radius: 2px;
              }
            }
            &.m-mine .b-message.m-file {
              justify-content: flex-end;
              .b-bubble {
                background: #f8f8f8;
                color: #000;
              }
            }
            &.m-mine .b-right {
              justify-content: flex-end;
              .b-bubble {
                background: #f8f8f8;
                color: #000;
              }
            }
          }
          &.m-group {
            .b-message-row {
              .b-message {
                .b-left {
                  width: 34px;
                  .b-avatar-wrap {
                    padding: 2px;
                    cursor: pointer;
                  }
                }
                > .b-right .b-bubble .e-text .e-author:hover {
                  text-decoration: underline;
                  cursor: pointer;
                }
              }
            }
          }
        }
        .b-down-btn {
          width: 35px;
          height: 35px;
          position: absolute;
          right: 13px;
          bottom: 13px;
          font-size: 1.4em;
          border-radius: 50%;
          background: rgba(0, 0, 0, .4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: .7;
          z-index: 3;
          &.hidden {
            display: none;
          }
          &:hover {
            opacity: 1;
            cursor: pointer;
          }
          i {
            color: #fff;
          }
        }
      }
      .b-message-form {
        min-height: @navbar-height;
        position: absolute;
        bottom: 0;
        width: 100%;
        border-top: 1px solid #dcdcdc;
        display: flex;
        background: #fff;
        > div {
          display: flex;
          align-items: center;
        }
        .b-left, .b-right {
          width: @navbar-height;
          height: @navbar-height;
          justify-content: center;
          align-self: flex-end;
          .bu-send-plane {
            font-size: 1.4em;
          }
          .e-upload, .e-send {
            display: flex;
            width: @navbar-height;
            height: @navbar-height;
            align-items: center;
            justify-content: center;
            &:not(.m-inactive) {
              .hover-mixin();
            }
            &.m-inactive {
              opacity: .5;
            }
          }

          .e-recording-info {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }

          .e-recording-dot {
            border-radius: 50%;
            opacity: .25;
            background-color: red;
            width: 16px;
            height: 16px;
            animation: up-right 1s infinite;
          }

          .e-recording-time {
            position: absolute;
            left: 100%;
            margin-left: 10px;
            animation: none;
            opacity: 1;
          }
        }
        > .b-right {
          position: absolute;
          right: 0;
          bottom: 0;
          .e-record {
            width: 46px;
            height: 46px;
            .c-audio-recorder {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100%;
              font-size: 1.4em;
            }
          }
        }
        > .b-left {
          .e-upload {
            i.bu-upload-cloud {
              &:before {
                width: auto;
              }
            }
          }
        }
        .b-center {
          flex: 1;
          margin-right: 25px;
          > div {
            width: 100%;
            margin: 10px 15px;
            textarea {
              line-height: 21px;
              width: 100%;
              border: none;
              outline: none;
              padding: 0;
              &::-webkit-input-placeholder {
                font-style: italic;
              }
              &::-moz-placeholder {
                font-style: italic;
              }
              &:-ms-input-placeholder {
                font-style: italic;
              }
              &:-moz-placeholder {
                font-style: italic;
              }
            }
          }

          .e-recording-text {
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            font-size: .78rem;
            margin-left: 0;
            margin-left: 45px;
            color: rgba(0, 0, 0, 0.5);

            &.m-is-outside {
              color: rgb(58, 109, 153);
            }
          }
        }
        .b-typing {
          position: absolute;
          top: -22px;
          white-space: nowrap;
          max-width: 95%;
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 2px 10px;
          font-size: .9em;
          background: #fff;
        }
      }
      .b-channels-wrap {
        overflow-y: auto;
        height: calc(100% ~'-' @navbar-height);
        .b-channels {
          .b-channel {
            display: flex;
            .hover-mixin();
            @channel-height: 58px;
            height: @channel-height;
            &.hidden:not(:hover) {
              opacity: .5;
            }
            > .b-info {
              padding: 10px;
              flex: 1;
              display: flex;
              align-items: center;
              overflow: hidden;
              > .b-left {
                margin-right: 12px;
                display: flex;
                align-items: center;
                img {
                  display: block;
                }
              }
              > .b-right {
                flex: 1;
                overflow-x: hidden;
                display: flex;
                flex-direction: column;
                justify-content: center;
                .b-name-row {
                  display: flex;
                  margin-bottom: 7px;
                  margin-top: 2px;
                  height: 17px;
                  > .b-left {
                    flex: 1;
                    overflow-x: hidden;
                    display: flex;
                    align-items: center;
                    .e-name {
                      overflow-x: hidden;
                      text-overflow: ellipsis;
                      font-weight: bold;
                      white-space: nowrap;
                    }
                    .e-mute {
                      font-size: .7em;
                      color: #777;
                      margin-left: 5px;
                      i {
                        position: relative;
                        top: -1px;
                      }
                    }
                  }
                  > .b-right {
                    margin-left: 5px;
                    .e-read {
                      font-size: 13px;
                      i {
                        color: @telegram-blue;
                        &.bu-check-double {
                          margin-right: 2px;
                        }
                      }
                    }
                    .e-date {
                      color: rgb(168, 168, 168);
                    }
                  }
                }
                .b-message-row {
                  display: flex;
                  min-height: 15px;
                  > div {
                    display: flex;
                    align-items: center;
                  }
                  .b-message {
                    color: rgb(168, 168, 168);
                    text-overflow: ellipsis;
                    overflow-x: hidden;
                    flex: 1;
                    white-space: nowrap;
                    &.m-hidden {
                      visibility: hidden;
                    }
                    .e-author {
                      margin-right: 3px;
                      color: @telegram-blue;
                    }
                    .e-text {
                      text-overflow: ellipsis;
                      overflow-x: hidden;
                    }
                  }
                  .b-unread {
                    margin-left: 5px;
                    text-align: center;
                    .e-cnt-new {
                      background: @menu-red;
                      color: #fff;
                      border-radius: 7px;
                      padding: 2px 5px;
                      margin-left: 5px;
                      font-size: .7em;
                      line-height: 1.2em;
                    }
                  }
                  .b-pin {
                    color: @hover-dark;
                    margin-left: 5px;
                  }
                }
              }
            }
          }
          .e-show-hidden {
            height: 34px;
            display: flex;
            justify-content: center;
            align-items: center;
            color: @basic-blue;
            .hover-mixin();
            margin-bottom: 10px;
          }
        }
        .b-channels, .b-new-users, .b-empty {
          > .b-header {
            color: @red-color;
            margin: 10px 15px;
          }
        }
        .b-new-users {
          .b-users {
            .b-user {
              display: flex;
              align-items: center;
              padding: 10px;
              .hover-mixin();
              > .b-left {
                margin-right: 10px;
              }
              > .b-right {
                .e-name {
                  font-weight: bold;
                  font-size: .9em;
                }
              }
            }
          }
        }
      }
    }
    .b-context-menu.c-channel-info {
      .b-channel-info {
        width: 220px;
        display: flex;
        height: @navbar-height;
        align-items: center;
        .hover-mixin();
        > .b-avatar {
          margin-left: 15px;
          img {
            display: block;
          }
        }
        > .b-info {
          margin-left: 10px;
          .e-name {
            font-size: .8em;
            font-weight: bold;
          }
          .e-seen {
            font-size: .7em;
            margin-top: 2px;
            color: #777;
          }
        }
      }
      .b-menu-items {
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
      }
    }
    .m-user-item {
      display: flex;
      padding: 0 15px;
      height: 40px;
      align-items: center;
      .hover-mixin(true);
      > .b-right {
        margin-left: 10px;
        flex: 1;
        .e-name {
          font-weight: bold;
          font-size: .8em;
        }
        .e-seen {
          font-size: .7em;
          margin-top: 2px;
          color: #777;
          white-space: nowrap;
        }
      }
    }
  }

  @keyframes up-right {
      0% {
          opacity: .25
      }
      50% {
          opacity: 1;
      }
      100% {
          opacity: .25;
      }
  }
</style>
