import 'babel-polyfill'

import Vue from 'vue'
import { sync } from 'vuex-router-sync'
import Meta from 'vue-meta'
import VueGtm from 'vue-gtm'
import Raven from 'raven-js'
import RavenVue from 'raven-js/plugins/vue'

import App from './App'
import store from './store'
import router from './router'
import { SENTRY_ENDPOINT } from './config'
import VueMq from 'vue-mq'

const IS_PROD = (process.env.NODE_ENV === 'production')

Vue.config.productionTip = false
sync(store, router)
Vue.use(Meta)
Vue.use(VueGtm, {
  debug: !IS_PROD,
  vueRouter: router
})

Vue.use(VueMq, {
  breakpoints: {
    sm: '39.9375em',
    md: '63.9375em',
    lg: Infinity
  }
})

if (IS_PROD) {
  Raven.config(SENTRY_ENDPOINT)
    .addPlugin(RavenVue, Vue)
    .install()
}

new Vue({ // eslint-disable-line no-new
  el: '#application',
  store,
  router,
  render: h => h(App)
})
