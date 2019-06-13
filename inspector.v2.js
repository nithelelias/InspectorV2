((owner) => {

    const Inspector = {
        DEV: true,
        version: "2.0.1.0",
        run: run,
        Components: ComponentsHandler(),
        add: addComponent,
        clear: clearComponents,
        getScope: getScope,
        readIncludes: readIncludes
    };
    /**
     *  Logger
     */
    const Log = {
        error: function (...args) {
            if (Inspector.DEV) {
                console.error(...args);
            }
        },
        warn: function (...args) {
            if (Inspector.DEV) {
                console.warn(...args);
            }
        },
        log: function (...args) {
            if (Inspector.DEV) {
                console.log(...args);
            }
        }
    };
    // GLOBAL SCOPE FOR WITH ELEMENT
    const $SCOPE = {};
    //  REGULAR EXPRESION TO FIND COMPONENTS;
    const $REGULAR_EXP = new RegExp(/{{([^}}]+)}}/g);
    // -- new RegExp(/{{(.*?)}}/g);

    /**
     * ESTE METODO LO QUE HACE ES CREAR UN NUEVO HANDLER DE COMPONENTES
     */
    function ComponentsHandler() {
        return {
            components: {},
            /**
             *  Este metodo Agrega una nueva clase componente
             * @param {String} className 
             * @param {Clase o Metodo} fnc 
             */
            add: function (className, fnc) {
                this.components[className] = fnc;
            },
            /**
             *  Este metodo elimina un component
             * @param {String} className 
             */
            remove: function (className) {
                this.components[className] = null;
                delete this.components[className];
            },
            /**
             *  Este metodo obtiene un componente por su nombre de clase
             * @param {String} className 
             */
            get: function (className) {
                if (this.components.hasOwnProperty(className)) {
                    return this.components[className];
                } else {
                    return null;
                }
            },
            /**
             * Este metodo elimina todos los componentes
             */
            clear: function () {
                for (let className in this.components) {
                    this.remove(className);
                }
            }
        }
    }

    /**
     * Este METODO LEERA SI HAY NUEVOS COMPONENTES DECLARADOS.
     */
    var loadingNewComponents = false;
    function initializeNewComponents(from) {

        //if (!loadingNewComponents) {          
        if (true) {
            // LEER SI HAY ELEMENTOS DECLARADOS CON ESTE COMPONENTE
            if (!from) {
                from = document;
            }
            if (from.childElementCount > 0) {

                loadingNewComponents = true;
                let listDomElements = from.querySelectorAll("[com]");
                let total = listDomElements.length;
                for (let index = 0; index < total; index++) {
                    initComponent(listDomElements[index]);
                }
                setTimeout(() => {
                    loadingNewComponents = false;
                });
            }
        }


    }

    /**
     *  ESTE METODO AGREGA UN COMPONENTE NUEVO
     * @param {String} className 
     * @param {ObjectClass| Method} func 
     */
    function addComponent(className, func) {
        Inspector.Components.add(className, func);
        initializeNewComponents();
    }

    function clearComponents() {
        return new Promise((resolve) => {

            Inspector.Components.clear();
            // QUITAR TODOS LOS COMPONENTES DEL SCOPE
            for (let i in $SCOPE) {
                $SCOPE[i] = null;
                delete $SCOPE[i];
            }

            // ITERAR TODOS LOS ELEMENTOS COM REGISTRADOS...
            var comelements = document.querySelectorAll("[com]");
            var total = comelements.length;
            for (let i = 0; i < total; i++) {
                if (comelements[i] != null) {
                    comelements[i].$watcher.remove();
                    comelements[i].$watcher = null;
                    comelements[i].$read = null;
                    comelements[i].remove();
                    comelements[i] = null;
                }
            }

            // CLEAN ALL CSS ELEMENTS //$(".include-css").remove();            
            iterateDom(document.getElementsByClassName("include-css"), (a) => {
                a.remove();
            });
            // CLEAN ALL JS ELEMENTS  $(".include-js").remove();-- nop...
            resolve();
        });
    }

    /**
     *  Itera una array de doms con la estructura foreach para no agregar  mas codigo en funciones que pueden extenderse mucho.
     * @param {Array of Dom} domArray 
     * @param {function callback} callback 
     */
    function iterateDom(domArray, callback) {
        const total = domArray;
        for (let index = 0; index < total; index++) {
            const element = domArray[index];
            callback(element, index);
        }
    }

    /**
     * Este metodo llama e nombre del Componente por el nombre
     * @param {String} className 
     */
    function getComponentClass(className) {
        return Inspector.Components.get(className);
    }

    /**
     * Este metodo obtiene todo el scope.
     */
    function getScope() {
        return $SCOPE;
    }


    /**
     * ESTE METODO INIICA LA OPERACION, BUSCANDO TODOS LOS ELEMENTOS QUE TENGAN UN ATRIBUTO COM, Y 
     * LUEGO INICIANDO EL COMPONENTE CON SU OBJETO COMPONENTE RELACIONADO EN EL MISMO VALOR
     * 
     */
    function run() {
        // PRIMERO OBTEN TODOS LOS ELEMNTOS INCLUYENTES
        readIncludes().then(() => {
            //  OBTEN TODOS LOS ELEMENTOS CON EL ATRIBUTO COM:
            initializeNewComponents();
        })
    }

    /**
     * Este metodo registra un elemento que tenga un componente
     * @param {Object as Dom Node} element 
     */
    function initComponent(element) {
        if (!element.$Component) {

            element.$Component = element.$Component || {};
            element.$read = function () {
                readComponents(this);
            };
            element.$render = function () {
                element.$read();
                // SI TIENE COMPONENTES INICA EL WATCHER
                if (Object.keys(element.$Component).length > 0) {
                    element.$watcher.initialize();
                }
            };

            // agregamos el watcher del elemento y lo iniciamos
            if (element.$watcher == null) {
                element.$watcher = new ElementWatcher(element);
            }
        }
        // LEE EL DOM PARA VALIDAR NUEVAS EXPRESSIONES
        element.$render();

    }

    /**
     * Este metodo lee los compontes de un elemento declarados del atributo com, si tiene componentes los instancia.
     * @param {DomObject} element 
     */
    function readComponents(element) {

        // get components of com attribute
        let classComponents = element.attributes.com.value.split(",");
        let totalComponents = classComponents.length;
        if (Object.keys(element.$Component).length == 0) {
            for (let index = 0; index < totalComponents; index++) {
                let componentName = classComponents[index];
                let componentClass = getComponentClass(componentName);
                // OBTEN LA CLASE COMPONENTE SI EXISTE SINO SERA NULL.
                if (componentClass != null) {
                    // OBTENEMOS ELNOMBRE DE LA INSTANCIA DEL COMPONENTE
                    let instanceName = componentName.indexOf(" as ") > -1 ? componentName.split(" as ")[1] : componentName.toLowerCase();

                    // SI EL ELEMNTO YA HA DECLARADO EL COMPONENTE ENTONCES OMITIR LA INSTANCIACION
                    if (!element.$Component.hasOwnProperty(instanceName)) {
                        // EN ESTE PEDAZO DE CODIGO OBTENEMOS UNA NUEVA INSTANCIA DE NOMBRE SI A EXISTE EN EL $SCOPE
                        {
                            let counter = 0;
                            let newInstanceName = "" + instanceName;
                            while ($SCOPE.hasOwnProperty(newInstanceName)) {
                                counter++;
                                newInstanceName = instanceName + counter;
                            }
                            instanceName = newInstanceName;
                        }
                        // -- console.log("add comnponent in ", element, " with ", instanceName, element.$Component)
                        // CREAMOS UNA NUEVA INSTANCIA DEL COMPONENTE, La GUARDAMOS EN EL HANDLER DEL COMPONENTE Y A SU VEZ LA REGISTRAMOS EN EL SCOPE GLOBAL.                    
                        $SCOPE[instanceName] = element.$Component[instanceName] = new componentClass(element);
                    }
                }
            }
        }
    }


    /**
     * ESTE METODO SE INSTANCIA PARA LEER EL ELEMENTO DOM MISMO y SABER QUE ACTUALIZAR OBSERVANDO CAMBIOS DE LAS PROPIEDADES DE LAS INSTANCIAS ASOCIADAS EN EL ATRIBUTO, COM.
     * @param {Dom Object| Node} $element 
     */
    function ElementWatcher($element) {

        var expressions = [];
        var properiesDefined = {};
        var _thisWatcher = this;

        $element.setHTML = function (html) {
            $element.innerHTML = html;
        };
        this.validate = function () {
            if (!$element.isConnected) {
                // ERASE THIS..                console.log("remove cuz element not connected");
                this.remove();
                return false;
            }
            return true;
        };

        this.getExpressions = function () {
            return expressions;
        };

        this.addExression = function (ex) {
            expressions.push(ex);
        };

        this.getComponents = function () {
            return $element.$Component;
        };

        this.getNode = function () {
            return $element;
        };

        this.remove = function () {

            for (let instanceName in $element.$Component) {
                $SCOPE[instanceName] = $element.$Component[instanceName] = null;
                delete $element.$Component[instanceName];
                delete $SCOPE[instanceName];
            }
            expressions = [];
            properiesDefined = {};
        };

        this.compile = compile;

        /**
         * este metodo initializa el watcher...
         */
        this.initialize = function () {
            // LEE EL NODO EN BUSCA DE LAS EXPRESSIONES
            inspectNode($element, this);
            // EVALUATE PROPERTES OF EACH INSTANCE
            let components = this.getComponents();
            for (var instanceName in components) {
                // IF THIS PROPERTY HAS ALLREADY BEEN DEFINED
                if (!properiesDefined.hasOwnProperty(instanceName)) {
                    properiesDefined[instanceName] = true;
                    definePropertiesOf(components[instanceName]);
                }
            }



        };

        /**
         * Este metodo compila las expresiones y la inyecta en las propiedades del Dom de este watcher.
         */
        function compile() {
            // VALIDATE IF NODE IS STILL ACTIVE
            if ($element.isConnected) {
                let totalExpressions = expressions.length;
                for (let index = 0; index < totalExpressions; index++) {
                    expressions[index].run();
                }
            }

        }

        /**
         *  Este metodo indica que va actualizar debido a un cambio de la propiedad de la instancia..
         * @param {String} prop 
         * @param {Object} instanceObj 
         */
        function refreshViewElement(prop, instanceObj) {
            // -- Log.log("UPDATEME", prop, instanceObj, instanceObj[prop], $element);
            compile();
        }

        /**
         * Este metodo lee las propiedaes del objeto y define un get, set para saber cuando se edita la propiedad
         * @param {Object} _obj 
         */
        function definePropertiesOf(_obj) {
            if (_obj == null || typeof (_obj) != "object") {
                return;
            }
            let properties = {};
            let watchProperty = {};
            /**
             *  inyectamos este metodo para que la instancia pueda observar cambios en sus propiedades
             */
            _obj.$watch = function (propertyName, callback) {
                watchProperty[propertyName] = callback;
            };

            /**
             * Este metodo se usa para actualizar la vista a peticion del usuario
             */
            _obj.$update = _obj.$apply = _obj.$refresh = function () {
                refreshViewElement();
            };
            /**
            * Este metodo se usa para actualizar la vista a peticion del usuario
            */
            _obj.$view = function () {
                return $element;
            };
            /**
             * Aqui iteramos todas las proiedades de los objetos
             */
            Object.keys(_obj).forEach(function (prop, _indexProperty) {
                // MIENTRAS QUE ESTA PROPIEADAD NO SEA UNA FUNCION
                if (typeof (_obj[prop]) != "function") {
                    // INSTANCIA LA PROPIEDAD
                    properties[prop] = _obj[prop];

                    // SI LA PROPIEDAD ES UNA ARRAY SOBREESCRIBE LAS OPERACIOENS DE ARRAY, PARA ACTUALIZAR
                    if (Array.isArray(_obj[prop])) {
                        ['pop', 'push', 'reverse', 'shift', 'unshift', 'splice', 'sort'].forEach((m) => {
                            _obj[prop][m] = function () {
                                var res = Array.prototype[m].apply(_obj[prop], arguments); // call normal behaviour                            
                                refreshViewElement(prop, _obj);
                                return res;
                            }
                        });


                    }
                    // DEFINA LOS SETS DE LA PROPIEDAD LLAMAR A ACTUALIZAR
                    Object.defineProperty(_obj, prop, {
                        // INDICA SI ES ENUMERABLE SI ESTE ES UN ARRAY.
                        enumerable: Array.isArray(_obj[prop]),
                        // DEFINE EL SET
                        set: function (_v) {
                            // DETECTA SI HAY CAMBIO
                            let _update_prop = properties[prop] != _v;
                            // DALE VALOR A LA PROPIEDAD.
                            properties[prop] = _v;
                            //  SI HAY UN CAMBIO ACTUALIZA
                            if (_update_prop) {
                                if (watchProperty.hasOwnProperty(prop)) {
                                    watchProperty[prop](_v);
                                }
                                refreshViewElement(prop, _obj);
                            }

                        },
                        // DEFINE GET
                        get: function () {
                            // DALE RESPEUSTA ENEL ARBOLD E PROPIEDADES
                            return properties[prop];
                        }
                    });

                }
            });
        }

    }


    /**
     *  ESTE METODO SE USA PARA INCIALIZAR LOS EVENTOS SOBRE UN ELEMENTO DEL DOM
     * @param {NodeObject|DOM} _el 
     * @param {AttributeObject|DOM} attr 
     * @param {ElementWatcher} _watcher 
     */
    function initEventTrigger(_el, attr, _watcher) {
        try {
            var methodExpression = getMethodExpression(cleanExpressionOfThis(attr.value, _watcher), "evt");
            _el[attr.name] = function (evt) {
                methodExpression(evt);
            };
        } catch (e) {
            Log.warn("No se pudo analizar la expresion", e, " en ", _el)
        }

    }

    /**
     *  Este Metod se usa para guardar los eventos de modal
     * @param {NodeObject|Dom} _el 
     * @param {String} attr_value 
     * @param {ElementWatcher} _watcher 
     */
    function initModelTrigger(_el, attr_value, _watcher) {
        // SI ES UN INPUT CHECKBOX
        if (_el.type == "checkbox" || _el.type == "radio") {
            let temp_onchange = _el.attributes.onchange != null ? getMethodExpression(cleanExpressionOfThis("" + _el.attributes.onchange.value, _watcher)) : null;
            var methodExpression = getMethodExpression(cleanExpressionOfThis(attr_value + "=args[0]", _watcher))
            _el.onchange = function (evt) {
                methodExpression(_el.checked ? evt.target.value : null);
                if (temp_onchange != null) {
                    temp_onchange(evt);
                }
            };
            // VALIDAR SI DEBE ESTAR CHECKED O NO CHECKED...
            let currentValue = getMethodExpression(cleanExpressionOfThis(attr_value, _watcher))();
            _el.checked = currentValue == _el.value;
            return;
        } else {

            // ACTUALIZA EL ATRIBUTO VALOR, de lo que diga el modelo
            validateAndAdd(_el, "value", attr_value, _watcher);
            // SI ES UN INPUT TEXT...
            // GUARDA TEMPORALMENTE LAS EJECUCIONES QUE PUEDAN TENER EN onkeyup Y onchange.
            let events = ["onkeydown", "onkeyup", "onchange", "oninput"];
            let temps = {};
            for (let i in events) {
                let _evtName = events[i];
                if (_el.attributes.hasOwnProperty(_evtName)) {
                    temps[_evtName] = getMethodExpression(cleanExpressionOfThis("" + _el.attributes[_evtName].value, _watcher));
                    _el.attributes[_evtName].value = "";
                    delete _el.attributes[_evtName];
                }
            }

            // SOBRE ESCRIBE LOS METODOS DE ONKEYUP Y ONCHANGE PARA QUE EJECUTEN EL TRIGGER 

            _el.onchange = triggerEventOnDelay;
            _el.onkeyup = triggerEventOnDelay;
            _el.onkeydown = triggerEventOnDelay;
            // CREAMOS UN METODO EL CUAL SE DEBE EJCUTAR CON EL SCOPE EN DONDE EL MODELO INDICADO DEBE SER IGUAL AL ARGUMENTO DE ENTRADA QUE SE EJCUTARA EN EL TRIGGER
            var methodExpression = getMethodExpression(cleanExpressionOfThis(attr_value + "=args[0]", _watcher));
            var timeoutToTrigger = null
            // -- Log.log(methodExpression);

            /**
             *  Este metodo se usa para escuchar todos los eventos pero les da un delay para que internamente el proceso
             *  tenga un tiempo prudencial de ejecucion
             * @param {Event} evt 
             */
            function triggerEventOnDelay(evt) {
                clearTimeout(timeoutToTrigger);
                timeoutToTrigger = setTimeout(modelTrigger, 10, evt);
            }

            /**
             *  Este metodo se ejecuta cuando el valor del input es cambiado o digitado
             * @param {Event} evt 
             */
            function modelTrigger(evt) {

                let value = evt.target.value;
                /* 
                    PRIMERO EVALUA LA EXPRESION DEL MODELO. USANDO EL METODO evaluateEvent.
                    ESTO HARA QUE EL MODELO RECIVA EL VALOR DEL ELEMENTO
                */
                attr_value = value;
                // EJECUTA LA EXPRESSION.
                methodExpression(value);
                // -- Log.log(evt.type, " attr_value: ", attr_value, "response:", methodExpression(value));

                // NEXT EJECUTA POSTERIORMENTE LOS LLAMADOS DE onchange O onkeyup SI ESTOS EXISTEN
                try {
                    let eventName = "on" + evt.type;
                    // SI TIENE EL EVENTO DECLAADO EJECUTALO
                    if (temps.hasOwnProperty(eventName)) {
                        temps[eventName](evt);
                        evt.preventDefault();
                    }
                } catch (e) {
                    Log.warn(e, _el);
                }

            };
        }
    }

    /**
    *  ESTE METODO INSPECCIONA EL NODO AGREGANDOLE AL WATCHER LAS EXPRESSIONES QUE SE DEBEN ACTUALIZAR EN EL MISMO NODO o DOM.
    *   LEERA TEXTOS Y DIFERENTES ATRIBUTOS DE MISMO NODO DEFORMA RECURSIVA POR SUS HIJOS
    * @param {ObjectNode} _node 
    * @param {ElementWatcher} _watcher 
    */
    function inspectNode(_node, _watcher) {
        if (!_node.$inspected$) {
            _node.$inspected$ = true;
            if (_node.nodeName == "#text") {
                validateAndAdd(_node, "textContent", _node.textContent, _watcher);
            } else if (_node.attributes != null) {// SI EL ELEMENTO TIENE ATRIBUTOS

                // ANTES DE ITERAR ATRIBUSO PRIORIZAMOS MODEL
                if (_node.attributes.model != null) {

                    // VALIDAR SI EL MODELO SOLO CONTIENE UNA PROPIEDAD 
                    if (_node.attributes.model.value.split(".").length >= 2) {

                        // DETECTAR SI EL USUARIO CAMBIA EL VALOR REALIZNADO UN INPUT.
                        initModelTrigger(_node, _node.attributes.model.value, _watcher);
                    }
                }
                // ITERAMOS LOS ATRIBUTOS
                for (let i = _node.attributes.length - 1; i >= 0; i--) {
                    // GUARDAMOS EL ATTR PARA MEJOR MANEJO EN EL AMBITO ACTUAL.
                    let attr = _node.attributes[i];
                    // SI ES UN EVENTO NO LO AGREGE A LOS ELEMNTOS POR EJECUTAR EN EXPERIENCIA
                    if (attr.name.indexOf("on") == 0 && _node.attributes.model == null) {
                        initEventTrigger(_node, attr, _watcher);
                    } else if (attr.name != "com" && attr.name != "model" && attr.name != "value") {
                        // SI NO ES UN COMPONENTE Y NO ES UN MODEL.                        
                        validateAndAdd(_node, attr.name, attr.value, _watcher);
                    }
                }
            }

        }
        // ITERAMOS SUS HIJOS
        iterateChildsOfNode(_node, function (childNode) {
            //VALIDAR QUE EL NODO HIJO NO TENGA ATRIBUTO COM, YA QUE DESDE AQUI EMPEZARIA OTRO COMPONENTE.
            let hasCom = childNode.attributes != null && childNode.attributes.com;
            if (!hasCom) {
                inspectNode(childNode, _watcher);
            }
        });

    }
    /**
    *  Este metodo INSPECCIONA LOS HIJOS DE UN NODO.
    * @param {Node Object} _node 
    */
    function iterateChildsOfNode(_node, callback) {
        if (callback != null) {
            var cnodes = _node.childNodes;
            let total = cnodes.length;
            for (let i = 0; i < total; i++) {
                callback(cnodes[i]);
            }
        }
    };

    /**
     *  Limpia la expresion para que sea compilable en un metodo
     * @param {String} expression 
     */
    function getMethodExpression(expression, variables) {
        // -- let evalString = expression.split("{{").join("").split("}}").join("").trim();
        let groups = expression.match($REGULAR_EXP);
        let evalString = expression;
        let stringexpression = expression;
        let ex;
        let args = variables != null ? variables : "...args";
        if (groups != null) {

            groups.forEach(function (item) {
                evalString = evalString.replace(item, item.replace("{{", "${").replace("}}", "}"));
            });
            stringexpression = evalString;
            evalString = "`" + evalString + "`";

        }

        try {
            ex = eval(`(${args})=>{ try{   with (getScope()) {  return ${evalString}; }  }catch(e){    throw { message: " No se pudo ejecutar la expresion:",expression: stringexpression, error: e };   } } ;`);
        } catch (e) {
            throw { message: "No se pudo analizar la expresion ", expresion: evalString, error: e };
        }


        return ex;
    }

    /**
     * 
     * @param {String} expressionValue      
     * @param {ElementWatcher} _watcher 
     */
    function cleanExpressionOfThis(expressionValue, _watcher) {

        var indexOfThis = expressionValue.indexOf("this.");
        // si esta el uso de this.
        if (indexOfThis > -1) {
            // REMPLAZA EL THIS. POR EL NOMBRE DE LA INSTANCIA DEL PRIMER COMPONENTE DECLARADO
            var componentsNames = Object.keys(_watcher.getComponents());
            // SI hay componentes aqui
            if (componentsNames.length > 0) {
                // en esta expresion quita los this. de esta evaluacion y pon el nombre de instancia del primer componente.
                expressionValue = expressionValue.split("this.").join(componentsNames[0] + ".");
            }
            // si hay mas de un componente
            if (componentsNames.length > 1) {
                Log.warn("Using this. while implementing several components, will get only the first ", componentsNames, _watcher.getNode());
            }
        }

        return expressionValue;

    }

    /**
     *  Este metodo valida y agrega una exprsion al watcher creando una instancia de HandlerExecutionClass..
     * @param {NodeObject} _el 
     * @param {String} prop_name 
     * @param {String} expressionValue 
     * @param {ElementWatcher} _watcher 
     */
    function validateAndAdd(_el, prop_name, expressionValue, _watcher) {
        // SI NO CONTIEE NADA
        if (expressionValue == null || expressionValue.trim().length == 0) {
            return false;
        }
        // 
        if ((expressionValue.indexOf("{{") > -1 && expressionValue.indexOf("}}") > -1)
            || prop_name === ("html") || prop_name === ("model") || (prop_name === ("value") && _el.attributes.model != null) || prop_name === ("show") || prop_name === ("hide")
        ) {

            _watcher.addExression(new HandlerExecutionClass(_el, prop_name, cleanExpressionOfThis(expressionValue, _watcher), _watcher));

        }
    }

    /**
     *  Function Class, que creara un metodo de ejecucion para compilar su expression.
     * @param {NodeObject| Dom} _el 
     * @param {String} prop_name 
     * @param {String} expressionValue 
     */
    function HandlerExecutionClass(_el, prop_name, expressionValue, _watcher) {

        var execMethod;
        try {
            execMethod = getMethodExpression(expressionValue);
        } catch (error) {
            execMethod = () => { return ""; };
            Log.warn("%c" + error.message.trim(), "font-weight:bolder;color:blue;font-size:20px;", expressionValue);
            Log.warn(error.error);
            Log.warn(" %cEn la propiedad %c" + prop_name + " del nodo ", _el,
                "font-style: normal;color:orange;",
                "color:black;",
                "font-weight:bolder;color:black;");
            Log.warn("En la propiedad", prop_name, "de ", _el);
        }

        // -- Log.log(execMethod);
        this.expressionValue = expressionValue,
            this.property = prop_name,
            this.validateCurrentValue = function () {

                if (prop_name == "textContent") {
                    this.value = _el[prop_name];
                } else if (prop_name == "html") {
                    this.value = _el.innerHTML;
                }
            },
            this.run = function () {
                try {
                    let value = execMethod();
                    // VALIDAMOS SI LO QUE TENEMOS ENFRENTE ES UN NUMERO, DE SER ASI PASAMOS A UN ENTERO O FLOTANTE.
                    if (value != null && value != "" && !isNaN(value) && value.constructor.name == "String") {
                        // SI TIENE . ES UN FLOTANTE
                        if (value.indexOf(".") > -1) {
                            value = parseFloat(value);
                        } else {
                            // SINO PARSEALO A NUMERO.
                            value = parseInt(value);
                        }
                    }

                    if (prop_name == "textContent") {
                        if (_el[prop_name] !== value) {
                            _el[prop_name] = value;
                        }
                    } else if (prop_name == "html") {
                        if (_el.innerHTML !== value) {
                            _el.innerHTML = value;
                            if (_el.childNodes.length > 0) {
                                setTimeout(initializeNewComponents, 100, _el);
                            }
                            inspectNode(_el, _watcher)

                        }
                    } else if (prop_name == "show") {
                        if (value) {
                            _el.style.display = null;
                            delete _el.style.display;
                        } else {
                            _el.style.display = "none";
                        }
                    } else if (prop_name == "hide") {
                        if (value) {
                            _el.style.display = "none";
                        } else {
                            _el.style.display = null;
                            delete _el.style.display;
                        }
                    } else if (_el.hasAttribute(prop_name)) {
                        let currentValue = _el.getAttribute(prop_name);
                        if (currentValue !== value) {
                            _el.setAttribute(prop_name, value);
                        }
                    } else {
                        let currentValue = getPropertyValue(_el, prop_name);
                        if (currentValue !== value) {
                            setPropertyValue(_el, prop_name, value);
                        }
                    }
                } catch (e) {

                    Log.error("%c" + e.message + "%c" + e.expression, "font-weight:bolder;color:blue;font-size:20px;",
                        "font-style: italic;color:black;");
                    Log.error(e.error.message, _el);
                    // -- console.log(getScope(), getTotalIncludes());
                }
            };

        // -- ELPRIMER LLAMADO DEBE HACERSE CUANDO TODOS LOS INCLUDES ESTE LISTOS...
        function firstRun() {
            let totalIncludes = getTotalIncludes();
            if (totalIncludes == 0) {
                this.run();
            } else {
                setTimeout(() => {
                    firstRun.call(this);
                }, 100);
            }
        }
        firstRun.call(this);
    }

    /**
     *  Este metodo  es usado para dalre el valor a un elemento
     * @param {Node Object} nodeEL 
     * @param {Property Name} prop_name 
     * @param {String|number} value 
     */
    function setPropertyValue(nodeEL, prop_name, value) {
        let obj = nodeEL;
        var arr = prop_name.split(".");
        while (arr.length > 1) {
            obj = obj[arr.shift()];
        }
        obj[arr[0]] = value;

    }

    function getPropertyValue(nodeEL, prop_name) {
        let obj = nodeEL;
        var arr = prop_name.split(".");
        while (arr.length > 1) {
            obj = obj[arr.shift()];
        }
        return obj[arr[0]];
    }


    /*
    ##########################################
                    INCLUDER
    ##########################################
    *
    *   En esta aparte indico los metodos de includer
    */

    function getTotalIncludes() {
        return document.querySelectorAll("include").length;
    }
    /**
     *  include all elementos on html tag include
     */
    function readIncludes() {
        return new Promise((resolve_readIncludes) => {
            /**
             * este metodo se usa para obtener los includes y cargar las fuentes...
             */
            function selectIncludes() {
                return new Promise((resolvePromises) => {
                    let includes = document.querySelectorAll("include");
                    let total = includes.length;
                    var promises = [];
                    if (total > 0) {
                        for (let index = 0; index < total; index++) {
                            let includeDom = includes[index];
                            promises.push(getIncludeSource(includeDom));
                        }
                    }
                    // -- 
                    Promise.all(promises).then(resolvePromises);
                });
            }
            /**
             * este metodo se usa para ejecutar el select de los includes y cuando termine validar si ya no hay mas que incluir
             */
            function runInclude() {
                selectIncludes().then(function () {
                    if (document.querySelectorAll("include").length > 0) {
                        runInclude();
                    } else {
                        resolve_readIncludes();
                    }
                });
            }

            runInclude();



        });
    }

    /**
     * Este metodo obtiene la extension de una url o ruta
     * @param {String} _src 
     */
    function getExtension(_src) {
        return (([].concat(_src.split("."))).pop() + "").toLowerCase();
    }

    /**
     *  Este metodo busca si hay una libreria con esa ruta ya existente
     * @param {String} lib 
     * @param {String} tag 
     * @param {String} prop 
     */
    function foundIfLibExist(lib, tag, prop) {

        let exist = false;
        let arraylibs = document.querySelectorAll(tag);
        let total = arraylibs.length;
        // ITERAMOS las librerias 
        for (let i = 0; i < total; i++) {
            // validamos con un indexOf de una libreria por si la ruta tiene algun parametro e cacheado
            if (arraylibs[i][prop].indexOf(lib) > -1) {
                // indicamos que existe
                exist = true;
                break;
            }
        }
        return exist;
    }

    /**
     *  Obtenemos la(s) fuentes(s) de un objet node con tag INCLUDE, de su parametro src.
     * @param {NodeObject} includeNode 
     */
    function getIncludeSource(includeNode) {
        return new Promise((resolve) => {
            if (!includeNode.loading) {
                // INDICAMOS Que actualmente esta esperando respuesta
                includeNode.loading = true;
                // obtenemos las fuentes del atributo src.
                let sources = includeNode.attributes.src.value.split(",");
                // array de promesas 
                let promises = [];
                let onloadcallback = includeNode.onload;// --  != null ? methodExpression(includeNode.onload) : null;
                // iteramos las fuentes
                sources.forEach(function (src) {
                    // cargamosla fuente y guardamos la promesa en el array.
                    promises.push(loadSource(src, includeNode));
                });


                // cuando todas las promesas hansido cumplidas
                Promise.all(promises).then(function () {
                    // si el nodo aun existe indicar que  termino de cargar
                    if (includeNode != null) {
                        includeNode.loading = false;
                    }
                    if (onloadcallback != null) {
                        onloadcallback();
                    }
                    resolve();
                }, function () {
                    // ha fallado de alguna forma. y si el nodo aun existe indicar que termino de cargar.

                    if (includeNode != null) {
                        includeNode.loading = false;
                    }
                });
            }
        });
    }

    /**
     *  Este metodo carga una fuente (src) teniendo encuenta su extension, y borrando el nodo INCLUDE, si el parametro dontRemoveInclude es falso.
     * @param {String} src 
     * @param {NodeObject} includeNode 
     * @param {boolean} dontRemoveInclude 
     */
    function loadSource(src, includeNode, dontRemoveInclude) {
        return new Promise((resolve, reject) => {
            switch (getExtension(src)) {
                case "js":
                case "js:module":
                case "mjs":
                    //cargalos como script
                    loadScript(src).then(() => {
                        // cuando termine si el nodo existe
                        if (includeNode != null) {
                            // si se puede borrar borrar el nodo
                            if (!dontRemoveInclude) {
                                includeNode.remove();
                            }
                        }
                        resolve();
                    }, reject);
                    break;
                case "css":
                    loadCss(src).then(() => {
                        // cuando termine si el nodo existe
                        if (includeNode != null) {
                            // si se puede borrar borrar el nodo
                            if (!dontRemoveInclude) {
                                includeNode.remove();
                            }
                        }
                        resolve();
                    }, reject);
                    break;
                case "html":
                    loadHtml(src).then((html) => {
                        // cuando termine si el nodo existe
                        if (includeNode != null) {
                            // agregar el html al lado del nodo include $(html).insertAfter(includeNode);                            
                            includeNode.insertAdjacentHTML('beforebegin', html);
                            // si se puede borrar borrar el nodo
                            if (!dontRemoveInclude) {
                                includeNode.remove();
                            }
                        }
                        // regresar el html.
                        resolve(html);
                    }, reject);
                    break;
                default:
                    // si no es ninguno de los superiores es tomado como componente
                    loadCom(src).then((jsonInfo) => {
                        // dentro de la informacion debe ser un json
                        let _includes = typeof (jsonInfo) == "string" ? JSON.parse(jsonInfo) : jsonInfo;
                        let total = _includes.length;
                        let compromises = [];
                        let reslveOut = true;
                        // OBTEN EL ORIGEN DE ESTE ARCHIVO Y CARGA APARTIR DE ALLI..
                        let origin = (() => { let s = src.split("/"); s.pop(); return s.join("/") })();
                        try {
                            for (let i = 0; i < total; i++) {
                                let newsrc = _includes[i];

                                if (_includes[i].indexOf("./") == 0) {
                                    newsrc = newsrc.replace("./", origin + "/");
                                }
                                compromises.push(loadSource(newsrc, includeNode, true));
                            }
                            reslveOut = false;
                            Promise.all(compromises).then(function () {
                                if (!dontRemoveInclude) {
                                    includeNode.remove();
                                }
                                resolve();
                            });
                        } catch (e) {
                            Log.error(e);
                        }
                        //
                        if (reslveOut) {
                            resolve();
                        }
                    }, reject);
                    break;
            }
        });
    }

    /**
     * Carga un js script de la fuente., esto lo cargara al final del body de la pagina
     * @param {String} src 
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // valida si la libreria existe
            if (!foundIfLibExist(src, "script", "src")) {
                let ext = getExtension(src);
                let ismodule = false;
                if (ext.indexOf(":module") > -1) {
                    ismodule = true;
                    src = src.substring(0, src.lastIndexOf(":module"));
                } else if (ext == "mjs") {
                    ismodule = true;
                }
                var script = document.createElement("script");
                script.src = src;
                script.type = ismodule ? "module" : "text/javascript";
                script.classList.add("include-js");
                script.onload = function () {
                    resolve();
                };
                script.onerror = function () {
                    reject();
                };

                document.body.appendChild(script);
            } else {
                resolve("existed")
            }
        });
    }

    /**
     * Carga el css.
     * @param {String} src 
     */
    function loadCss(src) {
        return new Promise((resolve, reject) => {
            if (!foundIfLibExist(src, "link", "href")) {
                var css = document.createElement("link");
                css.href = src;
                css.rel = "stylesheet";
                css.type = "text/css";
                css.classList.add("include-css")
                css.onload = function () {
                    resolve();
                };
                css.onerror = function () {
                    reject();
                };
                document.head.appendChild(css);
            }
        });
    }

    /**
     * Busque el html de la fuente.
     * @param {String} src 
     */
    function loadHtml(src) {
        return new Promise((resolve, reject) => {
            fetch(src).then(function (response) {
                return response.text();
            }, reject).then(resolve, reject);
        });
    }

    /**
     *  Busca informacion de un componente. esa informacion debe ser un array con fuentes que cargar.
     * @param {String} src 
     */
    function loadCom(src) {
        return new Promise((resolve, reject) => {
            fetch(src).then(function (response) {
                return response.json();
            }, reject).then(resolve, reject);
        })
    }

    /**
     *  esta funcion crea un observador para ver los cambios del dom del Body.
     */
    function instanceDomChange() {
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                let totalNodesAdded = mutation.addedNodes.length;
                let newIncludes = 0;
                let newComponents = 0;
                if (mutation.removedNodes.length > 0) {
                    let totalremovedNodes = mutation.removedNodes.length;
                    for (var i = 0; i < totalremovedNodes; i++) {
                        let remNode = mutation.removedNodes[i];
                        if (remNode != null && remNode.nodeName != "#text" && remNode.attributes != null) {
                            // IF HAS COM
                            if (remNode.attributes.hasOwnProperty("com")) {
                                // SI TIENE EL WATCHER
                                if (remNode.$watcher != null) {
                                    // ENTONCES EJECUTA EL METODO VALIDATE, QUE VALIDARA SI ESTA CONECTADO EL DOM Y ELIMINARA DE SER NEGATIVO
                                    remNode.$watcher.validate();
                                }
                            }
                        }
                    }
                }
                // THERE NEW INCLUDE TAG
                for (var i = 0; i < totalNodesAdded; i++) {
                    let newNode = mutation.addedNodes[i];
                    if (newNode != null && newNode.nodeName != "#text" && newNode.attributes != null) {
                        if (newNode.nodeName == "INCLUDE") {
                            newIncludes++;
                        }
                        if (newNode.attributes.hasOwnProperty("com")) {
                            // --  console.log("new component", newNode.attributes.com.value);
                            // IF HAS COM
                            newComponents++;
                        }
                    }
                }
                // SI HAY NUEVOS INCLUDES
                if (newIncludes > 0) {
                    Inspector.readIncludes();
                }
                // SI HAY NUEVOS COMPONENTES
                if (newComponents > 0) {

                    //  OBTEN TODOS LOS ELEMENTOS CON EL ATRIBUTO COM:
                    setTimeout(() => {
                        initializeNewComponents();
                    });
                }

            });
        });
        observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    }

    window.onload = function () {
        Inspector.run();
        instanceDomChange()
    };
    owner.Inspector = Inspector;
})(window);