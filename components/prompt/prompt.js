( function () {
	/**
	 * Определение тэга получаемого обьекта (для точного определения типа)
	 * @param {*} data - любой обьект
	 * @returns {string} - тэг обьекта
	 */
	function objectTag ( data ) {
		return Object.prototype.toString.call( data ).slice( 8, -1 );
	}

	/**
	 * Слияние объектов
	 * @param {Object} source - исходный объект
	 * @param {Object} merged - слияемый объект
	 * @return {Object} - измененный исходный объект
	 */
	function merge( source, merged ) {
		for ( let key in merged ) {
			if ( objectTag( merged[ key ] ) === 'Object' ) {
				if ( typeof( source[ key ] ) !== 'object' ) source[ key ] = {};
				source[ key ] = merge( source[ key ], merged[ key ] );
			} else {
				source[ key ] = merged[ key ];
			}
		}

		return source;
	}

	/**
	 * Конструктор подсказки.
	 * @param {object} params - параметры подсказки
	 * @constructor
	 */
	function Tooltip ( params ) {
		// Проверка обязательных параметров
		if ( !( params.trigger instanceof Element ) ) throw new Error( 'Tooltip trigger must be element' );
		if ( !params.content ) throw new Error( 'Tooltip content must be non-empty' );

		// Слияние c параметрами по умолчанию
		merge( this, {
			trigger: null,
			content: null,
			event: 'click',
			position: 'top',
			parent: document.body,
			close: false,
			state: false,
			name: 'tooltip'
		});

		// Слияние c полученными параметрами
		merge( this, params );

		// Добавление к узлу ссылки на экземпляр
		this.trigger.tooltip = this;

		// Добавление обработчика события появления подсказки
		document.body.addEventListener( this.event, ( event ) => {
			if ( event.target === this.trigger ) {
				this.show();
			} else if ( event.target !== this.node ) {
				this.hide();
			}
		});
	}

	/**
	 * Установка позиции подсказки
	 */
	Tooltip.prototype.calc = function () {
		let
			style = window.getComputedStyle( this.node ),
			tRect = this.trigger.getBoundingClientRect(),
			wRect = {
				top: window.pageYOffset,
				bottom: window.pageYOffset + document.documentElement.clientHeight,
				left: window.pageXOffset,
				right: window.pageXOffset + document.documentElement.clientWidth,
				width: document.documentElement.clientWidth,
				height: document.documentElement.clientHeight
			},
			width = this.node.offsetWidth + parseInt( style.marginLeft ) + parseInt( style.marginRight ),
			height = this.node.offsetHeight + parseInt( style.marginTop ) + parseInt( style.marginBottom ),
			fit = true,
			top,
			left;

		switch( this.position ) {
			case 'top':
				top = wRect.top + tRect.top - height;
				left = wRect.left + tRect.left + tRect.width/2 - width/2;
				break;
			case 'bottom':
				top = wRect.top + tRect.bottom;
				left = wRect.left + tRect.left + tRect.width/2 - width/2;
				break;
			case 'left':
				top = wRect.top + tRect.top + tRect.height/2 - height/2;
				left = wRect.left + tRect.left - width;
				break;
			case 'right':
				top = wRect.top + tRect.top + tRect.height/2 - height/2;
				left = wRect.left + tRect.right;
				break;
		}

		if ( top < wRect.top ) {
			top = wRect.top;
			fit = false;
		} else if ( top + height > wRect.bottom ) {
			top = wRect.bottom - height;
			fit = false;
		}

		if ( left < wRect.left ) {
			left = wRect.left;
			fit = false;
		} else if ( left + width > wRect.right ) {
			left = wRect.right - width;
			fit = false;
		}

		if ( !fit ) {
			this.node.classList.add( this.name +'-unfit' );
		} else if ( this.node.classList.contains( this.name +'-unfit' ) ) {
			this.node.classList.remove( this.name +'-unfit' );
		}

		this.node.style.top = top +'px';
		this.node.style.left = left +'px';

		if ( tRect.top > wRect.height || tRect.bottom < 0 || tRect.left > wRect.width || tRect.right < 0 ) {
			this.hide();
		}
	};

	/**
	 * Добавление элемента подсказки
	 */
	Tooltip.prototype.show = function () {
		if ( !this.state ) {
			let node = this.node = document.createElement( 'div' );
			node.innerHTML = this.content;
			node.classList.add( this.name );
			node.classList.add(  this.name +'-'+ this.position );
			node.style.position = 'absolute';
			this.parent.appendChild( node );
			this.calc();
			this.resizeHandler = () => { this.calc(); };

			window.addEventListener( 'resize', this.resizeHandler );
			document.addEventListener( 'scroll', this.resizeHandler );
			node.classList.add( this.name +'-animated' );
			this.state = true;

			// Добавление кнопки звкрытия
			if ( this.close ) {
				let close = document.createElement( 'div' );
				close.classList.add( this.name +'-close' );
				node.classList.add( this.name +'-closable' );
				node.appendChild( close );
				close.addEventListener( 'click', () => {
					this.hide();
				});
			}
		}
	};

	/**
	 * Удаление элемента подсказки
	 */
	Tooltip.prototype.hide = function () {
		if ( this.state ) {
			this.node.remove();
			window.removeEventListener( 'resize', this.resizeHandler );
			document.removeEventListener( 'scroll', this.resizeHandler );
			this.state = false;
		}
	};

	// Изменение тэга Tooltip
	Object.defineProperty( Tooltip.prototype, Symbol.toStringTag, {
		get: function () { return 'Tooltip'; }
	});


	if ( !window.Tooltip ) {
		window.Tooltip = Tooltip;
	} else {
		throw new Error( 'Tooltip is already defined or occupied' );
	}
})();
