/**
 * small modifications by David Lorenz, otherwise this is from
 * Leaflet Control Geocoder
 * https://github.com/perliedman/leaflet-control-geocoder
 *
 * Copyright (c) 2012 sa3m (https://github.com/sa3m)
 * Copyright (c) 2018 Per Liedman
 * All rights reserved.
 */
var leafletControlGeocoder = (function (exports, L) {
    
    function _interopNamespace(e) {
	if (e && e.__esModule) return e;
	var n = Object.create(null);
	if (e) {
	    Object.keys(e).forEach(function (k) {
		if (k !== 'default') {
		    var d = Object.getOwnPropertyDescriptor(e, k);
		    Object.defineProperty(n, k, d.get ? d : {
			enumerable: true,
			get: function () {
			    return e[k];
			}
		    });
		}
	    });
	}
	n['default'] = e;
	return n;
    }
    
    var L__namespace = /*#__PURE__*/_interopNamespace(L);
    
    function _inheritsLoose(subClass, superClass) {
	subClass.prototype = Object.create(superClass.prototype);
	subClass.prototype.constructor = subClass;
	subClass.__proto__ = superClass;
    }
    
    function _assertThisInitialized(self) {
	if (self === void 0) {
	    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	}
	
	return self;
    }
    
    /**
     * @internal
     */
    
    function geocodingParams(options, params) {
	return L__namespace.Util.extend(params, options.geocodingQueryParams);
    }
    /**
     * @internal
     */
    
    function reverseParams(options, params) {
	return L__namespace.Util.extend(params, options.reverseQueryParams);
    }
    
    /**
     * @internal
     */
    
    var lastCallbackId = 0; // Adapted from handlebars.js
    // https://github.com/wycats/handlebars.js/
    
    /**
     * @internal
     */
    
    var badChars = /[&<>"'`]/g;
    /**
     * @internal
     */
    
    var possible = /[&<>"'`]/;
    /**
     * @internal
     */
    
    var escape = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#x27;',
	'`': '&#x60;'
    };
    /**
     * @internal
     */
    
    function escapeChar(chr) {
	return escape[chr];
    }
    /**
     * @internal
     */
    
    
    function htmlEscape(string) {
	if (string == null) {
	    return '';
	} else if (!string) {
	    return string + '';
	} // Force a string conversion as this will be done by the append regardless and
	// the regex test will do this transparently behind the scenes, causing issues if
	// an object's to string has escaped characters in it.
	
	
	string = '' + string;
	
	if (!possible.test(string)) {
	    return string;
	}
	
	return string.replace(badChars, escapeChar);
    }
    /**
     * @internal
     */
    
    function jsonp(url, params, callback, context, jsonpParam) {
	var callbackId = '_l_geocoder_' + lastCallbackId++;
	params[jsonpParam || 'callback'] = callbackId;
	window[callbackId] = L__namespace.Util.bind(callback, context);
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = url + getParamString(params);
	script.id = callbackId;
	document.getElementsByTagName('head')[0].appendChild(script);
    }
    /**
     * @internal
     */
    
    function getJSON(url, params, callback) {
	var xmlHttp = new XMLHttpRequest();
	
	xmlHttp.onreadystatechange = function () {
	    if (xmlHttp.readyState !== 4) {
		return;
	    }
	    
	    var message;
	    
	    if (xmlHttp.status !== 200 && xmlHttp.status !== 304) {
		message = '';
	    } else if (typeof xmlHttp.response === 'string') {
		// IE doesn't parse JSON responses even with responseType: 'json'.
		try {
		    message = JSON.parse(xmlHttp.response);
		} catch (e) {
		    // Not a JSON response
		    message = xmlHttp.response;
		}
	    } else {
		message = xmlHttp.response;
	    }
	    
	    callback(message);
	};
	
	xmlHttp.open('GET', url + getParamString(params), true);
	xmlHttp.responseType = 'json';
	xmlHttp.setRequestHeader('Accept', 'application/json');
	xmlHttp.send(null);
    }
    /**
     * @internal
     */
    
    function template(str, data) {
	return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
	    var value = data[key];
	    
	    if (value === undefined) {
		value = '';
	    } else if (typeof value === 'function') {
		value = value(data);
	    }
	    
	    return htmlEscape(value);
	});
    }
    /**
     * @internal
     */
    
    function getParamString(obj, existingUrl, uppercase) {
	var params = [];
	
	for (var i in obj) {
	    var key = encodeURIComponent(uppercase ? i.toUpperCase() : i);
	    var value = obj[i];
	    
	    if (!Array.isArray(value)) {
		params.push(key + '=' + encodeURIComponent(String(value)));
	    } else {
		for (var j = 0; j < value.length; j++) {
		    params.push(key + '=' + encodeURIComponent(value[j]));
		}
	    }
	}
	
	return (!existingUrl || existingUrl.indexOf('?') === -1 ? '?' : '&') + params.join('&');
    }
    
    /**
     * Parses basic latitude/longitude strings such as `'50.06773 14.37742'`, `'N50.06773 W14.37742'`, `'S 50° 04.064 E 014° 22.645'`, or `'S 50° 4′ 03.828″, W 14° 22′ 38.712″'`
     * @param query the latitude/longitude string to parse
     * @returns the parsed latitude/longitude
     */
    
    function parseLatLng(query) {
	var match; // regex from https://github.com/openstreetmap/openstreetmap-website/blob/master/app/controllers/geocoder_controller.rb
	
	var queryNP = query.replace(/[()]/g, '')
	
	if (match = queryNP.match(/^([NS])\s*(\d{1,3}(?:\.\d*)?)\W*([EW])\s*(\d{1,3}(?:\.\d*)?)$/)) {
	    // [NSEW] decimal degrees
	    return L__namespace.latLng((/N/i.test(match[1]) ? 1 : -1) * +match[2], (/E/i.test(match[3]) ? 1 : -1) * +match[4]);
	} else if (match = queryNP.match(/^(\d{1,3}(?:\.\d*)?)\s*([NS])\W*(\d{1,3}(?:\.\d*)?)\s*([EW])$/)) {
	    // decimal degrees [NSEW]
	    return L__namespace.latLng((/N/i.test(match[2]) ? 1 : -1) * +match[1], (/E/i.test(match[4]) ? 1 : -1) * +match[3]);
	} else if (match = queryNP.match(/^([NS])\s*(\d{1,3})°?\s*(\d{1,3}(?:\.\d*)?)?['′]?\W*([EW])\s*(\d{1,3})°?\s*(\d{1,3}(?:\.\d*)?)?['′]?$/)) {
	    // [NSEW] degrees, decimal minutes
	    return L__namespace.latLng((/N/i.test(match[1]) ? 1 : -1) * (+match[2] + +match[3] / 60), (/E/i.test(match[4]) ? 1 : -1) * (+match[5] + +match[6] / 60));
	} else if (match = queryNP.match(/^(\d{1,3})°?\s*(\d{1,3}(?:\.\d*)?)?['′]?\s*([NS])\W*(\d{1,3})°?\s*(\d{1,3}(?:\.\d*)?)?['′]?\s*([EW])$/)) {
	    // degrees, decimal minutes [NSEW]
	    return L__namespace.latLng((/N/i.test(match[3]) ? 1 : -1) * (+match[1] + +match[2] / 60), (/E/i.test(match[6]) ? 1 : -1) * (+match[4] + +match[5] / 60));
	} else if (match = queryNP.match(/^([NS])\s*(\d{1,3})°?\s*(\d{1,2})['′]?\s*(\d{1,3}(?:\.\d*)?)?["″]?\W*([EW])\s*(\d{1,3})°?\s*(\d{1,2})['′]?\s*(\d{1,3}(?:\.\d*)?)?["″]?$/)) {
	    // [NSEW] degrees, minutes, decimal seconds
	    return L__namespace.latLng((/N/i.test(match[1]) ? 1 : -1) * (+match[2] + +match[3] / 60 + +match[4] / 3600), (/E/i.test(match[5]) ? 1 : -1) * (+match[6] + +match[7] / 60 + +match[8] / 3600));
	} else if (match = queryNP.match(/^(\d{1,3})°?\s*(\d{1,2})['′]?\s*(\d{1,3}(?:\.\d*)?)?["″]\s*([NS])\W*(\d{1,3})°?\s*(\d{1,2})['′]?\s*(\d{1,3}(?:\.\d*)?)?["″]?\s*([EW])$/)) {
	    // degrees, minutes, decimal seconds [NSEW]
	    return L__namespace.latLng((/N/i.test(match[4]) ? 1 : -1) * (+match[1] + +match[2] / 60 + +match[3] / 3600), (/E/i.test(match[8]) ? 1 : -1) * (+match[5] + +match[6] / 60 + +match[7] / 3600));
	} else if (match = queryNP.match(/^\s*([+-]?\d+(?:\.\d*)?)\s*[\s,]\s*([+-]?\d+(?:\.\d*)?)\s*$/)) {
	    return L__namespace.latLng(+match[1], +match[2]);
	}
    }
    /**
     * Parses basic latitude/longitude strings such as `'50.06773 14.37742'`, `'N50.06773 W14.37742'`, `'S 50° 04.064 E 014° 22.645'`, or `'S 50° 4′ 03.828″, W 14° 22′ 38.712″'`
     */
    
    var LatLng = /*#__PURE__*/function () {
	function LatLng(options) {
	    this.options = {
		next: undefined,
		sizeInMeters: 10000
	    };
	    L__namespace.Util.setOptions(this, options);
	}
	
	var _proto = LatLng.prototype;
	
	_proto.geocode = function geocode(query, cb, context) {
	    var center = parseLatLng(query);
	    
	    if (center) {
		var results = [{
		    name: query,
		    center: center,
		    bbox: center.toBounds(this.options.sizeInMeters)
		}];
		cb.call(context, results);
	    } else if (this.options.next) {
		this.options.next.geocode(query, cb, context);
	    }
	};
	
	return LatLng;
    }();
    /**
     * [Class factory method](https://leafletjs.com/reference.html#class-class-factories) for {@link LatLng}
     * @param options the options
     */
    
    function latLng(options) {
	return new LatLng(options);
    }
    
    /**
     * Implementation of the [Nominatim](https://wiki.openstreetmap.org/wiki/Nominatim) geocoder.
     *
     * This is the default geocoding service used by the control, unless otherwise specified in the options.
     *
     * Unless using your own Nominatim installation, please refer to the [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/).
     */
    
    var Nominatim = /*#__PURE__*/function () {
	function Nominatim(options) {
	    this.options = {
		serviceUrl: 'https://nominatim.openstreetmap.org/',
		htmlTemplate: function htmlTemplate(r) {
		    var address = r.address;
		    var className;
		    var parts = [];
		    
		    if (address.road || address.building) {
			parts.push('{building} {road} {house_number}');
		    }
		    
		    if (address.city || address.town || address.village || address.hamlet) {
			className = parts.length > 0 ? 'leaflet-control-geocoder-address-detail' : '';
			parts.push('<span class="' + className + '">{postcode} {city} {town} {village} {hamlet}</span>');
		    }
		    
		    if (address.state || address.country) {
			className = parts.length > 0 ? 'leaflet-control-geocoder-address-context' : '';
			parts.push('<span class="' + className + '">{state} {country}</span>');
		    }
		    
		    return template(parts.join('<br/>'), address);
		}
	    };
	    L__namespace.Util.setOptions(this, options || {});
	}
	
	var _proto = Nominatim.prototype;
	
	_proto.geocode = function geocode(query, cb, context) {
	    
	    var center = parseLatLng(query);
	    var sizeInMeters = 10000;
	    
	    if (center) {
		var results = [{
		    name: query,
		    center: center,
		    bbox: center.toBounds(sizeInMeters)
		}];
		cb.call(context, results);
	    } else {
		var _this = this;
		
		var params = geocodingParams(this.options, {
		    q: query,
		    limit: 5,
		    format: 'json',
		    addressdetails: 1
		});
		getJSON(this.options.serviceUrl + 'search', params, function (data) {
		    var results = [];
		    
		    for (var i = data.length - 1; i >= 0; i--) {
			var bbox = data[i].boundingbox;
			
			for (var j = 0; j < 4; j++) {
			    bbox[j] = +bbox[j];
			}
			
			results[i] = {
			    icon: data[i].icon,
			    name: data[i].display_name,
			    html: _this.options.htmlTemplate ? _this.options.htmlTemplate(data[i]) : undefined,
			    bbox: L__namespace.latLngBounds([bbox[0], bbox[2]], [bbox[1], bbox[3]]),
			    center: L__namespace.latLng(data[i].lat, data[i].lon),
			    properties: data[i]
			};
		    }
		    
		    cb.call(context, results);
		});
	    }};
	
	_proto.reverse = function reverse(location, scale, cb, context) {
	    var _this2 = this;
	    
	    var params = reverseParams(this.options, {
		lat: location.lat,
		lon: location.lng,
		zoom: Math.round(Math.log(scale / 256) / Math.log(2)),
		addressdetails: 1,
		format: 'json'
	    });
	    getJSON(this.options.serviceUrl + 'reverse', params, function (data) {
		var result = [];
		
		if (data && data.lat && data.lon) {
		    var center = L__namespace.latLng(data.lat, data.lon);
		    var bbox = L__namespace.latLngBounds(center, center);
		    result.push({
			name: data.display_name,
			html: _this2.options.htmlTemplate ? _this2.options.htmlTemplate(data) : undefined,
			center: center,
			bbox: bbox,
			properties: data
		    });
		}
		
		cb.call(context, result);
	    });
	};
	
	return Nominatim;
    }();
    /**
     * [Class factory method](https://leafletjs.com/reference.html#class-class-factories) for {@link Nominatim}
     * @param options the options
     */
    
    function nominatim(options) {
	return new Nominatim(options);
    }
    
    var geocoders = {
	__proto__: null,
	geocodingParams: geocodingParams,
	reverseParams: reverseParams,
	parseLatLng: parseLatLng,
	LatLng: LatLng,
	latLng: latLng,
	Nominatim: Nominatim,
	nominatim: nominatim
    };
    
    /**
     * Leaflet mixins https://leafletjs.com/reference-1.7.1.html#class-includes
     * for TypeScript https://www.typescriptlang.org/docs/handbook/mixins.html
     * @internal
     */
    
    var EventedControl = // eslint-disable-next-line @typescript-eslint/no-unused-vars
	function EventedControl() {// empty
	};
    
    L__namespace.Util.extend(EventedControl.prototype, L__namespace.Control.prototype);
    L__namespace.Util.extend(EventedControl.prototype, L__namespace.Evented.prototype);
    /**
     * This is the geocoder control. It works like any other [Leaflet control](https://leafletjs.com/reference.html#control), and is added to the map.
     */
    
    var GeocoderControl = /*#__PURE__*/function (_EventedControl) {
	_inheritsLoose(GeocoderControl, _EventedControl);
	
	/**
	 * Instantiates a geocoder control (to be invoked using `new`)
	 * @param options the options
	 */
	function GeocoderControl(options) {
	    var _this;
	    
	    _this = _EventedControl.call(this, options) || this;
	    _this.options = {
		showUniqueResult: true,
		showResultIcons: false,
		collapsed: true,
		expand: 'touch',
		position: 'topright',
		placeholder: 'Search...',
		errorMessage: 'Nothing found.',
		iconLabel: 'Initiate a new search',
		query: '',
		queryMinLength: 1,
		suggestMinLength: 3,
		suggestTimeout: 250,
		defaultMarkGeocode: true
	    };
	    _this._requestCount = 0;
	    L__namespace.Util.setOptions(_assertThisInitialized(_this), options);
	    
	    if (!_this.options.geocoder) {
		_this.options.geocoder = new Nominatim();
	    }
	    
	    return _this;
	}
	
	var _proto = GeocoderControl.prototype;
	
	_proto.addThrobberClass = function addThrobberClass() {
	    L__namespace.DomUtil.addClass(this._container, 'leaflet-control-geocoder-throbber');
	};
	
	_proto.removeThrobberClass = function removeThrobberClass() {
	    L__namespace.DomUtil.removeClass(this._container, 'leaflet-control-geocoder-throbber');
	}
	/**
	 * Returns the container DOM element for the control and add listeners on relevant map events.
	 * @param map the map instance
	 * @see https://leafletjs.com/reference.html#control-onadd
	 */
	;
	
	_proto.onAdd = function onAdd(map) {
	    var _this2 = this;
	    
	    var className = 'leaflet-control-geocoder';
	    var container = L__namespace.DomUtil.create('div', className + ' leaflet-bar');
	    var icon = L__namespace.DomUtil.create('button', className + '-icon', container);
	    var form = this._form = L__namespace.DomUtil.create('div', className + '-form', container);
	    this._map = map;
	    this._container = container;
	    icon.innerHTML = '&nbsp;';
	    icon.type = 'button';
	    icon.setAttribute('aria-label', this.options.iconLabel);
	    var input = this._input = L__namespace.DomUtil.create('input', '', form);
	    input.type = 'text';
	    input.value = this.options.query;
	    input.placeholder = this.options.placeholder;
	    L__namespace.DomEvent.disableClickPropagation(input);
	    this._errorElement = L__namespace.DomUtil.create('div', className + '-form-no-error', container);
	    this._errorElement.innerHTML = this.options.errorMessage;
	    this._alts = L__namespace.DomUtil.create('ul', className + '-alternatives leaflet-control-geocoder-alternatives-minimized', container);
	    L__namespace.DomEvent.disableClickPropagation(this._alts);
	    L__namespace.DomEvent.addListener(input, 'keydown', this._keydown, this);
	    
	    if (this.options.geocoder.suggest) {
		L__namespace.DomEvent.addListener(input, 'input', this._change, this);
	    }
	    
	    L__namespace.DomEvent.addListener(input, 'blur', function () {
		if (_this2.options.collapsed && !_this2._preventBlurCollapse) {
		    _this2._collapse();
		}
		
		_this2._preventBlurCollapse = false;
	    });
	    
	    if (this.options.collapsed) {
		if (this.options.expand === 'click') {
		    L__namespace.DomEvent.addListener(container, 'click', function (e) {
			if (e.button === 0 && e.detail !== 2) {
			    _this2._toggle();
			}
		    });
		} else if (this.options.expand === 'touch') {
		    L__namespace.DomEvent.addListener(container, L__namespace.Browser.touch ? 'touchstart mousedown' : 'mousedown', function (e) {
			_this2._toggle();
			
			e.preventDefault(); // mobile: clicking focuses the icon, so UI expands and immediately collapses
			
			e.stopPropagation();
		    }, this);
		} else {
		    L__namespace.DomEvent.addListener(container, 'mouseover', this._expand, this);
		    L__namespace.DomEvent.addListener(container, 'mouseout', this._collapse, this);
		    
		    this._map.on('movestart', this._collapse, this);
		}
	    } else {
		this._expand();
		
		if (L__namespace.Browser.touch) {
		    L__namespace.DomEvent.addListener(container, 'touchstart', function () {
			return _this2._geocode();
		    });
		} else {
		    L__namespace.DomEvent.addListener(container, 'click', function () {
			return _this2._geocode();
		    });
		}
	    }
	    
	    if (this.options.defaultMarkGeocode) {
		this.on('markgeocode', this.markGeocode, this);
	    }
	    
	    this.on('startgeocode', this.addThrobberClass, this);
	    this.on('finishgeocode', this.removeThrobberClass, this);
	    this.on('startsuggest', this.addThrobberClass, this);
	    this.on('finishsuggest', this.removeThrobberClass, this);
	    L__namespace.DomEvent.disableClickPropagation(container);
	    return container;
	}
	/**
	 * Sets the query string on the text input
	 * @param string the query string
	 */
	;
	
	_proto.setQuery = function setQuery(string) {
	    this._input.value = string;
	    return this;
	};
	
	_proto._geocodeResult = function _geocodeResult(results, suggest) {
	    if (!suggest && this.options.showUniqueResult && results.length === 1) {
		this._geocodeResultSelected(results[0]);
	    } else if (results.length > 0) {
		this._alts.innerHTML = '';
		this._results = results;
		L__namespace.DomUtil.removeClass(this._alts, 'leaflet-control-geocoder-alternatives-minimized');
		L__namespace.DomUtil.addClass(this._container, 'leaflet-control-geocoder-options-open');
		
		for (var i = 0; i < results.length; i++) {
		    this._alts.appendChild(this._createAlt(results[i], i));
		}
	    } else {
		L__namespace.DomUtil.addClass(this._container, 'leaflet-control-geocoder-options-error');
		L__namespace.DomUtil.addClass(this._errorElement, 'leaflet-control-geocoder-error');
	    }
	}
	/**
	 * Marks a geocoding result on the map
	 * @param result the geocoding result
	 */
	;
	
	_proto.markGeocode = function markGeocode(event) {
	    var result = event.geocode;
	    
	    this._map.fitBounds(result.bbox);
	    
	    if (this._geocodeMarker) {
		this._map.removeLayer(this._geocodeMarker);
	    }
	    
	    this._geocodeMarker = new L__namespace.Marker(result.center).bindPopup(result.html || result.name).addTo(this._map).openPopup();
	    return this;
	};
	
	_proto._geocode = function _geocode(suggest) {
	    var _this3 = this;
	    
	    var value = this._input.value;
	    
	    if (!suggest && value.length < this.options.queryMinLength) {
		return;
	    }
	    
	    var requestCount = ++this._requestCount;
	    
	    var cb = function cb(results) {
		if (requestCount === _this3._requestCount) {
		    var _event = {
			input: value,
			results: results
		    };
		    
		    _this3.fire(suggest ? 'finishsuggest' : 'finishgeocode', _event);
		    
		    _this3._geocodeResult(results, suggest);
		}
	    };
	    
	    this._lastGeocode = value;
	    
	    if (!suggest) {
		this._clearResults();
	    }
	    
	    var event = {
		input: value
	    };
	    this.fire(suggest ? 'startsuggest' : 'startgeocode', event);
	    
	    if (suggest) {
		this.options.geocoder.suggest(value, cb);
	    } else {
		this.options.geocoder.geocode(value, cb);
	    }
	};
	
	_proto._geocodeResultSelected = function _geocodeResultSelected(geocode) {
	    var event = {
		geocode: geocode
	    };
	    this.fire('markgeocode', event);
	};
	
	_proto._toggle = function _toggle() {
	    if (L__namespace.DomUtil.hasClass(this._container, 'leaflet-control-geocoder-expanded')) {
		this._collapse();
	    } else {
		this._expand();
	    }
	};
	
	_proto._expand = function _expand() {
	    L__namespace.DomUtil.addClass(this._container, 'leaflet-control-geocoder-expanded');
	    
	    this._input.select();
	    
	    this.fire('expand');
	};
	
	_proto._collapse = function _collapse() {
	    L__namespace.DomUtil.removeClass(this._container, 'leaflet-control-geocoder-expanded');
	    L__namespace.DomUtil.addClass(this._alts, 'leaflet-control-geocoder-alternatives-minimized');
	    L__namespace.DomUtil.removeClass(this._errorElement, 'leaflet-control-geocoder-error');
	    L__namespace.DomUtil.removeClass(this._container, 'leaflet-control-geocoder-options-open');
	    L__namespace.DomUtil.removeClass(this._container, 'leaflet-control-geocoder-options-error');
	    
	    this._input.blur(); // mobile: keyboard shouldn't stay expanded
	    
	    
	    this.fire('collapse');
	};
	
	_proto._clearResults = function _clearResults() {
	    L__namespace.DomUtil.addClass(this._alts, 'leaflet-control-geocoder-alternatives-minimized');
	    this._selection = null;
	    L__namespace.DomUtil.removeClass(this._errorElement, 'leaflet-control-geocoder-error');
	    L__namespace.DomUtil.removeClass(this._container, 'leaflet-control-geocoder-options-open');
	    L__namespace.DomUtil.removeClass(this._container, 'leaflet-control-geocoder-options-error');
	};
	
	_proto._createAlt = function _createAlt(result, index) {
	    var _this4 = this;
	    
	    var li = L__namespace.DomUtil.create('li', ''),
		a = L__namespace.DomUtil.create('a', '', li),
		icon = this.options.showResultIcons && result.icon ? L__namespace.DomUtil.create('img', '', a) : null,
		text = result.html ? undefined : document.createTextNode(result.name),
		mouseDownHandler = function mouseDownHandler(e) {
		    // In some browsers, a click will fire on the map if the control is
		    // collapsed directly after mousedown. To work around this, we
		    // wait until the click is completed, and _then_ collapse the
		    // control. Messy, but this is the workaround I could come up with
		    // for #142.
		    _this4._preventBlurCollapse = true;
		    L__namespace.DomEvent.stop(e);
		    
		    _this4._geocodeResultSelected(result);
		    
		    L__namespace.DomEvent.on(li, 'click touchend', function () {
			if (_this4.options.collapsed) {
			    _this4._collapse();
			} else {
			    _this4._clearResults();
			}
		    });
		};
	    
	    if (icon) {
		icon.src = result.icon;
	    }
	    
	    li.setAttribute('data-result-index', String(index));
	    
	    if (result.html) {
		a.innerHTML = a.innerHTML + result.html;
	    } else if (text) {
		a.appendChild(text);
	    } // Use mousedown and not click, since click will fire _after_ blur,
	    // causing the control to have collapsed and removed the items
	    // before the click can fire.
	    
	    
	    L__namespace.DomEvent.addListener(li, 'mousedown touchstart', mouseDownHandler, this);
	    return li;
	};
	
	_proto._keydown = function _keydown(e) {
	    var _this5 = this;
	    
	    var select = function select(dir) {
		if (_this5._selection) {
		    L__namespace.DomUtil.removeClass(_this5._selection, 'leaflet-control-geocoder-selected');
		    _this5._selection = _this5._selection[dir > 0 ? 'nextSibling' : 'previousSibling'];
		}
		
		if (!_this5._selection) {
		    _this5._selection = _this5._alts[dir > 0 ? 'firstChild' : 'lastChild'];
		}
		
		if (_this5._selection) {
		    L__namespace.DomUtil.addClass(_this5._selection, 'leaflet-control-geocoder-selected');
		}
	    };
	    
	    switch (e.keyCode) {
		// Escape
            case 27:
		if (this.options.collapsed) {
		    this._collapse();
		} else {
		    this._clearResults();
		}
		
		break;
		// Up
		
            case 38:
		select(-1);
		break;
		// Up
		
            case 40:
		select(1);
		break;
		// Enter
		
            case 13:
		if (this._selection) {
		    var index = parseInt(this._selection.getAttribute('data-result-index'), 10);
		    
		    this._geocodeResultSelected(this._results[index]);
		    
		    this._clearResults();
		} else {
		    this._geocode();
		}
		
		break;
		
            default:
		return;
	    }
	    
	    L__namespace.DomEvent.preventDefault(e);
	};
	
	_proto._change = function _change() {
	    var _this6 = this;
	    
	    var v = this._input.value;
	    
	    if (v !== this._lastGeocode) {
		clearTimeout(this._suggestTimeout);
		
		if (v.length >= this.options.suggestMinLength) {
		    this._suggestTimeout = setTimeout(function () {
			return _this6._geocode(true);
		    }, this.options.suggestTimeout);
		} else {
		    this._clearResults();
		}
	    }
	};
	
	return GeocoderControl;
    }(EventedControl);
    /**
     * [Class factory method](https://leafletjs.com/reference.html#class-class-factories) for {@link GeocoderControl}
     * @param options the options
     */
    
    function geocoder(options) {
	return new GeocoderControl(options);
    }
    
    /* @preserve
     * Leaflet Control Geocoder
     * https://github.com/perliedman/leaflet-control-geocoder
     *
     * Copyright (c) 2012 sa3m (https://github.com/sa3m)
     * Copyright (c) 2018 Per Liedman
     * All rights reserved.
     */
    L__namespace.Util.extend(GeocoderControl, geocoders);
    L__namespace.Util.extend(L__namespace.Control, {
	Geocoder: GeocoderControl,
	geocoder: geocoder
    });
    
    exports.Geocoder = GeocoderControl;
    exports.default = GeocoderControl;
    exports.geocoder = geocoder;
    exports.geocoders = geocoders;
    
    return exports;
    
}({}, L));
