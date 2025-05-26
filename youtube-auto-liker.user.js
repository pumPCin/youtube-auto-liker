// ==UserScript==
// @name           YouTube Auto-Liker
// @namespace      https://github.com/pumPCin/youtube-auto-liker
// @version        1.3.30
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
  'use strict';

  function initializeSetting(key, defaultValue) {
    if (GM_getValue(key) === undefined) {
      GM_setValue(key, defaultValue);
    }
    return GM_getValue(key);
  }

  const settings = {
    CHECK_FREQUENCY: initializeSetting('CHECK_FREQUENCY', 5000),
    WATCH_THRESHOLD: initializeSetting('WATCH_THRESHOLD', 50),
    LIKE_IF_NOT_SUBSCRIBED: initializeSetting('LIKE_IF_NOT_SUBSCRIBED', false),
    AUTO_LIKE_LIVE_STREAMS: initializeSetting('AUTO_LIKE_LIVE_STREAMS', false)
  };

  const SELECTORS = {
    PLAYER: '#movie_player',
    SUBSCRIBE_BUTTON: '.yt-spec-button-shape-next--icon-leading-trailing', '#subscribe-button > ytd-subscribe-button-renderer, ytd-reel-player-overlay-renderer #subscribe-button',
    LIKE_BUTTON: 'button:has([animated-icon-type="LIKE"])', 'like-button-view-model button, #menu .YtLikeButtonViewModelHost button, #segmented-like-button button, #like-button button',
    DISLIKE_BUTTON: 'dislike-button-view-model button, #menu .YtDislikeButtonViewModelHost button, #segmented-dislike-button button, #dislike-button button'
  };
  const autoLikedVideoIds = [];

  function getVideoId() {
    const elem = document.querySelector('#page-manager > ytd-watch-flexy');
    return elem && elem.hasAttribute('video-id')
      ? elem.getAttribute('video-id')
      : new URLSearchParams(window.location.search).get('v');
  }

  function watchThresholdReached() {
    const player = document.querySelector(SELECTORS.PLAYER);
    if (player) {
      const watched = player.getCurrentTime() / player.getDuration();
      const watchedTarget = settings.WATCH_THRESHOLD / 100;
      if (watched < watchedTarget) {
        return false;
      }
    }
    return true;
  }

  function isSubscribed() {
    const subscribeButton = document.querySelector(SELECTORS.SUBSCRIBE_BUTTON);
    if (!subscribeButton) throw Error("Couldn't find sub button");
    const subscribed = subscribeButton.hasAttribute('subscribe-button-invisible') || subscribeButton.hasAttribute('subscribed');
    return subscribed;
  }

  function wait() {
    if (watchThresholdReached()) {
      try {
        if (settings.LIKE_IF_NOT_SUBSCRIBED || isSubscribed()) {
          if (settings.AUTO_LIKE_LIVE_STREAMS || window.getComputedStyle(document.querySelector('.ytp-live-badge')).display === 'none') {
            like();
          }
        }
      } catch (e) {
      }
    }
  }

  function isButtonPressed(button) {
    return button.classList.contains('style-default-active') || button.getAttribute('aria-pressed') === 'true';
  }

  function like() {
    const likeButton = document.querySelector(SELECTORS.LIKE_BUTTON);
    const dislikeButton = document.querySelector(SELECTORS.DISLIKE_BUTTON);
    if (!likeButton) throw Error("Couldn't find like button");
    if (!dislikeButton) throw Error("Couldn't find dislike button");
    const videoId = getVideoId();
    if (isButtonPressed(likeButton)) {
      autoLikedVideoIds.push(videoId);
    } else if (!autoLikedVideoIds.includes(videoId) && !isButtonPressed(dislikeButton)) {
      likeButton.click();
      if (isButtonPressed(likeButton)) {
        autoLikedVideoIds.push(videoId);
      }
    }
  }

  setInterval(wait, settings.CHECK_FREQUENCY);
})();
