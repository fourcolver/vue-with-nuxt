<template>

  <div class="c-index-global">
    <div class="b-inner">
      <div class="b-top">
        <div class="b-left">
          <div class="e-logo">
            <a href="https://quwi.com">quwi</a>
          </div>
        </div>
        <div class="b-right">
          <nuxt-link class="e-btn-link m-white" to="/login">Login</nuxt-link>
          <nuxt-link class="e-btn-link" to="/signup">Sign up</nuxt-link>
        </div>
      </div>
      <div class="b-title">
        Worlds easiest project management<br>
        system with screenshots
      </div>
      <div class="b-center-button">
        <nuxt-link class="e-btn-link" to="/signup">Get free access</nuxt-link>
      </div>
      <div class="b-links">
        <div class="b-left">
        </div>
        <div class="b-center">
          <div class="e-available">Also available on:</div>
          <div class="b-platforms">
            <a :href="href" v-for="href, link in links" class="e-link">{{ link }}</a>
          </div>
        </div>
        <div class="b-right">
          <img class="m-ellipse" width="243px" height="243px" src="/img/index/ellipse.png"/>
        </div>
      </div>
      <div class="b-slogan m-bug-tracker">
        <div class="b-img-col" id="zalupoi">
          <img width="597px" height="565px" src="/img/index/shape-1.png">
        </div>
        <div class="b-text-col">
          <div class="b-text">
            <div class="e-title">Bug & Task Tracker</div>
            <div class="e-text">
              <p>
                Really easy-to-use task tracker that has thousands of small things to make your experience pleasant and convenient.
              </p>
              <p>
                We were shocked to see that some bug tracking systems do not work out-of-the box and need very long and painful setup just to get it going. Quwi is ready out-of-the box.
              </p>
            </div>
            <div class="b-button">
              <nuxt-link class="e-btn-link" to="/signup">Get free access</nuxt-link>
            </div>
          </div>
        </div>
      </div>
      <div class="b-slogan m-chat">
        <div class="b-text-col">
          <div class="b-text">
            <div class="e-title">Chat & Messenger</div>
            <div class="e-text">
              <p>Use Quwi chat and messenger app which is easier than most messenger-only apps on the market today.</p>
              <p>
                Chat has tons of project management functions already integrated inside to make your life easy with customers who love to interact real time rather than creating tickets.</p>
              <p>And you still get everything in order and nothing lost.</p>
            </div>
            <div class="b-button">
              <nuxt-link class="e-btn-link" to="/signup">Get free access</nuxt-link>
            </div>
          </div>
        </div>
        <div class="b-img-col">
          <img src="/img/index/shape-2.png" width="590px" height="420px">
        </div>
      </div>
      <div class="b-slogan m-screens">
        <div class="b-img-col">
          <img src="/img/index/shape-3.png" width="572px" height="432px" alt="">
        </div>
        <div class="b-text-col">
          <div class="b-text">
            <div class="e-title">Screenshots and Videos from Workers</div>
            <div class="e-text">
              <p>
                Not just screenshots that are useful to proof your workers are actually woking, but comprehensive statistics and analytics.</p>

              <p>
                Unique: analysis by neural network of worker’s performance against other people in the same work type.</p>

              <p>Unique: you can make a screenshot anytime you want to, not just fixed “every xx minutes”</p>
            </div>
            <div class="b-button">
              <nuxt-link class="e-btn-link" to="/signup">Get free access</nuxt-link>
            </div>
          </div>
        </div>
      </div>
      <div class="b-slogan m-tracking">
        <div class="b-text-col">
          <div class="b-text">
            <div class="e-title">Automatic Time Tracking for Workers</div>
            <div class="e-text">
              <p>Use Quwi chat and messenger app which is easier than most messenger-only apps on the market today.</p>
              <p>
                Chat has tons of project management functions already integrated inside to make your life easy with customers who love to interact real time rather than creating tickets.</p>
              <p>And you still get everything in order and nothing lost.</p>
            </div>
            <div class="b-button">
              <nuxt-link class="e-btn-link" to="/signup">Get free access</nuxt-link>
            </div>
          </div>
        </div>
        <div class="b-img-col">
          <img width="604px" height="435px" src="/img/index/shape-4.png">
        </div>
      </div>
      <div class="b-slogan m-screen-capture">
        <div class="b-img-col">
          <img width="572px" height="432px" src="/img/index/shape-5.png" alt="">
        </div>
        <div class="b-text-col">
          <div class="b-text">
            <div class="e-title">Built-in Screen Capture Utility</div>
            <div class="e-text">
              <p>8 out of 10 tasks contain screenshots. Good news! We have this function build-in and ready to use.</p>
              <p>
                One click and screenshot attached to the ticket. It’s that easy! No watermarks, logos or copyright info stored inside images. Use it anywhere.</p>
              <p>$19 value for free</p>
            </div>
            <div class="b-button">
              <nuxt-link class="e-btn-link" to="/signup">Get free access</nuxt-link>
            </div>
          </div>
        </div>
      </div>
      <div class="b-slogan m-video-capture">
        <div class="b-text-col">
          <div class="b-text">
            <div class="e-title">Built-in Video Capture Utility</div>
            <div class="e-text">
              <p>
                Just like integrated screenshot feature, you don’t need to install any programs to make screencasts. Everything pre-built in.</p>
              <p>No watermarks, logos or copyright info stored inside videos. Use it anywhere.</p>
              <p>$250 value for free</p>
            </div>
            <div class="b-button">
              <nuxt-link class="e-btn-link" to="/signup">Get free access</nuxt-link>
            </div>
          </div>
        </div>
        <div class="b-img-col">
          <img src="/img/index/shape-6.png" width="572px" height="432px" alt="">
        </div>
      </div>
      <div class="b-slogan m-android">
        <div class="b-img-col">
          <img width="524px" height="374px" src="/img/index/shape-7.png" alt="">
        </div>
        <div class="b-text-col">
          <div class="b-text">
            <div class="e-title">App for Android</div>
            <div class="e-text">
              We have android app with complete functionality: tasks, chat, notifications, drafts. We don’t have app for iphone and do not plan on having one.
            </div>
            <div class="b-button">
              <nuxt-link class="e-btn-link" to="/signup">Get free access</nuxt-link>
            </div>
          </div>
        </div>
      </div>
      <div class="b-slogan m-desktop">
        <div class="b-text-col">
          <div class="b-text">
            <div class="e-title">Apps for desktop:
              Windows, Linux and MacOS
            </div>
            <div class="e-text">
              In addition to mobile and android versions, we have app versions for all major desktop operating systems: Windows, Linux and MacOS.
            </div>
            <div class="b-button">
              <nuxt-link class="e-btn-link" to="/signup">Get free access</nuxt-link>
            </div>
          </div>
        </div>
        <div class="b-img-col">
          <img src="/img/index/shape-8.png" alt="" width="549px" height="391px">
        </div>
      </div>
      <div class="b-slogan m-mobile">
        <div class="b-img-col">
          <img src="/img/index/shape-9.png" width="532px" height="404px" alt="">
        </div>
        <div class="b-text-col">
          <div class="b-text">
            <div class="e-title">Mobile-Friendly Version</div>
            <div class="e-text">
              We have mobile version that has almost full functionality for outdated phones and iphones.
            </div>
            <div class="b-button">
              <nuxt-link class="e-btn-link" to="/signup">Get free access</nuxt-link>
            </div>
          </div>
        </div>
      </div>
      <div class="b-slogan m-drafts">
        <div class="b-text-col">
          <div class="b-text">
            <div class="e-title">Drafts and Autosave</div>
            <div class="e-text">
              <p>
                Don’t have time to write full-featured task or have to leave quickly. Drop it where you’ve typing. The system will automatically save the draft.</p>
              <p>Create a draft from your phone in one click.</p>
            </div>
            <div class="b-button">
              <nuxt-link class="e-btn-link" to="/signup">Get free access</nuxt-link>
            </div>
          </div>
        </div>
        <div class="b-img-col">
          <img src="/img/index/shape-10.png" width="636px" height="497px" alt="">
        </div>
      </div>
      <div class="b-slogan m-voice">
        <div class="b-img-col">
          <img src="/img/index/shape-11.png" width="493px" height="374px" alt="">
        </div>
        <div class="b-text-col">
          <div class="b-text">
            <div class="e-title">Voice Recognition</div>
            <div class="e-text">
              <p>
                Don’t have time to type? Spell it and Quwi will add both audio and transcript to it for those who like to read.</p>
              <p>Unique feature: nobody has it! I mean it. Nobody! All suck!</p>
            </div>
            <div class="b-button">
              <nuxt-link class="e-btn-link" to="/signup">Get free access</nuxt-link>
            </div>
          </div>
        </div>
      </div>
      <div class="b-slogan m-chat-team">
        <div class="b-text-col">
          <div class="b-text">
            <div class="e-title">Chat for Team</div>
            <div class="e-text">
              Chat module is prebuilt into Quwi app for all operating systems and is also available in the web version. The system automatically creates a room with all people who belong to the project. Private 1-1 chats are also available
            </div>
            <div class="b-button">
              <nuxt-link class="e-btn-link" to="/signup">Get free access</nuxt-link>
            </div>
          </div>
        </div>
        <div class="b-img-col">
          <img src="/img/index/shape-12.png" width="530px" height="424px" alt="">
        </div>
      </div>
      <div class="b-slogan m-editor">
        <div class="b-img-col">
          <img src="/img/index/shape-13.png" width="607px" height="434px" alt="">
        </div>
        <div class="b-text-col">
          <div class="b-text">
            <div class="e-title">Full-Featured Visual Editor</div>
            <div class="e-text">
              Our custom editor has many cool features, like inserting images right from clipboard (ctrl+v), automatic player for videos, integrated image editor, option to reply right inside the ticket, drag and drop images, videos and files right into the ticket.
            </div>
            <div class="b-button">
              <nuxt-link class="e-btn-link" to="/signup">Get free access</nuxt-link>
            </div>
          </div>
        </div>
      </div>
      <div class="b-slogan m-inline-files">
        <div class="b-text-col">
          <div class="b-text">
            <div class="e-title">In-line viewing of docx and pdf files</div>
            <div class="e-text">
              No need to download docx files and open them in your office application, you can quickly view them right inside Quwi.
            </div>
            <div class="b-button">
              <nuxt-link class="e-btn-link" to="/signup">Get free access</nuxt-link>
            </div>
          </div>
        </div>
        <div class="b-img-col">
          <img src="/img/index/shape-14.png" width="595px" height="347px" alt="">
        </div>
      </div>
      <div class="b-slogan m-comments">
        <div class="b-img-col">
          <img src="/img/index/shape-15.png" width="540px" height="421px" alt="">
        </div>
        <div class="b-text-col">
          <div class="b-text">
            <div class="e-title">Commenting Inside Tickets</div>
            <div class="e-text">
              <p>It often happens that your coder has a questions that is related to a phrase somewhere in a middle.</p>

              <p>
                For this case people often use citation. This creates total mess, especially on big tasks and is almost impossible to restore what question was related to what part of the ticket.</p>
            </div>
            <div class="b-button">
              <nuxt-link class="e-btn-link" to="/signup">Get free access</nuxt-link>
            </div>
          </div>
        </div>
      </div>
      <div class="b-slogan m-we-use">
        <div class="b-text-col">
          <div class="b-text">
            <div class="e-title">We Use Quwi</div>
            <div class="e-text">
              <p>The key for good product: creator has to use it.</p>

              <p>
                Quwi is constantly growing and we are using Quwi to develop Quwi. We tried other systems, but IMO all of them are crap in comparison to Quwi.</p>

              <p>
                It looks like developers of other systems do not use own products as they lack so many obvious convenient features.</p>
            </div>
            <div class="b-button">
              <nuxt-link class="e-btn-link" to="/signup">Get free access</nuxt-link>
            </div>
          </div>
        </div>
        <div class="b-img-col">
          <img src="/img/index/shape-16.png" width="567px" height="395px" alt="">
        </div>
      </div>
      <site-footer></site-footer>
    </div>
  </div>
