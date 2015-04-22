;(function() {
  var d3 = require('d3');
  var _ = require('lodash');

  var AmpersandState = require('ampersand-state');
  var AmpersandView = require('ampersand-view');
  var AmpersandSubCollection = require('ampersand-subcollection');

  var SearchSelectState = AmpersandState.extend({
    props: {
      selected: 'object'
    },
    session: {
      query: [ 'string', false, ''],
      data: 'object',
      idAttribute: 'string',
      imageAttribute: 'string',
      queryAttribute: 'string',
      showAllDefault: [ 'boolean', false, false ],

      // Private Variables
      _data: 'object',
      _selected: [ 'array', false, function() { return []; } ],
      _querySet: [ 'array', false, function() { return []; } ]
    },
    initialize: function() {
      this._data = new AmpersandSubCollection(this.data);
      this.selected = new AmpersandSubCollection(this.data);

      this.on('change:_selected', function(selectState, selected) {
        selectState.selected.configure({
          filter: function(model) {
            return selected.indexOf(model[selectState.idAttribute]) > -1;
          }
        }, true);
      });

      this.on('change:query', this.runQuery);
    },
    selectItem: function(event) {
      d3.select(event.target.parentNode).each(function(d) {
        this._selected.push(d[this.idAttribute]);
        this.trigger('change:_selected', this, this._selected);
      }.bind(this));
    },
    deselectItem: function(event) {
      d3.select(event.target.parentNode).each(function(d) {
        _.remove(this._selected, function(id) { return id === d[this.idAttribute]; }.bind(this));
        this.trigger('change:_selected', this, this._selected);
      }.bind(this));
    },
    runQuery: function(selectState, query) {
      var transformedQuery = query.toLowerCase();
      selectState._data.configure({
        filter: function(model) {
          var name = model.name.toLowerCase();
          return transformedQuery.length > 0 ? _.startsWith(name, transformedQuery) || _.startsWith(transformedQuery, name) : selectState.showAllDefault;
        }
      }, true);

      selectState._querySet = selectState._data.models;
    }
  });

  var SearchSelectView = AmpersandView.extend({
    template: '<div></div>',
    autoRender: true,
    initialize: function() {
      this.model._view = this;
    },
    events: {
      'keyup .ampersand-search-select-bar': 'search',
      'click svg.ampersand-search-select-list-item-add': 'selectItem',
      'click svg.ampersand-search-select-list-item-check': 'deselectItem'
    },
    bindings: {
      'model._querySet': {
        type: function(el, querySet) {
          this.renderQuerySet(querySet);
        }
      },
      'model._selected': {
        type: function(el, selected) {
          this.renderQuerySet(this.model._querySet);
        }
      }
    },
    render: function() {
      AmpersandView.prototype.render.call(this);

      var searchSelectContainer = this.div = d3.select(this.el)
        .attr('class', 'ampersand-search-select')
        .style('position', 'relative');

      searchSelectContainer.append('input')
        .attr('class', 'ampersand-search-select-bar')
        .attr('type', 'text');

      var searchGlass = searchSelectContainer.append('svg')
        .attr('class', 'ampersand-search-select-glass')
        .attr('width', 20)
        .attr('height', 20)
        .style('position', 'absolute');

      searchGlass.append('circle')
        .attr('class', 'ampersand-search-select-glass-circle')
        .attr('cx', 10)
        .attr('cy', 7.5)
        .attr('r', 5);

      searchGlass.append('line')
        .attr('class', 'ampersand-search-select-glass-line')
        .attr('x1', 0)
        .attr('y1', 17)
        .attr('x2', 7.5)
        .attr('y2', 10);

      this.ul = searchSelectContainer.append('ul')
        .attr('class', 'ampersand-searchs-select-list');
    },
    renderQuerySet: function(querySet) {
      if (!this.div || !this.ul) {
        return;
      }

      var idAttribute = this.model.idAttribute;
      var queryAttribute = this.model.queryAttribute;
      var imageAttribute = this.model.imageAttribute;
      var selected = this.model._selected;

      var listItems = this.ul.selectAll('li.ampersand-search-select-list-item')
        .data(querySet);

      listItems.exit()
        .remove();

      var listItem = listItems.enter().append('li')
        .attr('class', 'ampersand-search-select-list-item');

      listItem.append('img')
        .attr('class', 'ampersand-search-select-list-item-image');

      listItem.append('span')
        .attr('class', 'ampersand-search-select-list-item-text');

      var listItemAdd = listItem.append('svg')
        .attr('class', 'ampersand-search-select-list-item-add')
        .attr('height', 24)
        .attr('width', 24);

      listItemAdd.append('circle')
        .attr('class', 'ampersand-search-select-list-item-add-circle')
        .attr('r', 12)
        .attr('cx', 12)
        .attr('cy', 12);

      listItemAdd.append('line')
        .attr('class', 'ampersand-search-select-list-item-add-line')
        .attr('x1', 8)
        .attr('y1', 12)
        .attr('x2', 16)
        .attr('y2', 12);

      listItemAdd.append('line')
        .attr('class', 'ampersand-search-select-list-item-add-line')
        .attr('x1', 12)
        .attr('y1', 8)
        .attr('x2', 12)
        .attr('y2', 16);

      var listItemCheck = listItem.append('svg')
        .attr('class', 'ampersand-search-select-list-item-check')
        .attr('height', 24)
        .attr('width', 24);

      listItemCheck.append('circle')
        .attr('class', 'ampersand-search-select-list-item-check-circle')
        .attr('r', 12)
        .attr('cx', 12)
        .attr('cy', 12);

      listItemCheck.append('line')
        .attr('class', 'ampersand-search-select-list-item-check-line')
        .attr('x1', 8)
        .attr('y1', 12)
        .attr('x2', 12)
        .attr('y2', 16);

      listItemCheck.append('line')
        .attr('class', 'ampersand-search-select-list-item-check-line')
        .attr('x1', 12)
        .attr('y1', 16)
        .attr('x2', 16)
        .attr('y2', 8);

      listItems.select('img.ampersand-search-select-list-item-image')
        .attr('src', function(d) { return d[imageAttribute]; });

      listItems.select('span.ampersand-search-select-list-item-text')
        .text(function(d) { return d[queryAttribute]; });

      listItems.select('svg.ampersand-search-select-list-item-add')
        .style('display', function(d) { return selected.indexOf(d[idAttribute]) === -1 ? 'initial' : 'none'; });

      listItems.select('svg.ampersand-search-select-list-item-check')
        .style('display', function(d) { return selected.indexOf(d[idAttribute]) > -1 ? 'initial' : 'none'; });
    },
    search: function(event) {
      this.model.query = event.target.value.trim();
    },
    selectItem: function(event) {
      this.model.selectItem(event);
    },
    deselectItem: function(event) {
      this.model.deselectItem(event);
    }
  });

  module.exports = {
    State: SearchSelectState,
    View: SearchSelectView
  };
})();
