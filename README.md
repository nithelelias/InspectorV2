# InspectorV2
Segunda version de Inspector, con mejoras en la logica y sin usar jquery

## Instalacion
Solo se agrega al final del HTML.

```html

<script type="text/javascript" src="Inspector.v2.js"></script> 
```


## Como funciona
EL codigo crea un Objeto que se anida en el Nodo html, y en el momento en que cambia el modelo de datos del objeto inicia una actualizacion sobre ese Nodo y sus nodos hijos que a raiz de ese cambio su interfaz haya sido afectada.

Para indentificar los nodos html los cuales estaran aferrados aun modelo o componente se agrega un componente llamado com este componente tiene como entrada el nombre del componente y si es requerido un nombre de instancia las dos formas acontinuacion son validas.
```html
 <div com="Poo as mypoo">{{mypoo.name}}</div>
 <div com="Poo">{{this.name}}</div>
```

Ahora un codigo mas complejo. 

```html 
  <div com="Poo as mypoo">
    <!-- data binded to mypoo.name object  -->
    {{mypoo.name}}
    <br>
     <!-- input with the model as two way binding data-source  -->
    <input model="mypoo.name" />     
    <!-- click to clear the data will be clear and also will be updated-->
    <button onclick="mypoo.name='';"> clear </button>&nbsp;
  </div> 
  <script type="text/javascript">
    function PooClass() {
      this.name = "I am willie the poo";    
    }
    // TELL INSPECTOR TO ADD THIS OBJECT
    Inspector.add("Poo", PooClass);
  </script> 
```
### Tags, properties and actions

El inspector usa propiedades html nativas para leer eventos como onclick onchange onblur etc...
estos eventos se pueden usar tanto para ejecutar funciones globales o funciones que solo existen dentro del componente creado.

```html 
  <div com="Poo as mypoo">
    <!-- data binded to mypoo.name object  -->
    {{mypoo.name}}
    <br>
     <!-- input the name -->
    <input onInput="mypoo.setName(evt)" />     
    <!-- click to clear the data will be clear and also will be updated-->
    <button onclick="this.clear()"> clear </button>&nbsp;
  </div> 
  <script type="text/javascript">
    function PooClass() {
      this.name = "I am willie the poo";    
      this.setName=function(evt){
          this.name=evt.target.name;
      };
      this.clear=function(){
          this.name="";
      }
    }
    // TELL INSPECTOR TO ADD THIS OBJECT
    Inspector.add("Poo", PooClass);
  </script> 
```

## CONCEPTOS

* **model** :  Esta propiedad es usada en metodos de entrada o seleccion para que lea o escriba sobre  una propiedad/campo/atributo del componente, por lo tanto escribira sobre esta propiedad si hay un cambio o input sobre el, y/o actualizara sobre el DOM si hay una actualizacion sobre la propiedad/campo/atributo 
```html
    <input type='text'  model='this.name' />
    <script type="text/javascript">
        function PooClass() {
            this.name = "pedro";
        }
        Inspector.add("Poo", PooClass);
  </script>
```

* **html** : Esta propiedad  agrega HTML al nodo que lo contenga, puede ser textual un template o generado dinamicamente ejecutando un metodo.

```html
    <ul html="this.getColors()"></ul>
    <script type="text/javascript">
        function PooClass() {
            this.colors = ["red","blue","green","yellow"];        
            this.getColors=function(){
                return this.colors.map((color)=>{
                    return `<li >${color}</li>`
                }).join("");
            };
        }
        Inspector.add("Poo", PooClass);
  </script>
```
Sobre la consola js puedes ir agregando colores y automaticamente aparecera un nuevo nodo.


* **include** : This tag is used to load files as htmls, js , css or a full stack or files, Ex:

** Load html:
```html
<include src="poocomponent.html" />
```
** Load js:
```html
<inlcude src="poocomponent.js">
```
** Load full stack of files (pooocomponent.json):
```
["./pooocomponent.css","./poocomponent.js","./pooocomponent.html"]
```
```html
<include src="poocomponent.json" />
```
** know when has load file=(pooocomponent.json):
```
["./pooocomponent.css","./poocomponent.js","./pooocomponent.html"]
```
```html
<include src="poocomponent.json" onload="jsmethodcallback()" />
```
**  show some data while loading, can be anithing...
```html
<include src="somefile.html" onload="jsmethodcallback()">   ... LOADING </include>
```

 ### Methods:

 * **add** : Agrega componente.
 * **clear** : Remueve todos los componentes agregados.
 * **run** : vuelve a ejecutar el inspector para inspeccionar y evalular los componentes con el html.
 * **Includer**: Es un objeto que puede agregar archivos al HTML como html, js, mjs, css.

## Authors

* **Nithel Elias** - *Initial work* - [Nithel Elias](https://github.com/nithelelias)

Colombian Senior Developer

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

 