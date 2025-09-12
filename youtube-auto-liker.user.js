// ==UserScript==
// @name           YouTube Auto-Liker
// @namespace      https://github.com/pumPCin/youtube-auto-liker
// @version        2.0.0
// @description    Automatically likes videos of channels you're subscribed to
// @description:ru Автоматически нравится видео каналов, на которые вы подписаны
// @author         pumPCin
// @license        MIT
// @icon           https://raw.githubusercontent.com/pumPCin/youtube-auto-liker/master/logo.svg
// @downloadurl    https://github.com/pumPCin/youtube-auto-liker/raw/master/youtube-auto-liker.user.js
// @updateurl      https://github.com/pumPCin/youtube-auto-liker/raw/master/youtube-auto-liker.user.js
// @match          *://*.youtube.com/*
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_registerMenuCommand
// @run-at         document-idle
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  const WATCH_THRESHOLD = 60;
  const LIKE_IF_NOT_SUBSCRIBED = false;
  const AUTO_LIKE_LIVE_STREAMS = true;

  const SELECTORS = {
    PLAYER: '#movie_player',
    SUBSCRIBE_BUTTON: '#subscribe-button',
    LIKE_BUTTON: '#menu #top-level-buttons-computed ytd-toggle-button-renderer:nth-child(1) button, #segmented-like-button button',
    DISLIKE_BUTTON: '#menu #top-level-buttons-computed ytd-toggle-button-renderer:nth-child(2) button, #segmented-dislike-button button'
  };

  const autoLikedVideoIds = [];

  function getVideoId() {
    const elem = document.querySelector('#page-manager > ytd-watch-flexy');
    if (elem && elem.hasAttribute('video-id')) {
      return elem.getAttribute('video-id');
    } else {
      return new URLSearchParams(window.location.search).get('v');
    }
  }

  function watchThresholdReached() {
    const player = document.querySelector(SELECTORS.PLAYER);
    if (player && player.getDuration && player.getCurrentTime) {
      const watched = player.getCurrentTime() / player.getDuration();
      return watched >= WATCH_THRESHOLD / 100;
    }
    return false;
  }

  function isSubscribed() {
    const subscribeButton = document.querySelector(SELECTORS.SUBSCRIBE_BUTTON);
    if (!subscribeButton) return false;
    return subscribeButton.innerText.includes("Вы подписаны") || subscribeButton.querySelector("paper-button[subscribed]") !== null;
  }

  function isButtonPressed(button) {
    return button?.classList.contains('style-default-active') || button?.getAttribute('aria-pressed') === 'true';
  }

  function like(auto = false) {
    const likeButton = document.querySelector(SELECTORS.LIKE_BUTTON);
    const dislikeButton = document.querySelector(SELECTORS.DISLIKE_BUTTON);
    if (!likeButton || !dislikeButton) return;

    const videoId = getVideoId();

    if (isButtonPressed(likeButton)) {
      autoLikedVideoIds.push(videoId);
    } else if (isButtonPressed(dislikeButton)) {
      return;
    } else if (autoLikedVideoIds.includes(videoId) && auto) {
      return;
    } else {
      likeButton.click();
      if (isButtonPressed(likeButton)) {
        autoLikedVideoIds.push(videoId);
      }
    }
  }

  function wait() {
    if (watchThresholdReached()) {
      try {
        if (LIKE_IF_NOT_SUBSCRIBED || isSubscribed()) {
          if (AUTO_LIKE_LIVE_STREAMS ||
            window.getComputedStyle(document.querySelector('.ytp-live-badge') || {}).display === 'none') {
            like(true);
          }
        }
      } catch (e) {
        console.warn("Auto-like error:", e);
      }
    }
  }

  setInterval(wait, 30000);
})();
