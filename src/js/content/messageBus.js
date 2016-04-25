
export default new class MessageBus {
  constructor() {

  }

  onMessage(callback) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('MessageBus onMessage', request);
      callback(request.message, sendResponse)
    });
  }

  sendMessage(message, data) {
    chrome.runtime.sendMessage({ message, data });
  }
}
