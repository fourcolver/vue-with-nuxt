const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const winston = require('winston')
const axios = require('axios')
require('dotenv').config({path: process.cwd() + '/../.env'})

const debug = process.argv.indexOf('--debug') !== -1
const noSession = process.argv.indexOf('--no-session') !== -1
const routeEvents = ['dashboard_event', 'instant_screen_request', 'instant_screen_done', 'chat_browser_sound']
const companyBroadcastEvents = ['user_activated']

const api = axios.create({
  baseURL: process.env.API_URL
})
api.put('socket-session/deactivate-all')

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    // new winston.transports.File({filename: '/var/www/timeburger.org/socket.log'})
    new winston.transports.File({filename: './socket.log'})
  ]
})

let users = {}

io.use(async function (socket, next) {
  let proxyIp = socket.handshake.headers['x-forwarded-for']
  let ip = socket.handshake.address
  if (ip.substr(0, 7) === '::ffff:') {
    ip = ip.substr(7)
  }
  if (!proxyIp && ['127.0.0.1', '10.0.2.2'].indexOf(ip) !== -1) {
    socket.fromAPI = true
    next()
  } else if (noSession) {
    let m = process.argv.join(' ').match(/--user=(\d+)/)
    if (m) {
      socket.user = {id: +m[1], id_company: 35}
      socket.session = {id: +m[1] + 1}
    }
    next()
  } else {
    if (socket.handshake.query && socket.handshake.query.token) {
      if (debug) {
        console.log('Calling socket session. Token: ' + socket.handshake.query.token)
      }
      const data = {
        tab_focused: socket.handshake.query.tab_focused,
      }
      const headers = {
        Authorization: 'Bearer ' + socket.handshake.query.token,
        'Client-Company': socket.handshake.query.uid
      }
      let res = null
      if (!noSession) {
        res = await api.post('socket-session', data, {headers: headers}).catch(() => {
          if (debug) {
            console.log('Session not created on server')
          }
        })
      }
      if (res && res.data.session) {
        if (debug) {
          console.log('Session created on server. Session id: ' + res.data.session.id + ', user ' + res.data.session.user.id + ', company ' + res.data.session.user.id_company)
        }
        socket.user = res.data.session.user
        socket.session = res.data.session
        return next()
      } else {
        return next(new Error('Authentication error. Invalid token'))
      }
    } else {
      next(new Error('Authentication error'))
    }
  }
})
  .on('connection', function (socket) {
    let idUser = null
    let clients = []
    if (!socket.fromAPI && socket.user) {
      if (debug) {
        console.log('Connection. Client session: ' + socket.session.id + ' User: ' + socket.user.id)
      }
      idUser = +socket.user.id
      clients = users[idUser]
      if (!clients) {
        users[idUser] = {}
        clients = users[idUser]
      }
      if (!clients[socket.id]) {
        clients[socket.id] = {session: socket.session.id}
      }
      if (socket.user.id_company) {
        socket.join('company_' + socket.user.id_company)
      }
    }
    socket.on('disconnect', function () {
      if (!socket.fromAPI) {
        if (debug && socket.session) {
          console.log('Disconnect. Client session: ' + socket.session.id + ' User: ' + socket.user.id + ' Socket id: ' + socket.id)
          console.log('Clients: ')
          console.log(clients)
        }
        if (clients[socket.id] && socket.session) {
          if (debug) {
            console.log('Sending deactivate query. Client session: ' + socket.session.id + ' User: ' + socket.user.id)
          }
          if (!noSession) {
            api.put('socket-session/deactivate?id=' + socket.session.id).catch(() => {
              console.log('Error ' + 'socket-session/deactivate?id=' + socket.session.id)
            })
          }
          delete clients[socket.id]
        }
        if (!Object.keys(clients).length) {
          delete users[idUser]
        }
      }
    })
    socket.on('api', function (data) {
      logger.log({
        level: 'info',
        msg: 'api: ' + JSON.stringify(data)
      })
      if (socket.fromAPI && data && data.event_name) {
        if (data.id_recipients) {
          for (let i = 0; i < data.id_recipients.length; i++) {
            let idRecipient = +data.id_recipients[i]
            if (users[idRecipient]) {
              for (let k in users[idRecipient]) {
                socket.to(k).emit(data.event_name, data.data || {})
              }
            }
          }
        } else if (data.id_company) {
          socket.broadcast.to('company_' + data.id_company).emit(data.event_name, data.data || {})
        }
      }
    })
    routeEvents.forEach(evt => {
      socket.on(evt, data => {
        if (debug) {
          console.log('route event: ' + evt)
          console.log(data)
        }
        if (data.id_recipients) {
          for (let i = 0; i < data.id_recipients.length; i++) {
            let idRecipient = +data.id_recipients[i]
            if (users[idRecipient]) {
              for (let j in users[idRecipient]) {
                if (data.id_socket_sessions && data.id_socket_sessions.length && users[idRecipient][j]['session'] &&
                  !data.id_sockets_sessions.some(el => +el === +users[idRecipient][j]['session'])) {
                  continue
                }
                socket.to(j).emit(evt, data.data || {})
              }
            }
          }
        }
      })
    })
    companyBroadcastEvents.forEach(evt => {
      socket.on(evt, data => {
        if (debug) {
          console.log(evt)
          console.log('room: ' + 'company_' + socket.user.id_company)
        }
        socket.to('company_' + socket.user.id_company).emit(evt, data)
      })
    })
    socket.on('typing', function (data) {
      if (debug) {
        console.log('user is typing')
        console.log(data)
      }
      socket.broadcast.emit('typing', data)
    })
    socket.on('activity', function (data) {
      if (noSession) {
        return
      }
      api.put('socket-session/' + socket.session.id, {
        is_activity: !!data.is_active,
        tab_focused: !!data.tab_focused
      }).catch(err => console.log(err))
    })
  })
app.get('/reload', function (req, res) {
  io.emit('reload')
  res.send('')
})
app.get('/clients', function (req, res) {
  console.log(io.sockets.connected)
  res.send('')
})
app.get('/typing', function (req, res) {
  io.emit('typing')
  res.send('')
})
http.listen(8002, function () {
  console.log('listening on *:8002')
})
