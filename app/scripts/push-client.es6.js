'use strict';

// jscs:disable requireTrailingComma

export default class PushClient {

  constructor(stateChangeCb, subscriptionUpdate) {
    this._stateChangeCb = stateChangeCb;
    this._subscriptionUpdate = subscriptionUpdate;

    this.state = {
      UNSUPPORTED: {
        id: 'UNSUPPORTED',
        interactive: false,
        pushEnabled: false
      },
      INITIALISING: {
        id: 'INITIALISING',
        interactive: false,
        pushEnabled: false
      },
      PERMISSION_DENIED: {
        id: 'PERMISSION_DENIED',
        interactive: false,
        pushEnabled: false
      },
      PERMISSION_GRANTED: {
        id: 'PERMISSION_GRANTED',
        interactive: true
      },
      PERMISSION_PROMPT: {
        id: 'PERMISSION_PROMPT',
        interactive: true,
        pushEnabled: false
      },
      ERROR: {
        id: 'ERROR',
        interactive: false,
        pushEnabled: false
      },
      STARTING_SUBSCRIBE: {
        id: 'STARTING_SUBSCRIBE',
        interactive: false,
        pushEnabled: true
      },
      SUBSCRIBED: {
        id: 'SUBSCRIBED',
        interactive: true,
        pushEnabled: true
      },
      STARTING_UNSUBSCRIBE: {
        id: 'STARTING_UNSUBSCRIBE',
        interactive: false,
        pushEnabled: false
      },
      UNSUBSCRIBED: {
        id: 'UNSUBSCRIBED',
        interactive: true,
        pushEnabled: false
      }
    };

    if (!('serviceWorker' in navigator)) {
      this._stateChangeCb(this.state.UNSUPPORTED);
      return;
    }

    if (!('PushManager' in window)) {
      this._stateChangeCb(this.state.UNSUPPORTED);
      return;
    }

    if (!('permissions' in navigator)) {
      this._stateChangeCb(this.state.UNSUPPORTED);
      return;
    }

    if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
      this._stateChangeCb(this.state.UNSUPPORTED);
      return;
    }

    navigator.serviceWorker.ready.then(() => {
      this._stateChangeCb(this.state.INITIALISING);
      this.setUpPushPermission();
    });
  }

  _permissionStateChange(permissionState) {
    // console.log('PushClient.permissionStateChange(): ', permissionState);
    switch (permissionState.state) {
    case 'denied':
      this._stateChangeCb(this.state.PERMISSION_DENIED);
      break;
    case 'granted':
      this._stateChangeCb(this.state.PERMISSION_GRANTED);
      break;
    case 'prompt':
      this._stateChangeCb(this.state.PERMISSION_PROMPT);
      break;
    default:
      break;
    }
  }

  setUpPushPermission() {
    navigator.permissions.query({name: 'push', userVisibleOnly: true})
      .then((permissionState) => {
        // Set the initial state
        this._permissionStateChange(permissionState);

        // Handle Permission State Changes
        permissionState.onchange = () => {
          this._permissionStateChange(this);
        };

        // Check what the current push state is
        return navigator.serviceWorker.ready;
      })
      .then((serviceWorkerRegistration) => {
        // Let's see if we have a subscription already
        return serviceWorkerRegistration.pushManager.getSubscription();
      })
      .then((subscription) => {
        if (!subscription) {
          // NOOP since we have no subscription and the permission state
          return;
        }

        this._stateChangeCb(this.state.SUBSCRIBED);

        // Update the current state with the
        // subscriptionid and endpoint
        this._subscriptionUpdate(subscription);
      })
      .catch((err) => {
        console.log('PushClient.setUpPushPermission() Error', err);
        this._stateChangeCb(this.state.ERROR, err);
      });
  }

  subscribe() {
    this._stateChangeCb(this.state.STARTING_SUBSCRIBE);

    // We need the service worker registration to access the push manager
    navigator.serviceWorker.ready
      .then((serviceWorkerRegistration) => {
        return serviceWorkerRegistration.pushManager.subscribe(
          {userVisibleOnly: true}
        );
      })
      .then((subscription) => {
        this._stateChangeCb(this.state.SUBSCRIBED);
        this._subscriptionUpdate(subscription);
      })
      .catch((subscriptionErr) => {
        // Check for a permission prompt issue
        return navigator.permissions
          .query({name: 'push', userVisibleOnly: true})
          .then((permissionState) => {
            this._permissionStateChange(permissionState);
          });
      });
  }

  unsubscribe() {
    this._stateChangeCb(this.state.STARTING_UNSUBSCRIBE);

    navigator.serviceWorker.ready
      .then((serviceWorkerRegistration) => {
        return serviceWorkerRegistration.pushManager.getSubscription();
      })
      .then((pushSubscription) => {
        return pushSubscription.unsubscribe()
          .then(function(successful) {
            if (!successful) {
              console.error('Could not unregister');
            }
          })
          .catch(function(e) { });
      })
      .then(() => {
        this._stateChangeCb(this.state.UNSUBSCRIBED);
        this._subscriptionUpdate(null);
      })
      .catch((e) => {
        console.error('Error revoking subscription', e);
      });
  }
}
