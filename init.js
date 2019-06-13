var $poos = [];
Inspector.add("Poo", function (view) {
    $poos.push(this);
    this.name = "IM WINNI " + $poos.length;
    this.lastname = "THE POO";
    this.list = ["uno", "dos", "tres"]
    this.isover = "NO";
    this.dirty = 1;
    this.checkme = "uno";
    this.radiome = 1;
    this.born=1988;
    this.age=30;
    this.labels={
        years:"años"
    }
    this.start = function () {
        setInterval(() => {
            this.dirty = -this.dirty;
        }, 1000);
    }
    this.setInput=function(evt){
        console.log(evt);
        this.name=evt.target.value;
    }
    this.test = function () {
        console.log("%ctest", "color:red;font-size:20px;")
    }
    this.onover = function () {
        this.isover = "SI";
    }
    this.onout = function () {
        this.isover = "NO";
    }
    view.setHTML("<include src='poo.html' />")
    this.getSub=function(){
        return `<div com='Poo' ><span>{{this.name}}</span></div>`;
    }
});


function addOtherComponent() {
    Inspector.add("Poo2", function (view) {  
        this.name = "THE DONKEY";  
    });
}

function addIncludes() {
    $("body").prepend(' <include src="poo.html"></include>');
   $("body").append('<include src="paa.include.json">');
}