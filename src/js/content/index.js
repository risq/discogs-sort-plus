import bluebird from 'bluebird';
import pageParser from './pageParser';
import messageBus from './messageBus';

const compareScore = (a, b) => a.score - b.score;
const compareRating = (a, b) => a.rating !== b.rating ? a.rating - b.rating : compareScore(a, b);
const compareRarity = (a, b) => a.rarity !== b.rarity ? a.rarity - b.rarity : compareScore(a, b);
const compareHaveWant = (a, b) => a.haveWant !== b.haveWant ? a.haveWant - b.haveWant : compareScore(a, b);
const compareHave = (a, b) => a.have !== b.have ? a.have - b.have : compareScore(a, b);
const compareWant = (a, b) => a.want !== b.want ? a.want - b.want : compareScore(a, b);

class ExtensionClient {
  constructor() {
    this.initElements();
    this.initEvents();

    this.status = 'ready';
    this.currentSort = null;
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
      } else if (message === 'sort:score') {
        this.sortAllPages('score', compareScore);
      } else if (message === 'sort:rating') {
        this.sortAllPages('rating', compareRating);
      } else if (message === 'sort:rarity') {
        this.sortAllPages('rarity', compareRarity);
      } else if (message === 'sort:have-want') {
        this.sortAllPages('have', compareHaveWant);
      } else if (message === 'sort:have') {
        this.sortAllPages('have', compareHave);
      } else if (message === 'sort:want') {
        this.sortAllPages('want', compareWant);
      }
    });
  }

  onInit(reply) {
    if (!this.isAvailable()) {
      reply({err: true});
    } else {
      reply({
        err: null,
        status: this.status,
        currentSort: this.currentSort,
        totalItemsCount: pageParser.getTotalItemsCount(),
        itemsPerPageCount: pageParser.getItemsPerPageCount(),
      });
    }
  }

  isAvailable() {
    return pageParser.getTotalItemsCount() > 0;
  }

  sortAllPages(sortMethod, sortFunction) {
    this.hideUi();
    this.status = 'sorting';
    pageParser.getAllPagesItems()
      .then(items => this.sortItems(items, sortFunction))
      .then(items => {
        this.status = 'ready';
        this.currentSort = sortMethod;
        messageBus.sendMessage('sort:success', { count: items.length, sortMethod: sortMethod });
      })
      .catch(err => {
        this.showUi();
        this.status = 'ready';
        this.currentSort = null;
        messageBus.sendMessage('sort:error', { err })
        console.log(err);
      });
  }

  sortItems(items, sortFunction) {
    this.clearPage();

    items.sort(sortFunction)
      .reverse()
      .slice(0, 1000)
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
}

new ExtensionClient();
