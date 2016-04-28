'use strict';

class ExtensionPopup {
  constructor() {
    this.initElements();
    this.initEvents();

    this.sendMessage('init', this.onInitResponse.bind(this));
  }

  initElements() {
    this.$els = {
      sortActions: $('.sort-action'),
      totalItemsCount: $('.total-items-count'),
      totalPagesCount: $('.total-pages-count'),
      status: $('.status'),
      progress: $('.progress'),
      unavailableText: $('.unavailable'),
    };

    this.disableActionButtons();
    this.hideUnavailableText();
  }

  initEvents() {
    this.$els.sortActions.each((i, el) => {
      const $el = $(el);
      $el.on('click', () => this.sort($el.attr('data-sort')));
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.message === 'sort:getPage') {
        this.onGetPage(request.data.pages);
      } else if (request.message === 'sort:success') {
        this.onSortSuccess(request.data.count);
      } else if (request.message === 'sort:error') {
        this.onSortError(request.data.err);
      }
    });
  }

  sort(sortMethod) {
    this.disableActionButtons();
    this.setStatusText('Retrieving pages...');
    this.sendMessage(sortMethod);
  }

  sendMessage(message, callback) {
    chrome.tabs.query({currentWindow: true, active: true}, tabs => {
      if (callback) {
        chrome.tabs.sendMessage(tabs[0].id, { message }, callback);
      } else {
        chrome.tabs.sendMessage(tabs[0].id, { message });
      }
    });
  }

  onInitResponse(res) {
    if (res && res.err === null) {
      this.totalItemsCount = res.totalItemsCount;
      this.itemsPerPageCount = res.itemsPerPageCount;
      this.totalPagesCount = Math.ceil(this.totalItemsCount / this.itemsPerPageCount)

      this.$els.totalItemsCount.text(` (${this.totalItemsCount} items, ${this.totalPagesCount} pages)`);
      this.$els.totalPagesCount.text(this.totalPagesCount);

      this.setStatusText('Ready.');

      if (res.state === 'ready') {
        this.enableActionButtons();
      } else {
        this.disableActionButtons();
        this.setStatusText('Retrieving pages...');
      }
    } else {
      this.showUnavailableText();
    }
  }

  onSortSuccess(count) {
    this.enableActionButtons()
    this.setStatusText(`Sorted ${count} items.`);
  }

  onSortError(err) {
    this.enableActionButtons()
    this.$els.status.text('Error fetching pages.');
  }

  onGetPage(pagesCount) {
    this.setPageDownloadProgress(pagesCount, this.totalPagesCount);
  }

  setStatusText(text) {
    this.$els.status.text(text);
  }

  setPageDownloadProgress(pagesCount, totalPagesCount) {
    this.$els.status.text(`Downloaded page ${pagesCount}/${totalPagesCount}.`);
    this.$els.progress.css({ width: `${Math.floor(pagesCount / totalPagesCount * 100)}%` });
  }

  disableActionButtons() {
    this.$els.sortActions.attr('disabled', 'disabled');
  }

  enableActionButtons() {
    this.$els.sortActions.attr('disabled', false);
  }

  showUnavailableText() {
    this.$els.unavailableText.show();
  }

  hideUnavailableText() {
    this.$els.unavailableText.hide();
  }
}

$(() => new ExtensionPopup());