</template>

<script>
  import SiteFooter from '~/components/SiteFooter'
  import { capitalize } from '~/utils/helpers'
  import { APP_DOWNLOAD_LINKS } from '~/utils/dict'
  import ActiveInput from '../ActiveInput.vue'

  export default {
    name: 'index-global',
    data () {
      return {
        email: '',
        firstErrors: {
          email: ''
        }
      }
    },
    components: {
      ActiveInput,
      SiteFooter
    },
    methods: {
      submit () {
        if (!this.email.trim()) {
          this.firstErrors.email = this.tt('Email can not be blank')
          return
        }
        if (!this.email.match(/.+@.+\..+/)) {
          this.firstErrors.email = this.tt('This Email address is not valid')
          return
        }
        this.$router.push({path: '/signup', query: {email: this.email}})
      },
      tt (msg) {
        if (this.$i18n.messages['en-US'][msg]) {
          return this.$i18n.messages['en-US'][msg]
        }
        return msg
      },
      capitalize
    },
    computed: {
      landerLocale () {
        return 'en-US'
      },
      links () {
        return APP_DOWNLOAD_LINKS
      }
    },
    mounted () {
      window.indexGlobal = this
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/menu.less';
  @import '~assets/css/variables.less';

  @font-face {
    font-family: hemi;
    src: url(~assets/fonts/Hemi-Head-426.woff2) format("woff2");
  }

  @font-face {
    font-family: gothampro;
    src: url(~assets/fonts/gothampro/GothamPro.woff) format("woff");
  }

  .c-index-global {
    @index-purple: #665ab8;
    width: 100%;
    overflow-x: hidden;
    .b-inner {
      width: 992px;
      margin: auto;
      font-family: GothamPro, "Helvetica Neue", Helvetica, sans-serif;
      .e-btn-link {
        display: flex;
        align-items: center;
        height: 36px;
        padding: 0 24px;
        border-radius: 18px;
        background: @index-purple;
        color: #fff;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 0.8em;
        text-decoration: none;
        border: 2px solid @index-purple;
        &:hover {
          background: rgba(102, 90, 184, .7);
          border-color: rgba(102, 90, 184, .7);
        }
        &.m-white {
          color: @index-purple;
          background: #fff;
          &:hover {
            background: #eee;
          }
        }
      }
      .b-top {
        display: flex;
        align-items: center;
        height: 100px;
        padding: 0 55px;
        > .b-left {
          flex: 1;
          .e-logo {
            a {
              font-size: 50px;
              color: @index-purple !important;
              font-family: hemi, "Helvetica Neue", Helvetica, sans-serif;
              text-decoration: none;
            }
          }
        }
        > .b-right {
          display: flex;
          align-items: center;
          height: 100%;
          .e-btn-link:first-child {
            margin-right: 15px;
          }
        }
      }
      > .b-title {
        height: 180px;
        padding-bottom: 70px;
        display: flex;
        justify-content: center;
        text-align: center;
        align-items: flex-end;
        font-size: 24px;
        line-height: 1.6;
      }
      .b-center-button {
        display: flex;
        justify-content: center;
      }
      .b-links {
        display: flex;
        .b-left {
          width: 243px;
        }
        .b-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
          align-items: center;
          .e-available {
            margin-bottom: 20px;
            color: #85828a;
          }
          .b-platforms {
            display: flex;
            .e-link {
              color: @index-purple;
              font-weight: bold;
              display: inline-flex;
              border-bottom: 2px solid @index-purple;
              padding: 2px 0;
              text-decoration: none;
              text-transform: capitalize;
              &:hover {
                border-bottom-color: transparent;
              }
              &:not(:last-child) {
                margin-right: 20px;
              }
            }
          }
        }
        > .b-right {
          img {
            position: relative;
            right: -45px;
            top: 20px;
          }
        }
      }
      .b-slogan {
        display: flex;
        > .b-img-col {
          width: 45%;
          display: flex;
          justify-content: flex-end;
          &:last-child {
            justify-content: flex-start;
          }
        }
        > .b-text-col {
          width: 55%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 60px 80px;
          .e-title {
            font-size: 2em;
            margin-bottom: 25px;
          }
          .e-text {
            margin-bottom: 25px;
            line-height: 1.5em;
            color: rgb(133, 130, 138);
            p {
              margin-bottom: 10px;
            }
          }
          .b-button {
            display: flex;
          }
        }
      }
      .m-bug-tracker {
        position: relative;
        height: 340px;
        margin-bottom: 160px;
        > .b-img-col {
          img {
            position: absolute;
            top: -85px;
          }
        }
        > .b-text-col {
          padding: 0;
          .b-text {
            padding: 0 50px;
            position: absolute;
            top: 80px;
          }
        }
      }
      .c-site-footer {
        color: #85828a;
        background-color: transparent;
        margin-top: 70px;
        .b-inner {
          .b-links {
            font-size: 1.1em;
            margin-bottom: 30px;
            display: flex;
            justify-content: center;
            a {
              border-bottom: 1px solid @index-purple;
              text-decoration: none;
              color: @index-purple;
              font-weight: bold;
              margin: 0 10px;
              &:hover {
                border-bottom-color: transparent;
              }
            }
          }
        }
      }
    }
  }
</style>
