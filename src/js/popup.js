'use strict';

class ExtensionPopup {
  constructor() {
    this.initElements();
    this.initEvents();

    this.sendMessage('init', this.onInitResponse.bind(this));
  }

  initElements() {
    this.$els = {
      actionsContainer: $('.actions-container'),
      sortActions: $('.sort-action'),
      totalItemsCount: $('.total-items-count'),
      totalPagesCount: $('.total-pages-count'),
      status: $('.status'),
    };

    this.hideButtons();
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
    this.$els.actionsContainer.hide();
    this.sendMessage(sortMethod);
  }

  sendMessage(message, callback) {
    console.log('Sending message', message);

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
      this.showButtons();
    } else {
      this.$els.status.text('The current page cannot be sorted.');
    }
  }

  onSortSuccess(count) {
    this.showButtons()
    this.$els.status.text(`Sorted ${count} items.`);
  }

  onSortError(err) {
    this.showButtons()
    this.$els.status.text('Error fetching pages.');
  }

  onGetPage(pagesCount) {
    this.$els.status.text(`Downloading page ${pagesCount}/${this.totalPagesCount}`);
  }

  showButtons() {
    this.$els.actionsContainer.show();
  }

  hideButtons() {
    this.$els.actionsContainer.hide();
  }
}

$(() => new ExtensionPopup());
