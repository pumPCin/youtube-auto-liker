// ==UserScript==
// @name           YouTube Auto-Liker
// @namespace      https://github.com/pumPCin/youtube-auto-liker
// @version        1.3.33
// @description    Automatically likes videos of channels you're subscribed to
// @description:ru Автоматически нравится видео каналов, на которые вы подписаны
// @author         pumPCin
// @license        MIT
// @icon           https://raw.githubusercontent.com/pumPCin/youtube-auto-liker/master/logo.svg
// @downloadurl    https://github.com/pumPCin/youtube-auto-liker/raw/master/youtube-auto-liker.user.js
// @updateurl      https://github.com/pumPCin/youtube-auto-liker/raw/master/youtube-auto-liker.user.js
// @match          http://*.youtube.com/*
// @match          https://*.youtube.com/*
// @grant          GM_getValue
// @grant          GM_setValue
// @run-at         document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict'

  function initializeSetting(key, defaultValue) {
    if (GM_getValue(key) === undefined) {
      GM_setValue(key, defaultValue)
    }
    return GM_getValue(key)
  }

  const settings = {
    CHECK_FREQUENCY: initializeSetting('CHECK_FREQUENCY', 30000),
    WATCH_THRESHOLD: initializeSetting('WATCH_THRESHOLD', 60),
    LIKE_IF_NOT_SUBSCRIBED: initializeSetting('LIKE_IF_NOT_SUBSCRIBED', false),
    AUTO_LIKE_LIVE_STREAMS: initializeSetting('AUTO_LIKE_LIVE_STREAMS', true)
  }

  const SELECTORS = {
    PLAYER: '#movie_player',
    SUBSCRIBE_BUTTON: '.yt-spec-button-shape-next--icon-leading-trailing',
    LIKE_BUTTON: 'button:has([animated-icon-type="LIKE"])',
    DISLIKE_BUTTON: 'ytd-menu-renderer.ytd-watch-metadata > div:nth-child(1) > segmented-like-dislike-button-view-model:nth-child(1) > yt-smartimation:nth-child(1) > div:nth-child(1) > div:nth-child(1) > dislike-button-view-model:nth-child(2) > toggle-button-view-model:nth-child(1) > button-view-model:nth-child(1) > button:nth-child(1)'
  }

  const autoLikedVideoIds = []

  function getVideoId() {
    const elem = document.querySelector('#page-manager > ytd-watch-flexy')
    return elem && elem.hasAttribute('video-id')
      ? elem.getAttribute('video-id')
      : new URLSearchParams(window.location.search).get('v')
  }

  function watchThresholdReached() {
    const player = document.querySelector(SELECTORS.PLAYER)
    if (player) {
      const watched = player.getCurrentTime() / player.getDuration()
      const watchedTarget = settings.WATCH_THRESHOLD / 100
      if (watched < watchedTarget) {
        return false
      }
    }
    return true
  }

  function isSubscribed() {
    const subscribeButton = document.querySelector(SELECTORS.SUBSCRIBE_BUTTON)
    if (!subscribeButton) throw Error("Couldn't find sub button")
    const subscribed = subscribeButton.hasAttribute('subscribe-button-invisible') || subscribeButton.hasAttribute('subscribed')
    return subscribed
  }

  function wait() {
    if (watchThresholdReached()) {
      try {
        if (settings.LIKE_IF_NOT_SUBSCRIBED || isSubscribed()) {
          if (settings.AUTO_LIKE_LIVE_STREAMS || window.getComputedStyle(document.querySelector('.ytp-live-badge')).display === 'none') {
            like()
          }
        }
      } catch () {}
    }
  }

  function isButtonPressed(button) {
    return button.classList.contains('style-default-active') || button.getAttribute('aria-pressed') === 'true'
  }

  function like() {
    const likeButton = document.querySelector(SELECTORS.LIKE_BUTTON)
    const dislikeButton = document.querySelector(SELECTORS.DISLIKE_BUTTON)
    if (!likeButton) throw Error("Couldn't find like button")
    if (!dislikeButton) throw Error("Couldn't find dislike button")
    const videoId = getVideoId()
    if (!autoLikedVideoIds.includes(videoId)) {
    if (isButtonPressed(likeButton) || isButtonPressed(dislikeButton)) {
      autoLikedVideoIds.push(videoId)
    } else {
      likeButton.click()
    }
    }
  }

  setInterval(wait, settings.CHECK_FREQUENCY)
})()
