import bluebird from 'bluebird';
import pageParser from './pageParser';
import messageBus from './messageBus';

const compareRating = (a, b) => a.rating - b.rating;
const compareWant = (a, b) => a.want - b.want;
const compareHave = (a, b) => a.have - b.have;
const compareScore = (a, b) => a.score - b.score;

class ExtensionClient {
  constructor() {
    this.initElements();
    this.initEvents();

    this.state = 'ready';
  }

  initElements() {
    this.$els = {
      nextLink: $('.pagination_next'),
      table: $('.table_block tbody'),
      ui: $('#page_aside, .tab_menu, .pagination, .actions_with_tabs, .table_block th'),
    };
  }

  initEvents() {
    messageBus.onMessage((message, reply) => {
      if (message === 'init') {
        this.onInit(reply);
      } if (message === 'sort:rating') {
        this.sortAllPages(compareRating);
      } else if (message === 'sort:want') {
        this.sortAllPages(compareWant);
      } else if (message === 'sort:have') {
        this.sortAllPages(compareHave);
      } else if (message === 'sort:score') {
        this.sortAllPages(compareScore);
      }
    });
  }

  onInit(reply) {
    if (!this.isAvailable()) {
      reply({err: true});
    } else {
      console.log({
        err: null,
        state: this.state,
        totalItemsCount: pageParser.getTotalItemsCount(),
        itemsPerPageCount: pageParser.getItemsPerPageCount(),
      })
      reply({
        err: null,
        state: this.state,
        totalItemsCount: pageParser.getTotalItemsCount(),
        itemsPerPageCount: pageParser.getItemsPerPageCount(),
      });
    }
  }

  isAvailable() { // TODO
    return pageParser.getTotalItemsCount() > 0;
  }

  sortAllPages(sortMethod) {
    this.hideUi();
    this.state = 'sorting';
    pageParser.getAllPagesItems()
      .then(items => this.sortItems(items, sortMethod))
      .then(items => {
        this.state = 'ready';
        messageBus.sendMessage('sort:success', { count: items.length });
      })
      .catch(err => {
        this.showUi();
        this.state = 'ready';
        messageBus.sendMessage('sort:error', { err })
      });
  }

  sortItems(items, sortMethod) {
    this.clearPage();

    items.sort(sortMethod)
      .reverse()
      .forEach(item => this.addItem(item.el));

    return items;
  }

  clearPage() {
    this.$els.table.find('tr').detach();
  }

  addItem(el) {
    this.$els.table.append(el);
  }

  hideUi() {
    this.$els.ui.css({ opacity: 0 });
  }

  showUi() {
    this.$els.ui.css({ opacity: 1 });
  }

  compareRatings(a, b) {
    return a.rating - b.rating;
  }

  compareHave(a, b) {
    return a.have - b.have;
  }

  compareWant(a, b) {
    return a.have - b.have;
  }

  compareScore(a, b) {
    return a.score - b.score;
  }
}

new ExtensionClient();
