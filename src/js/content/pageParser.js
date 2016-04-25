import bluebird from 'bluebird';
import messageBus from './messageBus';

export default new class Pages {
  constructor() {

  }

  getAllPagesItems() {
    if (this.allPagesItems) {
      console.log('All pages items are already stored.')
      return bluebird.resolve(this.allPagesItems);
    }

    this.pagesCount = 0;

    return bluebird.props({
      prevPagesItems: this.loadPrevPages(this.getPrevPageLink()),
      nextPagesItems: this.loadNextPages(this.getNextPageLink()),
    }).then(({ prevPagesItems, nextPagesItems }) => this.calculateScore([
      ...prevPagesItems,
      ...nextPagesItems,
      ...this.getCurrentPageItems()
    ])).then(items => {
      this.allPagesItems = items;
      return items;
    });
  }

  loadNextPages(link, data = []) {
    if (!link) {
      return bluebird.resolve(data);
    }

    return this.loadPage(link)
      .then(page => {
        data.push(...this.getItemsData(page));
        return this.loadNextPages(this.getNextPageLink(page), data);
      });
  }

  loadPrevPages(link, data = []) {
    if (!link) {
      console.log('Done loading pages');
      return bluebird.resolve(data);
    }

    return this.loadPage(link)
      .then(page => {
        data.push(...this.getItemsData(page));
        return this.loadPrevPages(this.getPrevPageLink(page), data);
      });
  }

  loadPage(link) {
    return bluebird.resolve($.get(link));
  }

  getNextPageLink(page) {
    if (page) {
      return $(page).find('.pagination_next').attr('href');
    } else {
      return $('.pagination_next').attr('href');
    }
  }

  getPrevPageLink(page) {
    if (page) {
      return $(page).find('.pagination_previous').attr('href');
    } else {
      return $('.pagination_previous').attr('href');
    }
  }

  getCurrentPageIndex() {
    return parseInt($('.pagination_page_links li.hide_mobile span strong').text());
  }

  getCurrentPageItems() {
    return this.getItemsData($('body'));
  }

  getItemsData(page) {
    this.pagesCount++;
    messageBus.sendMessage('sort:getPage', { pages: this.pagesCount });

    return $(page).find('.table_block tbody tr').toArray()
      .map(el => ({
        el,
        rating: this.getRating(el),
        have: this.getHave(el),
        want: this.getWant(el),
      }));
  }

  getTotalItemsCount() {
    const regexp = /.*\sof\s(\d*)/gi;
    const paginationText = $('.pagination_total').text();
    const res = regexp.exec(paginationText)
    return res && res[1] && res[1].length ? res[1] : 0;
  }

  getItemsPerPageCount() {
    return parseInt($('#limit_top option[selected]').val() || 0);
  }

  getRating(itemNode) {
    return parseFloat($(itemNode).find('.community_rating strong').text() || 0);
  }

  getHave(itemNode) {
    return parseInt($(itemNode).find('.have_indicator').next().text() || 0);
  }

  getWant(itemNode) {
    return parseInt($(itemNode).find('.want_indicator').next().text() || 0);
  }

  calculateScore(items) {
    const maxHaveWantCount = Math.max.apply(Math, items.map(item => item.have + item.want));

    items.forEach(item => {
      const ratingScore = item.rating / 5
      const haveWantCountScore = (item.have + item.want) / maxHaveWantCount;
      const haveWantRatioScore = item.want > item.have ? 1 : item.want / item.have;

      item.score = ratingScore * 3 + haveWantCountScore * 2 + haveWantRatioScore;
    });

    return items;
  }
}
