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
            return !!~selected.indexOf(model[selectState.idAttribute]);
          }
        }, true);
      });

      this.on('change:query', function(selectState, query) {
        var transformedQuery = query.toLowerCase();
        selectState._data.configure({
          filter: function(model) {
            var name = model.name.toLowerCase();
            return transformedQuery.length > 0 ? _.startsWith(name, transformedQuery) || _.startsWith(transformedQuery, name) : false;
          }
        }, true);

        selectState._querySet = selectState._data.models;
      });
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
    }
  });

  var SearchSelectView = AmpersandView.extend({
    template: '<svg></svg>',
    autoRender: true,
    initialize: function() {
      this.model._view = this;
    },
    events: {
      'keyup .ampersand-search-select-bar': 'search',
      'click svg.ampersand-search-select-query-add': 'selectItem',
      'click svg.ampersand-search-select-query-check': 'deselectItem'
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

      var searchSelect = this.svg = d3.select(this.el)
        .attr('class', 'ampersand-search-select')
        .attr('width', '100%')
        .attr('height', '9.5em');

      var searchForeignObject = searchSelect.append('foreignObject')
        .attr('class', 'ampersand-search-select-foreign-object')
        .attr('width', '100%');

      var searchBody = searchForeignObject.append('xhtml:body')
        .attr('class', 'ampersand-search-select-body')
        .style('position', 'relative');

      searchBody.append('input')
        .attr('class', 'ampersand-search-select-bar')
        .attr('type', 'text');

      var searchGlass = searchBody.append('svg')
        .attr('class', 'ampersand-search-select-glass')
        .attr('width', 20)
        .attr('height', 20)
        .style('position', 'relative');

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
    },
    renderQuerySet: function(querySet) {
      if (this.svg) {
        var idAttribute = this.model.idAttribute;
        var queryAttribute = this.model.queryAttribute;
        var imageAttribute = this.model.imageAttribute;
        var selected = this.model._selected;

        var queryContainers = this.svg.selectAll('svg.ampersand-search-select-query-container')
          .data(querySet);

        queryContainers.exit()
          .remove();

        var queryContainer = queryContainers.enter().append('svg')
          .attr('class', 'ampersand-search-select-query-container')
          .attr('y', function(d) { return (2.5 + querySet.indexOf(d) * 2.5) + 'em'; })
          .style('overflow', 'visible');

        queryContainer.append('defs').append('clipPath')
          .attr('id', function(d) { return 'ampersand-search-select-clip-path-' + querySet.indexOf(d); })
        .append('circle')
          .attr('r', 16)
          .attr('cx', 16)
          .attr('cy', 16);

        queryContainer.append('image')
          .attr('class', 'ampersand-search-select-query-image')
          .attr('clip-path', function(d) { return 'url(#ampersand-search-select-clip-path-' + querySet.indexOf(d) + ')'; })
          .attr('height', 32)
          .attr('width', 32);

        queryContainer.append('text')
          .attr('class', 'ampersand-search-select-query-text')
          .attr('x', 48)
          .attr('y', 20);

        var queryAdd = queryContainer.append('svg')
          .attr('class', 'ampersand-search-select-query-add')
          .attr('x', '100%')
          .attr('y', '0.5em')
          .style('overflow', 'visible');

        queryAdd.append('circle')
          .attr('class', 'ampersand-search-select-query-add-circle')
          .attr('r', 12)
          .attr('cx', -16)
          .attr('cy', 8);

        queryAdd.append('line')
          .attr('class', 'ampersand-search-select-query-add-line')
          .attr('x1', -20)
          .attr('y1', 8)
          .attr('x2', -12)
          .attr('y2', 8);

        queryAdd.append('line')
          .attr('class', 'ampersand-search-select-query-add-line')
          .attr('x1', -16)
          .attr('y1', 4)
          .attr('x2', -16)
          .attr('y2', 12);

        var queryCheck = queryContainer.append('svg')
          .attr('class', 'ampersand-search-select-query-check')
          .attr('x', '100%')
          .attr('y', '0.5em')
          .style('overflow', 'visible');

        queryCheck.append('circle')
          .attr('class', 'ampersand-search-select-query-check-circle')
          .attr('r', 12)
          .attr('cx', -16)
          .attr('cy', 8);

        queryCheck.append('line')
          .attr('class', 'ampersand-search-select-query-check-line')
          .attr('x1', -20)
          .attr('y1', 8)
          .attr('x2', -16)
          .attr('y2', 12);

        queryCheck.append('line')
          .attr('class', 'ampersand-search-select-query-check-line')
          .attr('x1', -16)
          .attr('y1', 12)
          .attr('x2', -12)
          .attr('y2', 4);

        queryContainers.select('image.ampersand-search-select-query-image')
          .attr('xlink:href', function(d) { return d[imageAttribute]; });

        queryContainers.select('text.ampersand-search-select-query-text')
          .text(function(d) { return d[queryAttribute]; });

        queryContainers.select('svg.ampersand-search-select-query-add')
          .style('display', function(d) { return selected.indexOf(d[idAttribute]) === -1 ? 'initial' : 'none'; });

        queryContainers.select('svg.ampersand-search-select-query-check')
          .style('display', function(d) { return selected.indexOf(d[idAttribute]) > -1 ? 'initial' : 'none'; });
      }
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
