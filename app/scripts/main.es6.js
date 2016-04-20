'use strict';

// jscs:disable requireTrailingComma

import PushClient from './push-client.es6.js';

var API_KEY = 'AIzaSyBBh4ddPa96rQQNxqiq_qQj7sq1JdsNQUQ';

function updateUIForPush(pushToggleSwitch) {
  // This div contains the UI for CURL commands to trigger a push
  var sendPushOptions = document.querySelector('.js-send-push-options');

  var toggleUI = function(isEnabled) {
    sendPushOptions.style.opacity = isEnabled ? 1 : 0;
  };

  var stateChangeListener = function(state, data) {
    // console.log(state);
    if (typeof state.interactive !== 'undefined') {
      if (state.interactive) {
        pushToggleSwitch.enable();
      } else {
        pushToggleSwitch.disable();
      }
    }

    if (typeof state.pushEnabled !== 'undefined') {
      if (state.pushEnabled) {
        pushToggleSwitch.on();
      } else {
        pushToggleSwitch.off();
      }
    }

    switch (state.id) {
    case 'ERROR':
      console.error(data);
      console.error('Something went wrong');
      break;
    default:
      break;
    }
  };

  var subscriptionUpdate = (subscription) => {
    console.log('subscriptionUpdate: ', subscription);
    if (!subscription) {
      // Remove any subscription from your servers
      toggleUI(false);
      return;
    }

    // We should figure the GCM curl command
    var curlEndpoint = 'https://android.googleapis.com/gcm/send';
    var endpointSections = subscription.endpoint.split('/');
    var subscriptionId = endpointSections[endpointSections.length - 1];
    var curlCommand = 'curl --header "Authorization: key=' +
      API_KEY + '" --header Content-Type:"application/json" ' +
      curlEndpoint + ' -d "{\\"registration_ids\\":[\\"' +
      subscriptionId + '\\"]}"';

    var curlCodeElement = document.querySelector('.js-curl-code');
    curlCodeElement.innerHTML = curlCommand;

    // Display the UI
    toggleUI(true);
  };

  var pushClient = new PushClient(
    stateChangeListener,
    subscriptionUpdate
  );

  document.querySelector('.js-push-toggle-switch > input')
    .addEventListener('click', function(event) {
      pushClient[(!event.target.checked ? 'unsubscribe' : 'subscribe')]();
    });

  // Check that service workers are supported
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js', {
      scope: './'
    });
  } else {
    console.error('Service workers not supported');
  }
}

// Below this comment is code to initialise a material design lite view.
var toggleSwitch = document.querySelector('.js-push-toggle-switch');

if (toggleSwitch) {
  toggleSwitch.initialised = false;

  // This is to wait for MDL initialising
  document.addEventListener('mdl-componentupgraded', function() {
    if (toggleSwitch.initialised) {
      return;
    }

    toggleSwitch.initialised = toggleSwitch.classList.contains('is-upgraded');
    if (!toggleSwitch.initialised) {
      return;
    }

    var pushToggleSwitch = toggleSwitch.MaterialSwitch;

    updateUIForPush(pushToggleSwitch);
  });
}
