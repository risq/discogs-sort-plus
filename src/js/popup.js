'use strict';

import messages from './messages';

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
      error: $('.error'),
      errorText: $('.error-text'),
    };

    this.disableActionButtons();
    this.hideError();
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
        this.onSortSuccess(request.data.count, request.data.sortMethod);
      } else if (request.message === 'sort:error') {
        this.onSortError(request.data.err);
      }
    });
  }

  sort(sortMethod) {
    this.disableActionButtons();
    this.setStatusText('Retrieving pages...');
    this.sendMessage(`sort:${sortMethod}`);
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
    if (!res || res.err) {
      this.showError(messages.unavailable);
      return;
    }

    this.totalItemsCount = res.totalItemsCount;

    if (this.totalItemsCount > 5000) {
      this.showError(messages.tooMuchItems);
      return;
    }

    this.itemsPerPageCount = res.itemsPerPageCount;
    this.totalPagesCount = Math.ceil(this.totalItemsCount / this.itemsPerPageCount)

    this.$els.totalItemsCount.text(` (${this.totalItemsCount} items, ${this.totalPagesCount} pages)`);
    this.$els.totalPagesCount.text(this.totalPagesCount);

    this.setStatusText('Ready.');

    if (res.status === 'ready') {
      this.enableActionButtons();
      this.setActiveButton(res.currentSort);
    } else if (res.status === 'sorting') {
      this.disableActionButtons();
      this.setStatusText('Retrieving pages...');
    } else {
      this.showError(messages.unavailable);
    }
  }

  onSortSuccess(count, sortMethod) {
    this.enableActionButtons();
    this.setActiveButton(sortMethod);

    this.setStatusText(`Sorted ${count} items by ${sortMethod}.${count > 1000 ? " Only the first 1000 results are shown." : ""}`);
  }

  onSortError(err) {
    this.enableActionButtons();
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

  setActiveButton(sortMethod) {
    if (sortMethod) {
      this.$els.sortActions
        .removeClass('active')
        .filter(`[data-sort="${sortMethod}"]`)
        .addClass('active');
    } else {
      this.$els.sortActions
        .removeClass('active')
    }
  }

  disableActionButtons() {
    this.$els.sortActions.attr('disabled', 'disabled');
  }

  enableActionButtons() {
    this.$els.sortActions.attr('disabled', false);
  }

  showError(text) {
    this.$els.errorText.text(text);
    this.$els.error.show();
  }

  hideError() {
    this.$els.error.hide();
  }
}

$(() => new ExtensionPopup());
