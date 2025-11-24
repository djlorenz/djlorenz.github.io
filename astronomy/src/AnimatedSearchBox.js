(function (factory, window) {

    // define an AMD module that relies on 'leaflet'
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);

        // define a Common JS module that relies on 'leaflet'
    } else if (typeof exports === 'object') {
        module.exports = factory(require('leaflet'));
    }

    // attach your plugin to the global 'L' variable
    if (typeof window !== 'undefined' && window.L) {
        window.L.YourPlugin = factory(L);
    }
}(function (L) {
    L.Control.Searchbox = L.Control.extend({
        options: {
            class: '',
            id: '',
            position: 'topright',
            expand: 'left',
            collapsed: true,
            width: null,
            iconPath: 'https://djlorenz.github.io/astronomy/src/img/search_icon.png',
            autocompleteFeatures: ['setValueOnClick']
        },

        onAdd: function (map) {
            this._create();

            this._collapsed = this.options.collapsed;
            if (this.options.collapsed) {
                this.hide();
            }

            L.DomEvent.disableClickPropagation(this._container);

            L.DomEvent.on(this._button, 'click', this._onClick, this);

            // Autocomplete behaviour
            if (this.options.autocompleteFeatures.includes('setValueOnClick')) {
                this.onAutocomplete('click', function (e) {
                    this._onListItemClick(e.target);
                });
            }

            return this._container;
        },

        onRemove: function (map) {

        },


        getValue: function () {
            return this._input.value
        },

        setValue: function (value) {
            this._input.value = value;
            return this
        },

        addItem: function (item) {
            var listItem = L.DomUtil.create('li', 'leaflet-searchbox-autocomplete-item', this._autocomplete);
            listItem.textContent = item;
            this._items.push(listItem);

            L.DomUtil.addClass(this._searchboxWrapper, 'open');

            return this
        },

        addItems: function (items) {
            for (var i = 0; i < items.length; i++) {
                this.addItem(items[i]);
            }

            return this
        },

        setItems: function (items) {
            this.clearItems();
            this.addItems(items);

            return this
        },

        clearItems: function () {
            this._autocomplete.innerHTML = '';
            this._items = [];

            L.DomUtil.removeClass(this._searchboxWrapper, 'open');

            return this
        },

        hide: function () {
            L.DomUtil.addClass(this._container, "collapsed");
            this._input.blur();
            this._button.blur();
            setTimeout(() => {
                this._collapsed = true;
            }, 600);

            return this;
        },

        show: function () {
            L.DomUtil.removeClass(this._container, "collapsed");
            setTimeout(() => {
                this._collapsed = false;
            }, 600);

            return this;
        },

        toggle: function () {
            if (L.DomUtil.hasClass(this._container, "collapsed")) {
                this.show();
            } else {
                this.hide();
            }

            return this;
        },

        isCollapsed: function () {
            return L.DomUtil.hasClass(this._container, "collapsed")
        },

        clearInput: function () {
            this._input.value = '';

            return this
        },

        clear: function () {
            this.clearInput();
            this.clearItems();

            return this;
        },

        onInput: function (event, handler) {
            L.DomEvent.on(this._input, event, handler, this);

            return this
        },

        offInput: function (event, handler) {
            L.DomEvent.off(this._input, event, handler, this);

            return this
        },

        onButton: function (event, handler) {
            var wrapper = this._buttonHandlerWrapper(handler);
            L.DomEvent.on(this._button, event, wrapper, this);

            return this
        },

        offButton: function (event, handler) {
            var wrapper = this._buttonHandlerWrapper(handler);
            L.DomEvent.off(this._button, event, wrapper, this);

            return this
        },

        onAutocomplete: function (event, handler) {
            L.DomEvent.on(this._autocomplete, event, handler, this);

            return this
        },

        offAutocomplete: function (event, handler) {
            L.DomEvent.off(this._autocomplete, event, handler, this);

            return this
        },

        _onClick: function () {
            if (this._collapsed) {
                this.show();
                this._input.focus();
            }
        },

        _onListItemClick: function (item) {
            this.setValue(item.innerHTML);
            this._input.focus();
        },

        _buttonHandlerWrapper: function (handler) {
            return function () {
                if (!this._collapsed) {
                    handler();
                }
            }
        },

        _create: function () {
            this._container = L.DomUtil.create('div', 'leaflet-control leaflet-searchbox-container');
            if (this.options.class != '') {
                L.DomUtil.addClass(this._container, this.options.class);
            }
            if (this.options.id != '') {
                this._container.id = this.options.id;
            }

            this._searchboxWrapper = L.DomUtil.create('div', 'leaflet-searchbox-wrapper', this._container);

            if (this.options.expand == 'left') {
                this._createInput('left');
                this._createButton('right');
            } else if (this.options.expand == 'right') {
                this._createButton('left');
                this._createInput('right');
            }
            this._createAutocomplete();
        },

        _createInput: function (position) {
            this._input = L.DomUtil.create(
                'input',
                'leaflet-searchbox leaflet-searchbox-' + position,
                this._searchboxWrapper);
            this._input.setAttribute('type', 'text');
            if (this.options.width != null) {
                this._input.style.width = this.options.width;
            }
        },

        _createButton: function (position) {
            this._button = L.DomUtil.create(
                'button',
                'leaflet-searchbox-button leaflet-searchbox-button-' + position,
                this._searchboxWrapper);
            this._button.setAttribute('type', 'button');
            this._button.style.width = this.options.height;
            this._button.style.height = this.options.height;
            this._icon = L.DomUtil.create('img', 'leaflet-searchbox-icon', this._button);
            this._icon.setAttribute('src', this.options.iconPath);
        },

        _createAutocomplete: function () {
            this._autocomplete = L.DomUtil.create(
                'ul',
                'leaflet-searchbox-autocomplete', 
                this._container);

            this._items = [];

        }
    });

    return L.Control.Searchbox;
}, window));

L.control.searchbox = function (options) {
    return new L.Control.Searchbox(options);
}
